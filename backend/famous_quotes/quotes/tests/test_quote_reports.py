from django.test import TestCase, Client
from django.contrib.auth.models import User

from quotes.models import Quote, Category, Vote

import pdb

from ..constants import *


class ReportTest(TestCase):

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


    def test_report_for_misattribution(self):
        self.create_user_and_login('email@email.com')
        response = self.create_quote()
        quote_id = response['data']['id']

        quote = Quote.objects.get(pk=quote_id)
        self.assertEqual(quote.misattribution_votes, 0)
        self.assertEqual(quote.duplicate_votes, 0)

        response = self.client.post(REPORT_URL, data={'quote_id': quote_id, 'report_type': 'misattribution'})
        quote.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(quote.misattribution_votes, 1)
        self.assertEqual(quote.duplicate_votes, 0)


    def test_report_for_duplication(self):
        self.create_user_and_login('email@email.com')
        response = self.create_quote()
        quote_id = response['data']['id']

        quote = Quote.objects.get(pk=quote_id)
        self.assertEqual(quote.misattribution_votes, 0)
        self.assertEqual(quote.duplicate_votes, 0)

        response = self.client.post(REPORT_URL, data={'quote_id': quote_id, 'report_type': 'duplicate'})
        quote.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(quote.misattribution_votes, 0)
        self.assertEqual(quote.duplicate_votes, 1)

    def test_report_for_offensive(self):
        self.create_user_and_login('email@email.com')
        response = self.create_quote()
        quote_id = response['data']['id']

        quote = Quote.objects.get(pk=quote_id)
        self.assertEqual(quote.misattribution_votes, 0)
        self.assertEqual(quote.duplicate_votes, 0)

        response = self.client.post(REPORT_URL, data={'quote_id': quote_id, 'report_type': 'offensive'})
        quote.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(quote.misattribution_votes, 0)
        self.assertEqual(quote.duplicate_votes, 0)
        self.assertEqual(quote.offensive_votes, 1)


    def test_report_type_is_case_insensitive(self):
        self.create_user_and_login('email@email.com')
        response = self.create_quote()
        quote_id = response['data']['id']

        quote = Quote.objects.get(pk=quote_id)
        self.assertEqual(quote.misattribution_votes, 0)
        self.assertEqual(quote.duplicate_votes, 0)

        response = self.client.post(REPORT_URL, data={'quote_id': quote_id, 'report_type': 'DUPLICATE'})
        quote.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(quote.misattribution_votes, 0)
        self.assertEqual(quote.duplicate_votes, 1)


    def test_only_allow_post(self):
        self.create_user_and_login('email@email.com')
        self.create_quote()
        quote_id = Quote.objects.all()[0].id

        response = self.client.get(REPORT_URL)
        self.assertEqual(response.status_code, 400)

        response = self.client.put(REPORT_URL, content_type='application/json', data={'quote_id': quote_id, 'report_type': 'duplicate'})
        self.assertEqual(response.status_code, 400)


    def test_cannot_report_without_quote_id(self):
        self.create_user_and_login('email@email.com')
        self.create_quote()
        # quote_id = Quote.objects.all()[0].id
        response = self.client.post(REPORT_URL, data={'report_type': 'duplicate'})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Quote.objects.first().duplicate_votes, 0)


    def test_cannot_report_with_bad_quote_id(self):
        self.create_user_and_login('email@email.com')
        self.create_quote()
        quote_id = Quote.objects.all()[0].id

        response = self.client.post(REPORT_URL, data={'quote_id': 0, 'report_type': 'duplicate'})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Quote.objects.first().duplicate_votes, 0)

        response = self.client.post(REPORT_URL, data={'quote_id': quote_id+1, 'report_type': 'duplicate'})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Quote.objects.first().duplicate_votes, 0)


    def test_cannot_report_without_report_type(self):
        self.create_user_and_login('email@email.com')
        self.create_quote()
        quote_id = Quote.objects.all()[0].id
        response = self.client.post(REPORT_URL, data={'quote_id': quote_id})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Quote.objects.first().duplicate_votes, 0)


    def test_cannot_report_with_bad_report_type(self):
        self.create_user_and_login('email@email.com')
        self.create_quote()
        quote_id = Quote.objects.all()[0].id
        response = self.client.post(REPORT_URL, data={'quote_id': quote_id, 'report_type': 'Do not like this quote'})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Quote.objects.first().duplicate_votes, 0)
