from django.test import TestCase, Client
from django.contrib.auth.models import User

from quotes.models import Quote, Category, Vote, QuoteList

import pdb

from ..constants import *


class QuoteListTest(TestCase):

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


    def test_create_quotelist(self):
        self.create_user_and_login('email@email.com')
        response = self.client.post(QUOTELIST_URL, data={'name': 'New list'})
        self.assertEqual(response.status_code, 201)
        for key in ['id','name', 'external_id', 'quotes']:
            self.assertIn(key, response.json()['data'].keys())
        
        # test that external_id has been created
        external_id = response.json()['data']['external_id']
        self.assertEqual(len(external_id), 8)


    def test_create_quotelist_and_add_quotes(self):
        self.create_user_and_login('email@email.com')
        quote1 = self.create_quote_with_number(1)
        quote2 = self.create_quote_with_number(2)
        quote3 = self.create_quote_with_number(3)

        response = self.client.post(QUOTELIST_URL, data={'name': 'New list'})
        quotelist_id = response.json()['data']['id']

        response = self.put(QUOTELIST_URL, data={'id': quotelist_id, 'quote_ids': [quote1.id, quote3.id]})
        quotelist_id = response.json()['data']['id']
        self.assertEqual(response.status_code, 200)

        response = self.client.get(f'{QUOTELIST_URL}?id={quotelist_id}')
        quote_ids = response.json()['data']['quotes']
        self.assertEqual(len(quote_ids), 2)


    def test_cannot_create_quotelist_with_blank_name(self):
        self.create_user_and_login('email@email.com')
        response = self.client.post(QUOTELIST_URL, data={'name': ''})
        self.assertEqual(response.status_code, 400)
        self.assertIn('must provide a name for quote-list', response.json()['message'].lower())


    def test_cannot_create_quotelist_with_duplicate_name(self):
        self.create_user_and_login('email@email.com')
        response = self.client.post(QUOTELIST_URL, data={'name': 'New list'})
        response = self.client.post(QUOTELIST_URL, data={'name': 'NEW LIST'})  # should be case insensitive
        self.assertEqual(response.status_code, 400)
        self.assertIn('must provide a unique name for quote-list', response.json()['message'].lower())


    def test_get_quotelist(self):
        self.create_user_and_login('email@email.com')
        quote1 = Quote.objects.create(quote='quote1', author='author1')
        quote2 = Quote.objects.create(quote='quote2', author='author2')
        quote3 = Quote.objects.create(quote='quote3', author='author3')
        quote4 = Quote.objects.create(quote='quote4', author='author4')
        quote_ids = [quote1.id, quote2.id, quote4.id]

        response = self.client.post(QUOTELIST_URL, data={'name': 'New list'})
        quotelist_id = response.json()['data']['id']
        response = self.put(QUOTELIST_URL, data={'name': 'New list', 'quote_ids': quote_ids})

        response = self.client.get(f'{QUOTELIST_URL}?id={quotelist_id}')

        # assert the content of those quotes
        quote_ids_string = ','.join([str(x) for x in quote_ids])
        response = self.client.get(f'{QUOTES_URL}?ids={quote_ids_string}')
        quotes = response.json()['data']
        self.assertEqual(quotes[0]['quote'], 'quote1')
        self.assertEqual(quotes[1]['quote'], 'quote2')
        self.assertEqual(quotes[2]['quote'], 'quote4')


    def test_get_quotelist_fails_if_not_authenticated(self):
        self.create_user_and_login('email@email.com')
        response = self.client.post(QUOTELIST_URL, data={'name': 'New list'})
        quotelist_id = response.json()['data']['id']

        # works when authenticated
        response = self.client.get(f'{QUOTELIST_URL}?id={quotelist_id}')
        self.assertEqual(response.status_code, 200)

        # doesn't work when logged out
        self.client.post(LOGOUT_URL)
        response = self.client.get(f'{QUOTELIST_URL}?id={quotelist_id}')
        self.assertEqual(response.status_code, 401)


    def test_cannot_get_quotelist_of_another_user(self):
        self.create_user_and_login('email@email.com')
        response = self.client.post(QUOTELIST_URL, data={'name': 'New list'})
        quotelist_id = response.json()['data']['id']

        self.create_user_and_login('email2@email.com')
        response = self.client.get(f'{QUOTELIST_URL}?id={quotelist_id}')
        self.assertEqual(response.status_code, 400)


    def test_create_quotelist_fails_without_name(self):
        self.create_user_and_login('email@email.com')
        response = self.client.post(QUOTELIST_URL, data={'badly-named-variable': ''})
        self.assertEqual(response.status_code, 400)

    
    def test_create_quotelist_fails_without_user(self):
        response = self.client.post(QUOTELIST_URL, data={'name': 'New list'})
        self.assertEqual(response.status_code, 401)


    def test_delete_quotelist(self):
        self.create_user_and_login('email@email.com')
        response = self.client.post(QUOTELIST_URL, data={'name': 'New list'})
        quotelist_id = response.json()['data']['id']
        self.assertEqual(response.status_code, 201)

        response = self.delete(QUOTELIST_URL, data={'name': 'NEW LIST'})  # ensure case insensitive
        self.assertEqual(response.status_code, 200)

        response = self.client.get(f"{QUOTELIST_URL}?id={quotelist_id}")
        self.assertEqual(response.status_code, 400)
        self.assertIn('could not find this quote-list', response.json()['message'].lower())


    def test_delete_quotelist_with_quotes(self):
        quote1 = self.create_quote_with_number(1)
        quote2 = self.create_quote_with_number(2)
        quote3 = self.create_quote_with_number(3)

        self.create_user_and_login('email@email.com')
        response = self.client.post(QUOTELIST_URL, data={'name': 'New list'})
        quotelist_id = response.json()['data']['id']
        response = self.put(QUOTELIST_URL, {'name': 'New list', 'quote_ids': [quote1.id, quote2.id, quote3.id]})

        response = self.delete(QUOTELIST_URL, data={'name': 'NEW LIST'})  # ensure case insensitive
        self.assertEqual(response.status_code, 200)

        response = self.client.get(f"{QUOTELIST_URL}?id={quotelist_id}")
        self.assertEqual(response.status_code, 400)
        self.assertIn('could not find this quote-list', response.json()['message'].lower())
        

    def test_delete_quotelist_fails_without_authentication(self):
        self.create_user_and_login('email@email.com')
        response = self.client.post(QUOTELIST_URL, data={'name': 'New list'})
        quotelist_id = response.json()['data']['id']
        self.assertEqual(response.status_code, 201)

        self.client.post(LOGOUT_URL)
        response = self.delete(QUOTELIST_URL, data={'id': quotelist_id})
        self.assertEqual(response.status_code, 401)


    def test_cannot_delete_another_users_quotelist(self):
        self.create_user_and_login('email@email.com')
        response = self.client.post(QUOTELIST_URL, data={'name': 'New list'})
        quotelist_id = response.json()['data']['id']
        self.assertEqual(response.status_code, 201)

        self.create_user_and_login('email2@email.com')
        response = self.delete(QUOTELIST_URL, data={'id': quotelist_id})
        self.assertEqual(response.status_code, 400)


    def test_get_all_quotelists(self):
        quote1 = self.create_quote_with_number(1)
        quote2 = self.create_quote_with_number(2)
        quote3 = self.create_quote_with_number(3)

        self.create_user_and_login('email@email.com')
        self.client.post(QUOTELIST_URL, data={'name': 'List1'})
        self.put(QUOTELIST_URL, {'name': 'List1', 'quote_ids': [quote1.id, quote2.id, quote3.id]})

        self.client.post(QUOTELIST_URL, data={'name': 'List2'})
        self.put(QUOTELIST_URL, {'name': 'List2', 'quote_ids': [quote1.id, quote3.id]})

        self.client.post(QUOTELIST_URL, data={'name': 'List3'})
        self.put(QUOTELIST_URL, {'name': 'List3', 'quote_ids': []})

        # verify the objects have been set up correctly
        self.assertEqual(Quote.objects.count(), 3)
        self.assertEqual(QuoteList.objects.count(), 3)
        self.assertEqual(len(QuoteList.objects.order_by('id')[0].quotes.all()), 3)
        self.assertEqual(len(QuoteList.objects.order_by('id')[1].quotes.all()), 2)
        self.assertEqual(len(QuoteList.objects.order_by('id')[2].quotes.all()), 0)

        # verify the responses make sense
        response = self.client.get(QUOTELIST_URL)
        data = response.json()['data']

        quotelist1 = [x for x in data if x['name']=='List1'][0]
        quotes = quotelist1['quotes']
        quotes_ids = [x['id'] for x in quotes]
        self.assertIn(quote1.id, quotes_ids)
        self.assertIn(quote2.id, quotes_ids)
        self.assertIn(quote3.id, quotes_ids)

        quotelist2 = [x for x in data if x['name']=='List2'][0]
        quotes = quotelist2['quotes']
        quotes_ids = [x['id'] for x in quotes]
        self.assertIn(quote1.id, quotes_ids)
        self.assertIn(quote3.id, quotes_ids)

        quotelist3 = [x for x in data if x['name']=='List3'][0]
        self.assertEqual(len(quotelist3['quotes']), 0)

    def test_cannot_get_another_users_quotelists(self):
        quote1 = self.create_quote_with_number(1)
        quote2 = self.create_quote_with_number(2)
        quote3 = self.create_quote_with_number(3)

        self.create_user_and_login('email@email.com')
        self.client.post(QUOTELIST_URL, data={'name': 'List1'})
        self.put(QUOTELIST_URL, {'name': 'List1', 'quote_ids': [quote1.id, quote3.id]})

        # ensure objects have been created as expected
        self.assertEqual(Quote.objects.count(), 3)
        self.assertEqual(QuoteList.objects.count(), 1)
        self.assertEqual(len(QuoteList.objects.all()[0].quotes.all()), 2)

        # ensure original user can get their list
        response = self.client.get(QUOTELIST_URL)
        data = response.json()['data']
        self.assertEqual(len(data), 1)

        # create new user and ensure they can't access this list
        self.create_user_and_login('email2@email2.com')
        response = self.client.get(QUOTELIST_URL)
        data = response.json()['data']
        self.assertEqual(len(data), 0)

    def test_quotelist_cannot_append_and_delete(self):
        self.create_user_and_login('email@email.com')
        quote1 = self.create_quote_with_number(1)
        quote2 = self.create_quote_with_number(2)
        quote3 = self.create_quote_with_number(3)

        response = self.client.post(QUOTELIST_URL, data={'name': 'New list'})
        quotelist_id = response.json()['data']['id']
        self.put(QUOTELIST_URL, data={'name': 'New list', 'quote_ids': [quote1.id]})

        # with append, directly adds to list
        response = self.put(f'{QUOTELIST_URL}', data={'name': 'New list', 'quote_ids': [quote3.id], 'append': True, 'delete': True})
        self.assertEqual(response.status_code, 400)
        self.assertIn('delete and append', response.json()['message'])


    def test_quotelist_append(self):
        self.create_user_and_login('email@email.com')
        quote1 = self.create_quote_with_number(1)
        quote2 = self.create_quote_with_number(2)
        quote3 = self.create_quote_with_number(3)

        response = self.client.post(QUOTELIST_URL, data={'name': 'New list'})
        quotelist_id = response.json()['data']['id']
        self.put(QUOTELIST_URL, data={'name': 'New list', 'quote_ids': [quote1.id]})

        quotelist = QuoteList.objects.get(id=quotelist_id)
        self.assertEqual(len(quotelist.quotes.all()), 1)

        # with append, directly adds to list
        response = self.put(f'{QUOTELIST_URL}', data={'name': 'New list', 'quote_ids': [quote3.id], 'append': True})
        quotelist = QuoteList.objects.get(id=quotelist_id)
        self.assertEqual(len(quotelist.quotes.all()), 2)
        self.assertIn(quote1.id, [x.id for x in quotelist.quotes.all()])
        self.assertIn(quote3.id, [x.id for x in quotelist.quotes.all()])

        # without 'append', sets list directly
        response = self.put(f'{QUOTELIST_URL}', data={'name': 'New list', 'quote_ids': [quote3.id], 'append': False})
        quotelist = QuoteList.objects.get(id=quotelist_id)
        self.assertEqual(len(quotelist.quotes.all()), 1)
        self.assertIn(quote3.id, [x.id for x in quotelist.quotes.all()])
        self.assertNotIn(quote1.id, [x.id for x in quotelist.quotes.all()])


    def test_quotelist_delete(self):
        self.create_user_and_login('email@email.com')
        user = User.objects.all()[0]
        quote1 = self.create_quote_with_number(1)
        quote2 = self.create_quote_with_number(2)
        quote3 = self.create_quote_with_number(3)

        quotelist = QuoteList.objects.create(name='my list', user=user)
        quotelist.quotes.add(quote1)
        quotelist.quotes.add(quote2)
        quotelist.quotes.add(quote3)
        quotelist.save()

        # verify all quotes have been added to list
        self.assertEqual(len(quotelist.quotes.all()), 3)

        # send a delete request
        self.put(f'{QUOTELIST_URL}', data={'name': 'my list', 'quote_ids': [quote3.id], 'delete': True})

        self.assertEqual(len(quotelist.quotes.all()), 2)
        self.assertIn(quote1.id, [x.id for x in quotelist.quotes.all()])
        self.assertIn(quote2.id, [x.id for x in quotelist.quotes.all()])


    def test_add_quote_to_list_where_it_already_exists(self):
        self.create_user_and_login('email@email.com')
        quote1 = self.create_quote_with_number(1)
        quotelist = QuoteList.objects.create(name='New list', user_id=User.objects.all()[0].id)
        quotelist.quotes.add(quote1.id)
        quotelist.save()

        response = self.put(QUOTELIST_URL, data={'name': 'New list', 'quote_ids': [quote1.id], 'append': True})
        self.assertEqual(response.status_code, 400)
        self.assertIn('already in list', response.json()['message'])

    def test_get_quotelist_with_external_id(self):
        self.create_user_and_login('email@email.com')
        quote1 = self.create_quote_with_number(1)
        quotelist = QuoteList.objects.create(name='New list', user_id=User.objects.all()[0].id)
        quotelist.quotes.add(quote1.id)
        quotelist.save()
        quotelist.refresh_from_db()

        # get via regular id while authenticated
        response = self.client.get(f'{QUOTELIST_URL}?id={quotelist.id}')
        self.assertEqual(response.status_code, 200)

        # logout - cannot query by ID but can by EID
        self.client.post(LOGOUT_URL)
        response = self.client.get(f'{QUOTELIST_URL}?id={quotelist.id}')
        self.assertEqual(response.status_code, 401)

        response = self.client.get(f'{QUOTELIST_URL}?eid={quotelist.external_id}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['data'][0]['quotes'][0]['id'], quote1.id)
