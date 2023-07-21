from django.test import TestCase, Client
from django.contrib.auth.models import User

from quotes.models import Quote

import pdb

from ..constants import *


class QuoteListTest(TestCase):
    '''As this functionality spans a lot of the other ones too, it didn't feel right to keep it
    in with one of the other test classes. This is a much bigger-picture functionality to test.'''

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

    def create_quote_with_number(self, n=1):
        quote = Quote.objects.create(quote=f'quote{n}', author=f'author{n}')
        return quote

    def put(self, url, *args, **kwargs):
        return self.client.put(url, content_type='application/json', *args, **kwargs)

    def delete(self, url, *args, **kwargs):
        return self.client.delete(url, content_type='application/json', *args, **kwargs)


    def test_get_user_summary(self):
        self.create_user_and_login('email@email.com')
        user = User.objects.all()[0]
        quote1 = self.client.post(f"{QUOTES_URL}", data={'quote': 'Quote1', 'author': 'Author1'}).json()['data']
        quote2 = self.client.post(f"{QUOTES_URL}", data={'quote': 'Quote2', 'author': 'Author2'}).json()['data']
        quote3 = self.client.post(f"{QUOTES_URL}", data={'quote': 'Quote3', 'author': 'Author3'}).json()['data']

        # add quotes to a list
        self.client.post(f"{QUOTELIST_URL}", data={'name': 'List1'})
        self.put(f"{QUOTELIST_URL}", data={"name": "List1", "quote_ids": [quote1['id'], quote3['id']]})

        # add votes to some quotes
        self.client.post(f"{VOTES_URL}", data={"quote_id": quote1['id'], "value": 1})
        self.client.post(f"{VOTES_URL}", data={"quote_id": quote3['id'], "value": -1})

        # query summary view - let's see everything this user has done
        response = self.client.get(f"{USERS_URL}?id={user.id}&s=1")
        data = response.json()

        # pdb.set_trace()
        self.assertEqual(response.status_code, 200)
        self.assertIn('user', data.keys())
        self.assertIn('votes', data['user'].keys())
        self.assertIn('quotes', data['user'].keys())
        self.assertIn('quotelists', data['user'].keys())

        self.assertEqual(data['user']['id'], user.id)
        self.assertEqual(data['user']['email'], 'email@email.com')

        self.assertIn(quote1['id'], [quote['id'] for quote in data['user']['quotes']])
        self.assertIn(quote2['id'], [quote['id'] for quote in data['user']['quotes']])
        self.assertIn(quote3['id'], [quote['id'] for quote in data['user']['quotes']])

        self.assertIn('List1', [quotelist['name'] for quotelist in data['user']['quotelists']])
        self.assertIn(quote1['id'], [quote['id'] for quote in data['user']['quotelists'][0]['quotes']])
        self.assertIn(quote3['id'], [quote['id'] for quote in data['user']['quotelists'][0]['quotes']])
        self.assertNotIn(quote2['id'], [quote['id'] for quote in data['user']['quotelists'][0]['quotes']])

        vote_quote1 = [x for x in data['user']['votes'] if x['quote']['id']==quote1['id']][0]
        self.assertEqual(vote_quote1['value'], 1)

        vote_quote3 = [x for x in data['user']['votes'] if x['quote']['id']==quote3['id']][0]
        self.assertEqual(vote_quote3['value'], -1)
