from django.test import TestCase, Client

from quotes.models import Quote, Category
from quotes.constants import *

import pdb

class TestHomeScreen(TestCase):

    def setup(self):
        self.client = Client()

    def test_home_screen(self):

        categories = []
        for category in ['Motivation', 'Travel', 'Funny', 'Politics', 'Career', 'Dummy_cat_1', 'Dummy_cat_2']:
            category = Category.objects.create(category=category)
            categories.append(category)

        # Make 50 quotes, with incremental popularity
        quotes = []
        for i in range(51):
            category = categories[i % len(categories)]
            quote = Quote.objects.create(quote=f'Quote{i}', author=f'Author{i}', popularity=0.02*i)
            quote.categories.add(category)
            quote.save()
            quotes.append(quote)

        # call HomeScreenView and validate output
        response = self.client.get(f'{HOME_SCREEN_URL}')
        self.assertEqual(response.status_code, 200)
        data = response.json()['data']
        
        for key in ['top', 'random', 'motivation', 'travel', 'funny', 'politics', 'career']:
            self.assertIn(key, data.keys())

        self.assertEqual(len(data['top']), 4)
        self.assertEqual(len(data['random']), 2)
        self.assertEqual(len(data['motivation']), 2)
        self.assertEqual(len(data['travel']), 2)
        self.assertEqual(len(data['funny']), 2)
        self.assertEqual(len(data['politics']), 2)
        self.assertEqual(len(data['career']), 2)

        # top quotes should have popularity > 0.6 because they are top 20/50 quotes i.e. top 40%
        for quote in data['top']:
            self.assertGreater(quote['popularity'], 0.6)

        # both random quotes MUST be >= 0.5 popularity
        self.assertGreaterEqual(data['random'][0]['popularity'], 0.5)
        self.assertGreaterEqual(data['random'][1]['popularity'], 0.5)

        # ensure that quotes for each category are the msot popular for that category
        for category in ['motivation', 'travel', 'funny', 'politics', 'career']:
            cat_quotes = Quote.objects.filter(categories__category=category).order_by('-popularity')[:2]
            cat_quotes = [x.id for x in cat_quotes]
            self.assertIn(data[category][0]['id'], cat_quotes)
            self.assertIn(data[category][1]['id'], cat_quotes)
            
