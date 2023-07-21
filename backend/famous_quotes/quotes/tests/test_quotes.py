from unicodedata import category
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.db.utils import IntegrityError

from quotes.models import Quote, Category, Vote
import pdb

from ..constants import *


class QuoteTest(TestCase):

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


    def test_create_quote(self):

        self.create_user_and_login('email@email.com')

        # add quote successfully
        response = self.client.post(f"{QUOTES_URL}", data={'quote': 'awesome quote', 'author': 'cool author', 'context': 'Contextual stuff'})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Quote.objects.count(), 1)

        # test that my default values have been set appropriately? 
        # probably don't need to, but just in case I change the model at a later date
        quote = Quote.objects.first()
        self.assertEqual(quote.popularity, 0.5)
        self.assertEqual(quote.net_votes, 0)
        self.assertEqual(quote.total_upvotes, 0)
        self.assertEqual(quote.total_downvotes, 0)
        self.assertEqual(quote.duplicate_votes, 0)
        self.assertEqual(quote.misattribution_votes, 0)
        self.assertEqual(quote.misattribution_resolved, 0)


    def test_create_quote_with_categories(self):

        self.create_user_and_login('email@email.com')

        # create some categories
        cat1 = Category.objects.create(category='funny')
        cat2 = Category.objects.create(category='motivational')
        cat3 = Category.objects.create(category='travel')

        # add quote successfully
        response = self.client.post(f"{QUOTES_URL}", data={'quote': 'awesome quote', 'author': 'cool author', 'context': 'Contextual stuff', 'categories': [cat1.id, cat3.id]})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Quote.objects.count(), 1)

        # check that quote has these categories
        categories = response.json()['data']['categories']
        self.assertEqual(len(categories), 2)
        self.assertEqual(set(['funny', 'travel']), set([x['category'] for x in categories]))
        self.assertEqual(set([cat1.id, cat3.id]), set([x['id'] for x in categories]))

        # test with single quote
        response = self.client.post(f"{QUOTES_URL}", data={'quote': 'awesome quote', 'author': 'cool author', 'context': 'Contextual stuff', 'categories': [cat1.id]})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Quote.objects.count(), 2)


    def test_cannot_create_quote_with_bad_categories(self):

        self.create_user_and_login('email@email.com')

        # create some categories
        cat1 = Category.objects.create(category='funny')
        cat2 = Category.objects.create(category='motivational')
        cat3 = Category.objects.create(category='travel')

        # add quote successfully
        response = self.client.post(f"{QUOTES_URL}", data={'quote': 'awesome quote', 'author': 'cool author', 'context': 'Contextual stuff', 'categories': [cat1.id+10, cat3.id+10]})
        self.assertEqual(response.status_code, 400)
        self.assertIn('categories not valid', response.json()['message'].lower())



    def test_cannot_create_quote_unless_authenticated(self):
        response = self.client.post(f"{QUOTES_URL}", data={'quote': 'awesome quote', 'author': 'cool author', 'context': 'Contextual stuff'})
        self.assertEqual(response.status_code, 401)
        self.assertEqual(Quote.objects.count(), 0)
        self.assertIn('must be logged in to submit quotes', response.json()['message'].lower())


    def test_cannot_create_quotes_without_all_required_data(self):
        self.create_user_and_login('email@email.com')

        # only QUOTE and AUTHOR currently required

        response = self.client.post(f"{QUOTES_URL}", data={'author': 'cool author', 'context': 'Contextual stuff'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('must provide a quote', response.json()['message'].lower())

        response = self.client.post(f"{QUOTES_URL}", data={'quote': 'awesome quote', 'context': 'Contextual stuff'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('must provide an author', response.json()['message'].lower())

        # fields present but blank
        response = self.client.post(f"{QUOTES_URL}", data={'quote': '', 'author': '', 'context': 'Contextual stuff'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('must provide a quote', response.json()['message'].lower())


    def test_cannot_create_short_quotes(self):
        self.create_user_and_login('email@email.com')

        # only QUOTE and AUTHOR currently required
        for i in range(1,5):
            quote = 'a' * i
            response = self.client.post(f"{QUOTES_URL}", data={'quote': quote, 'author': 'cool author', 'context': 'Contextual stuff'})
            self.assertEqual(response.status_code, 400)
            self.assertIn('quote looks to be too short', response.json()['message'].lower())
        self.assertEqual(Quote.objects.count(), 0)

        response = self.client.post(f"{QUOTES_URL}", data={'quote': 'a'*5, 'author': 'cool author'})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Quote.objects.count(), 1)


    def test_cannot_create_quote_with_bad_data(self):
        # as most fields are text/char, which can be cast, let's just screw the categories data
        self.create_user_and_login('email@email.com')

        # create some categories
        cat1 = Category.objects.create(category='funny')
        cat2 = Category.objects.create(category='motivational')
        cat3 = Category.objects.create(category='travel')

        response = self.client.post(f"{QUOTES_URL}", data={'quote': 'awesome quote', 'author': 'cool author', 'context': 'Contextual stuff', 'categories': ['funny', 'motivational']})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Quote.objects.count(), 0)
        self.assertIn('error with the supplied data', response.json()['message'].lower())


    def test_get_with_filters(self):
        # ensure not case-sensitive
        self.create_user_and_login('email@email.com')
        user = User.objects.all()[0]
        category1 = Category.objects.create(category='cool')
        category2 = Category.objects.create(category='love')

        quote1 = Quote.objects.create(quote='cool quote', author='cool author', context='cool context', user=user)
        quote1.categories.set([category1.id, category2.id])

        quote2 = Quote.objects.create(quote='cool quote2', author='cool author2', context='cool context2', user=user)
        quote2.categories.set([category1.id])

        quote3 = Quote.objects.create(quote='BORING quote', author='BORING author', context='BORING context', user=user)
        ids = [quote1.id, quote2.id, quote3.id]

        response = self.client.get(f"{QUOTES_URL}?quote=COOL")
        self.assertEqual(len(response.json()['data']), 2)

        response = self.client.get(f"{QUOTES_URL}?author=AUTHOR")
        self.assertEqual(len(response.json()['data']), 3)

        response = self.client.get(f"{QUOTES_URL}?context=BORING")
        self.assertEqual(len(response.json()['data']), 1)

        response = self.client.get(f"{QUOTES_URL}?ids={ids[0]}")
        self.assertEqual(len(response.json()['data']), 1)
        response = self.client.get(f"{QUOTES_URL}?ids={ids[0]},{ids[2]}")
        self.assertEqual(len(response.json()['data']), 2)

        response = self.client.get(f"{QUOTES_URL}?categories=love,cool")
        data = response.json()['data']
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], quote1.id)

        response = self.client.get(f"{QUOTES_URL}?categories=cool")
        response_ids = [x['id'] for x in response.json()['data']]
        self.assertEqual(len(response_ids), 2)
        self.assertIn(quote1.id, response_ids)
        self.assertIn(quote2.id, response_ids)


        # compound filters
        response = self.client.get(f"{QUOTES_URL}?quote=cool&author=2")
        self.assertEqual(len(response.json()['data']), 1)

        user_id = User.objects.first().id
        response = self.client.get(f"{QUOTES_URL}?user={user_id}")
        self.assertEqual(len(response.json()['data']), 3)



    def test_get_with_pagination(self):
        self.create_user_and_login('email@email.com')

        ids = []
        for i in range(100):
            response = self.client.post(f"{QUOTES_URL}", data={'quote': f'quote{i}', 'author': str(i), 'context': str(i)})
            ids.append(response.json()['data']['id'])

        offset, number = 20, 10
        response = self.client.get(f'{QUOTES_URL}?o={offset}&n={number}&s=oldest')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['data']), number)
        self.assertListEqual([x['id'] for x in response.json()['data']], ids[offset:offset+number])

        # assert capped at 50
        offset, number = 20, 60
        response = self.client.get(f'{QUOTES_URL}?o={offset}&n={number}&s=oldest')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['data']), 20)

        # assert no error when asking above range available
        offset, number = 95, 50
        response = self.client.get(f'{QUOTES_URL}?o={offset}&n={number}&s=oldest')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['data']), 5)


    def test_sort(self):
        self.create_user_and_login('email@email.com')

        # create some quotes
        quote1 = Quote.objects.create(quote=f'quote1', author=f'author1', context=f'context1')
        quote2 = Quote.objects.create(quote=f'quote2', author=f'author2', context=f'context2')
        quote3 = Quote.objects.create(quote=f'quote3', author=f'author3', context=f'context3')

        # add some votes to calculate associated metrics
        Vote.objects.create(quote_id=quote1.id, value=1)
        Vote.objects.create(quote_id=quote1.id, value=1)
        Vote.objects.create(quote_id=quote1.id, value=-1)

        Vote.objects.create(quote_id=quote2.id, value=1)
        Vote.objects.create(quote_id=quote2.id, value=1)

        Vote.objects.create(quote_id=quote3.id, value=-1)

        quote1.refresh_from_db()
        quote2.refresh_from_db()
        quote3.refresh_from_db()

        # test sorting responses
        response = self.client.get(f'{QUOTES_URL}?s=popularity')
        popularities = [round(x['popularity'],2) for x in response.json()['data']]
        # self.assertListEqual(popularities, [0, 0.67, 1])
        self.assertListEqual([x['id'] for x in response.json()['data']], [quote3.id, quote1.id, quote2.id])

        response = self.client.get(f'{QUOTES_URL}') # don't specify -popularity - it is the default
        popularities = [round(x['popularity'],2) for x in response.json()['data']]
        # self.assertListEqual(popularities, [1, 0.67, 0])
        self.assertListEqual([x['id'] for x in response.json()['data']], [quote2.id, quote1.id, quote3.id])

        response = self.client.get(f'{QUOTES_URL}?s=total_upvotes')
        self.assertListEqual([x['total_upvotes'] for x in response.json()['data']], [0, 2, 2])

        response = self.client.get(f'{QUOTES_URL}?s=-net_votes')
        self.assertListEqual([x['net_votes'] for x in response.json()['data']], [2, 1, -1])

        response = self.client.get(f'{QUOTES_URL}?s=oldest')
        self.assertListEqual([x['id'] for x in response.json()['data']], [quote1.id, quote2.id, quote3.id])

        response = self.client.get(f'{QUOTES_URL}?s=newest')
        self.assertListEqual([x['id'] for x in response.json()['data']], [quote3.id, quote2.id, quote1.id])


    def test_sort_default(self):
        '''Default config should be to sort by popularity AND total_votes. A quote with more votes should
        get priority, so logn as popularity is also equal.'''
        self.create_user_and_login('email@email.com')

        # create some quotes
        quote1 = Quote.objects.create(quote=f'quote1', author=f'author1', context=f'context1')
        quote2 = Quote.objects.create(quote=f'quote2', author=f'author2', context=f'context2')

        # add two quotes with 100% popularity but one with more votes - it should come first
        Vote.objects.create(quote_id=quote1.id, value=1)
        Vote.objects.create(quote_id=quote1.id, value=1)

        Vote.objects.create(quote_id=quote2.id, value=1)
        Vote.objects.create(quote_id=quote2.id, value=1)
        Vote.objects.create(quote_id=quote2.id, value=1)

        quote1.refresh_from_db()
        quote2.refresh_from_db()

        # test sorting responses
        response = self.client.get(f'{QUOTES_URL}')
        self.assertEqual(response.json()['data'][0]['id'], quote2.id)
        self.assertEqual(response.json()['data'][1]['id'], quote1.id)


    def test_sort_with_non_allowable_variable(self):
        self.create_user_and_login('email@email.com')

        self.client.post(f"{QUOTES_URL}", data={'quote': 'quote1', 'author': 'author', 'context': 'context'})
        self.client.post(f"{QUOTES_URL}", data={'quote': 'quote2', 'author': 'author', 'context': 'context'})

        response = self.client.get(f"{QUOTES_URL}?s=quote")
        self.assertEqual(response.status_code, 400)
        self.assertIn('sort value not allowed', response.json()['message'].lower())


    def test_with_non_allowable_n_o_values(self):
        self.create_user_and_login('email@email.com')

        self.client.post(f"{QUOTES_URL}", data={'quote': 'quote1', 'author': 'author', 'context': 'context'})
        self.client.post(f"{QUOTES_URL}", data={'quote': 'quote2', 'author': 'author', 'context': 'context'})

        response = self.client.get(f"{QUOTES_URL}?o=quote")
        self.assertEqual(response.status_code, 400)
        self.assertIn('offset value invalid', response.json()['message'].lower())

        response = self.client.get(f"{QUOTES_URL}?n=quote")
        self.assertEqual(response.status_code, 400)
        self.assertIn('n value invalid', response.json()['message'].lower())

    def test_popularity_adjustments(self):
        quote1 = Quote(quote='quote1', author='author1')
        quote2 = Quote(quote='quote2', author='author2')
        quote3 = Quote(quote='quote3', author='author3')

        quote1.update_votes(1)
        quote2.update_votes(-1)
        self.assertEqual(quote1.popularity, 0.8)
        self.assertEqual(quote2.popularity, 0.2)

        for _ in range(9):
            quote1.update_votes(1)
            quote2.update_votes(-1)
        self.assertAlmostEqual(quote1.popularity, 0.9)
        self.assertAlmostEqual(quote2.popularity, 0.1)

        for _ in range(10):
            quote1.update_votes(1)
            quote2.update_votes(-1)
        self.assertEqual(quote1.popularity, 1.0)
        self.assertEqual(quote2.popularity, 0.0)

    def test_merge(self):
        quote1 = Quote.objects.create(quote='quote1', author='author1')
        quote2 = Quote.objects.create(quote='quote2', author='author2')
        category1 = Category.objects.create(category='cat1')
        quote2.categories.add(category1)

        Vote.objects.create(quote=quote1, value=1)  # quote 1 upvote
        Vote.objects.create(quote=quote2, value=1)  # 3x quote 2 upvote
        Vote.objects.create(quote=quote2, value=1)
        Vote.objects.create(quote=quote2, value=1)
        Vote.objects.create(quote=quote2, value=-1)  # quote 2 downvote

        quote1.merge_with(quote2)

        self.assertEqual(quote2.redirect_quote, quote1.id)

        self.assertEqual(quote1.total_upvotes, 4)
        self.assertEqual(quote1.total_downvotes, 1)
        self.assertEqual(quote2.total_upvotes, 0)
        self.assertEqual(quote2.total_downvotes, 0)
        self.assertIn(category1, quote1.categories.all())

        self.assertEqual(Vote.objects.filter(quote=quote1).count(), 5)
        self.assertEqual(Vote.objects.filter(quote=quote1, value=1).count(), 4)
        self.assertEqual(Vote.objects.filter(quote=quote1, value=-1).count(), 1)
        self.assertEqual(Vote.objects.filter(quote=quote2).count(), 0)


    def test_quotes_with_redirect(self):
        quote1 = Quote.objects.create(quote='quote1', author='author1')
        quote2 = Quote.objects.create(quote='quote2', author='author2')
        category1 = Category.objects.create(category='cat1')
        quote2.categories.add(category1)

        # returns all quotes before redirect
        response = self.client.get(f'{QUOTES_URL}')
        self.assertEqual(len(response.json()['data']), 2)

        # set up redirect
        quote1.redirect_quote = quote2.id
        quote1.save()

        # returns quote2 only after redirect
        response = self.client.get(f'{QUOTES_URL}')
        self.assertEqual(len(response.json()['data']), 1)
        self.assertEqual(response.json()['data'][0]['id'], quote2.id)

        # returns both quotes if ids specified
        response = self.client.get(f'{QUOTES_URL}?ids={quote1.id},{quote2.id}')
        ids = [x['id'] for x in response.json()['data']]
        self.assertEqual(len(ids), 2)
        self.assertIn(quote1.id, ids)
        self.assertIn(quote2.id, ids)

