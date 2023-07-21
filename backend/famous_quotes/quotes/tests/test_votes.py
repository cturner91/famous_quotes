from datetime import datetime
import pytz

from django.test import TestCase, Client
from django.contrib.auth.models import User

from quotes.models import Quote, Category, Vote

import pdb

from ..constants import *


class VoteTest(TestCase):

    def setUp(self):
        self.client = Client()

    def create_user(self, email):
        response = self.client.post(f"{USERS_URL}", data={'email': email, 'password1': 'StrongPassword', 'password2': 'StrongPassword'})
        return response.json()

    def login(self, email):
        self.client.post(LOGIN_URL, data={'email': email, 'password': 'StrongPassword'})

    def create_user_and_login(self, email):
        self.create_user(email)
        self.login(email)
    
    def create_quote(self, quote='Quote text', author='Quote author', context='Context'):
        response = self.client.post(QUOTES_URL, data={'quote': quote, 'author': author, 'context': context})
        if response.status_code == 201:
            return response.json()
        else:
            raise KeyError('Quote creation failed...')



    def test_create_vote(self):
        self.create_user_and_login('email@email.com')
        response = self.create_quote()
        quote_id = response['data']['id']

        # submit a vote for this quote
        response = self.client.post(VOTES_URL, data={'quote_id': quote_id, 'value': 1})  # user and session should come automatically from the request
        self.assertEqual(response.status_code, 201)
        self.assertIn('OK', response.json()['message'])

        # ensure the rest of the metrics are updated appropriately
        quote_id = response.json()['data']['quote']
        quote_response = self.client.get(f"{QUOTES_URL}?id={quote_id}")
        quote = quote_response.json()['data'][0]
        self.assertEqual(quote['total_upvotes'], 1)
        self.assertEqual(quote['total_downvotes'], 0)
        self.assertEqual(quote['net_votes'], 1)
        self.assertEqual(quote['popularity'], 0.8)


    def test_create_multiple_votes_successfully(self):
        self.create_user_and_login('email@email.com')
        response = self.create_quote()
        quote_id = response['data']['id']

        # submit multiple votes for this quote
        # can't use self.client - need different sessions
        # lol, need to be authenticated to submit requests... going to have to create 3 users...
        response = self.client.post(VOTES_URL, data={'quote_id': quote_id, 'value': 1})
        self.create_user_and_login('email2@email.com')
        response = self.client.post(VOTES_URL, data={'quote_id': quote_id, 'value': 1})
        self.create_user_and_login('email3@email.com')
        response = self.client.post(VOTES_URL, data={'quote_id': quote_id, 'value': -1})

        # ensure the rest of the metrics are updated appropriately
        quote_id = response.json()['data']['quote']
        quote_response = self.client.get(f"{QUOTES_URL}?id={quote_id}")
        quote = quote_response.json()['data'][0]
        self.assertEqual(quote['total_upvotes'], 2)
        self.assertEqual(quote['total_downvotes'], 1)
        self.assertEqual(quote['net_votes'], 1)
        # self.assertAlmostEqual(quote['popularity'], 0.667, places=2)


    def test_same_user_cannot_vote_twice_quickly(self):
        self.create_user_and_login('email@email.com')
        response = self.create_quote()
        quote_id = response['data']['id']

        response = self.client.post(VOTES_URL, data={'quote_id': quote_id, 'value': 1})
        response = self.client.post(VOTES_URL, data={'quote_id': quote_id, 'value': 1})
        self.assertEqual(response.status_code, 400)
        self.assertIn('vote twice', response.json()['message'])


    # should be able to vote even if not logged in
    def test_vote_accepted_if_not_logged_in(self):
        # need to be logged in to create a quote
        self.create_user_and_login('email@email.com')
        response = self.create_quote()
        assert Quote.objects.count() == 1

        # logout
        self.client.post(LOGOUT_URL)

        # now trying to vote should be fine
        quote_id = response['data']['id']
        response = self.client.post(VOTES_URL, data={'quote_id': quote_id, 'value': 1})
        self.assertEqual(response.status_code, 201)


    def test_vote_rejected_if_not_all_required_fields(self):
        # requires quote and value
        self.create_user_and_login('email@email.com')
        response = self.create_quote()
        quote_id = response['data']['id']

        response = self.client.post(VOTES_URL, data={'quote_id': quote_id})
        self.assertEqual(response.status_code, 400)
        self.assertIn('needs a value', response.json()['message'])

        response = self.client.post(VOTES_URL, data={'value': 1})
        self.assertEqual(response.status_code, 400)
        self.assertIn('needs a quote', response.json()['message'])


    def test_vote_fails_for_bad_value(self):
        # value must be +/- 1
        self.create_user_and_login('email@email.com')
        response = self.create_quote()
        quote_id = response['data']['id']

        response = self.client.post(VOTES_URL, data={'quote_id': quote_id, 'value': 2})
        self.assertEqual(response.status_code, 400)
        self.assertIn('+/- 1', response.json()['message'])

        response = self.client.post(VOTES_URL, data={'quote_id': quote_id, 'value': -3.5})
        self.assertEqual(response.status_code, 400)
        self.assertIn('integer', response.json()['message'])

        response = self.client.post(VOTES_URL, data={'quote_id': quote_id, 'value': 'hello'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('integer', response.json()['message'])


    def test_vote_fails_for_bad_quote_id(self):
        self.create_user_and_login('email@email.com')
        response = self.create_quote()
        quote_id = response['data']['id'] + 5

        response = self.client.post(VOTES_URL, data={'quote_id': quote_id, 'value': 1})
        self.assertEqual(response.status_code, 400)
        self.assertIn('provided data', response.json()['message'])


    def test_get_with_quote(self):
        self.create_user_and_login('email@email.com')
        user = User.objects.all()[0]
        quote1 = Quote.objects.create(quote='quote1', author='author1')
        quote2 = Quote.objects.create(quote='quote2', author='author2')

        Vote.objects.create(value=1, user=user, quote=quote1)
        Vote.objects.create(value=1, user=user, quote=quote1)
        Vote.objects.create(value=1, user=user, quote=quote2)

        response = self.client.get(f'{VOTES_URL}?quote={quote1.id}')
        votes = response.json()['data']
        self.assertEqual(len(votes), 2)
        self.assertEqual(votes[0]['value'], 1)
        self.assertEqual(votes[0]['quote'], quote1.id)
        self.assertEqual(votes[1]['quote'], quote1.id)

    def test_get_with_user(self):
        self.create_user_and_login('email@email.com')
        user1 = User.objects.all()[0]
        user2 = User.objects.create(username='lol', email='email@email.com', password='password')
        quote1 = Quote.objects.create(quote='quote1', author='author1')
        quote2 = Quote.objects.create(quote='quote2', author='author2')

        Vote.objects.create(value=1, user=user1, quote=quote1)
        Vote.objects.create(value=1, user=user2, quote=quote1)
        Vote.objects.create(value=1, user=user1, quote=quote2)

        response = self.client.get(f'{VOTES_URL}?user={user1.id}')
        votes = response.json()['data']
        self.assertEqual(len(votes), 2)
        votes_quotes = [x['quote'] for x in votes]
        self.assertIn(quote1.id, votes_quotes)
        self.assertIn(quote2.id, votes_quotes)


    def test_get_with_expand(self):
        self.create_user_and_login('email@email.com')
        user = User.objects.all()[0]
        quote1 = Quote.objects.create(quote='quote1', author='author1')
        quote2 = Quote.objects.create(quote='quote2', author='author2')

        Vote.objects.create(value=1, user=user, quote=quote1)
        Vote.objects.create(value=1, user=user, quote=quote1)
        Vote.objects.create(value=1, user=user, quote=quote2)

        response = self.client.get(f'{VOTES_URL}?quote={quote1.id}&x=true')
        votes = response.json()['data']
        self.assertEqual(len(votes), 2)
        self.assertEqual(votes[0]['value'], 1)
        self.assertEqual(votes[0]['quote']['id'], quote1.id)
        self.assertEqual(votes[1]['quote']['id'], quote1.id)

        # ensure created_at is serialised appropriately
        self.assertEqual(len(votes[0]['created_at']), 10)
        self.assertEqual(datetime.strptime(votes[0]['created_at'], '%Y-%m-%d').date(), datetime.now().date())
        self.assertEqual(votes[1]['quote']['quote'], 'quote1')
        self.assertEqual(votes[1]['quote']['author'], 'author1')


    def test_get_summary(self):
        self.create_user_and_login('email@email.com')
        user = User.objects.all()[0]
        quote1 = Quote.objects.create(quote='quote1', author='author1')
        quote2 = Quote.objects.create(quote='quote2', author='author2')

        vote1 = Vote.objects.create(value=1, user=user, quote=quote1)
        vote2 = Vote.objects.create(value=1, user=user, quote=quote1)
        vote3 = Vote.objects.create(value=-1, user=user, quote=quote1)

        vote4 = Vote.objects.create(value=-1, user=user, quote=quote2)
        vote5 = Vote.objects.create(value=-1, user=user, quote=quote2)
        vote6 = Vote.objects.create(value=-1, user=user, quote=quote2)

        for (vote, dt) in [
            [vote1, datetime(2023,1,1, tzinfo=pytz.UTC)],
            [vote2, datetime(2023,1,1, tzinfo=pytz.UTC)],
            [vote3, datetime(2022,12,1, tzinfo=pytz.UTC)],
            [vote4, datetime(2022,1,1, tzinfo=pytz.UTC)],
            [vote5, datetime(2022,2,1, tzinfo=pytz.UTC)],
            [vote6, datetime(2022,3,1, tzinfo=pytz.UTC)],
        ]:
            vote.created_at = dt
            vote.save()

        response = self.client.get(f'{VOTES_URL}?user={user.id}')
        summary = response.json()['summary']
        self.assertDictEqual(summary['monthly'], {
            '2022-01': {'upvotes': 0, 'downvotes': 1},
            '2022-02': {'upvotes': 0, 'downvotes': 1},
            '2022-03': {'upvotes': 0, 'downvotes': 1},
            '2022-12': {'upvotes': 0, 'downvotes': 1},
            '2023-01': {'upvotes': 2, 'downvotes': 0},
        })
        self.assertDictEqual(summary['daily'], {
            '2022-01-01': {'upvotes': 0, 'downvotes': 1},
            '2022-02-01': {'upvotes': 0, 'downvotes': 1},
            '2022-03-01': {'upvotes': 0, 'downvotes': 1},
            '2022-12-01': {'upvotes': 0, 'downvotes': 1},
            '2023-01-01': {'upvotes': 2, 'downvotes': 0},
        })



    def test_get_with_bad_quote_fails_successfully(self):
        self.create_user_and_login('email@email.com')
        user = User.objects.all()[0]
        quote = Quote.objects.create(quote='quote1', author='author1')        
        vote = Vote.objects.create(value=1, user=user, quote=quote)

        response = self.client.get(f'{VOTES_URL}?quote=quote1')
        self.assertEqual(response.status_code, 400)
        self.assertIn('bad quote', response.json()['message'].lower())

        response = self.client.get(f'{VOTES_URL}?quote={quote.id+10}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['data']), 0)

    def test_get_with_bad_user_fails_successfully(self):
        self.create_user_and_login('email@email.com')
        user = User.objects.all()[0]
        quote = Quote.objects.create(quote='quote1', author='author1')        
        vote = Vote.objects.create(value=1, user=user, quote=quote)

        response = self.client.get(f'{VOTES_URL}?user=user1')
        self.assertEqual(response.status_code, 400)
        self.assertIn('bad user', response.json()['message'].lower())

    def test_cannot_get_with_another_users_votes(self):
        self.create_user_and_login('email@email.com')
        user1 = User.objects.all()[0]
        user2 = User.objects.create(username='lol', email='email@email.com', password='password')
        quote = Quote.objects.create(quote='quote1', author='author1')        
        vote1 = Vote.objects.create(value=1, user=user1, quote=quote)
        vote2 = Vote.objects.create(value=-1, user=user2, quote=quote)

        # user1 is logged in
        response = self.client.get(f'{VOTES_URL}?user={user2.id}')
        self.assertEqual(response.status_code, 403)
        self.assertIn('forbidden', response.json()['message'].lower())

    def test_cannot_get_without_filter(self):
        self.create_user_and_login('email@email.com')
        user = User.objects.all()[0]
        quote = Quote.objects.create(quote='quote1', author='author1')        
        vote = Vote.objects.create(value=1, user=user, quote=quote)

        response = self.client.get(f'{VOTES_URL}')
        self.assertEqual(response.status_code, 400)
        self.assertIn('filter by quote or by user', response.json()['message'].lower())
