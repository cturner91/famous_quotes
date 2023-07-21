from django.test import TestCase, Client

from quotes.models import Category
import pdb

from ..constants import *


class QuoteTest(TestCase):

    def setUp(self):
        self.client = Client()
    
    def test_categories(self):

        cat1 = Category.objects.create(category='funny')
        cat2 = Category.objects.create(category='travel')
        cat3 = Category.objects.create(category='motivational')

        response = self.client.get(CATEGORIES_URL)
        categories = response.json()['data']
        self.assertEqual(len(categories), 3)
        ids = [x['id'] for x in categories]
        for cat_id in [cat1.id, cat2.id, cat3.id]:
            self.assertIn(cat_id, ids)
        
        categories_categories = [x['category'] for x in categories]
        for category in ['funny', 'travel' ,'motivational']:
            self.assertIn(category, categories_categories)

