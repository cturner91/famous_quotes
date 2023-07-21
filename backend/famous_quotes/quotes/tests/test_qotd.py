from datetime import datetime, timedelta
import pdb

from django.test import TestCase, Client

from quotes.models import Quote, Category, QuoteOfTheDay

from ..constants import *


class QotdTest(TestCase):

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


    def test_only_GET_allowed(self):
        response = self.client.put(QOTD_URL)
        self.assertEqual(response.status_code, 400)

        response = self.client.post(QOTD_URL)
        self.assertEqual(response.status_code, 400)

        quote1 = self.create_quote_with_number(1)
        category1 = Category.objects.create(category='')
        response = self.client.get(QOTD_URL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['quote']['id'], quote1.id)

    def test_bad_category(self):
        Category.objects.create(category='love')
        Category.objects.create(category='fear')
        Category.objects.create(category='four')

        response = self.client.get(f"{QOTD_URL}?category=five")
        self.assertEqual(response.status_code, 400)        

    def test_qotd_already_exists_returns_self(self):
        category = Category.objects.create(category='love')
        quote = Quote.objects.create(quote='quote1', author='author1')
        quote.categories.set([category.id])

        self.assertEqual(QuoteOfTheDay.objects.count(), 0)
        response = self.client.get(f"{QOTD_URL}?category={category.category}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['quote']['id'], quote.id)
        self.assertEqual(QuoteOfTheDay.objects.count(), 1)

        Quote.objects.create(quote='quote2', author='author2')
        response = self.client.get(f"{QOTD_URL}?category={category.category}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['quote']['id'], quote.id)

    def test_date_filter_180(self):

        category = Category.objects.create(category='love')
        quote1 = Quote.objects.create(quote='quote1', author='author1', popularity=1.0)
        quote1.categories.set([category.id])
        quote2 = Quote.objects.create(quote='quote2', author='author2', popularity=0.5)
        quote2.categories.set([category.id])

        today = datetime.now().date()

        # Qotd outside of window - should pick the higher-popularity quote
        QuoteOfTheDay.objects.create(date=today+timedelta(days=-181), quote=quote1, category=category)
        response = self.client.get(f"{QOTD_URL}?category={category.category}")
        self.assertEqual(response.json()['quote']['id'], quote1.id)
        QuoteOfTheDay.objects.filter(date=today).delete()

        # Qotd inside of window - should pick the lower-popularity quote
        QuoteOfTheDay.objects.create(date=today+timedelta(days=-179), quote=quote1, category=category)
        response = self.client.get(f"{QOTD_URL}?category={category.category}")
        self.assertEqual(response.json()['quote']['id'], quote2.id)

    def test_date_filter_90(self):
        # if 180 and 90 work, then the rest should also work?

        category = Category.objects.create(category='love')
        quote1 = Quote.objects.create(quote='quote1', author='author1', popularity=1.0)
        quote1.categories.set([category.id])
        quote2 = Quote.objects.create(quote='quote2', author='author2', popularity=0.5)
        quote2.categories.set([category.id])

        today = datetime.now().date()
        QuoteOfTheDay.objects.create(date=today+timedelta(days=-179), quote=quote1, category=category)
        QuoteOfTheDay.objects.create(date=today+timedelta(days=-178), quote=quote2, category=category)  # can't make two qotds for same category for same date 
        
        # Qotd outside of window - should pick the higher-popularity quote
        QuoteOfTheDay.objects.create(date=today+timedelta(days=-91), quote=quote1, category=category)
        response = self.client.get(f"{QOTD_URL}?category={category.category}")
        self.assertEqual(response.json()['quote']['id'], quote1.id)
        QuoteOfTheDay.objects.filter(date=today).delete()
        
        # Qotd inside of window - should pick the lower-popularity quote
        QuoteOfTheDay.objects.create(date=today+timedelta(days=-89), quote=quote1, category=category)
        response = self.client.get(f"{QOTD_URL}?category={category.category}")
        self.assertEqual(response.json()['quote']['id'], quote2.id)

    def test_qotd_category_only_returns_that_category(self):
        category1 = Category.objects.create(category='love')
        category2 = Category.objects.create(category='cool')
        category3 = Category.objects.create(category='')

        quote1 = Quote.objects.create(quote='quote1', author='author1', popularity=0.2)
        quote1.categories.set([category1.id])
        quote2 = Quote.objects.create(quote='quote2', author='author2', popularity=0.4)
        quote2.categories.set([category2.id])
        quote3 = Quote.objects.create(quote='quote3', author='author3', popularity=0.6)
        quote3.categories.set([category3.id])

        response = self.client.get(f"{QOTD_URL}?category=love")
        self.assertEqual(response.json()['quote']['id'], quote1.id)

        response = self.client.get(f"{QOTD_URL}?category=cool")
        self.assertEqual(response.json()['quote']['id'], quote2.id)

        response = self.client.get(f"{QOTD_URL}")
        self.assertEqual(response.json()['quote']['id'], quote3.id)  # with no category, defaults to most popular across all categories

    def test_date_filter_null_category(self):
        # if category is null, it seems the constraint of unique_together does not apply

        quote1 = Quote.objects.create(quote='quote1', author='author1', popularity=1.0)
        quote2 = Quote.objects.create(quote='quote2', author='author2', popularity=0.5)

        # set yesterday's QOTD to the more popular quote - so today we should get back the only other quote
        today = datetime.now().date()
        QuoteOfTheDay.objects.create(date=today+timedelta(days=-1), quote=quote1)
        response = self.client.get(f"{QOTD_URL}")
        self.assertEqual(response.json()['quote']['id'], quote2.id)

    def test_date_filter_null_category_but_quotes_have_categories(self):

        category = Category.objects.create(category='Cat1')
        quote1 = Quote.objects.create(quote='quote1', author='author1', popularity=1.0)
        quote1.categories.set([category.id])
        quote2 = Quote.objects.create(quote='quote2', author='author2', popularity=0.5)
        quote2.categories.set([category.id])

        # set yesterday's QOTD to the more popular quote - so today we should get back the only other quote
        today = datetime.now().date()
        QuoteOfTheDay.objects.create(date=today+timedelta(days=-1), quote=quote1)
        response = self.client.get(f"{QOTD_URL}")
        self.assertEqual(response.json()['quote']['id'], quote2.id)
