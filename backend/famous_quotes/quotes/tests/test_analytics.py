from datetime import datetime, timedelta
import pdb

from django.test import TestCase, Client
from django.contrib.auth.models import User

from quotes.models import Analytic, UserSession

from ..constants import *


class AnalyticTest(TestCase):

    def setUp(self):
        self.client = Client()

    def put(self, url, *args, **kwargs):
        return self.client.put(url, content_type='application/json', *args, **kwargs)

    def delete(self, url, *args, **kwargs):
        return self.client.delete(url, content_type='application/json', *args, **kwargs)

    def create_user(self, email):
        response = self.client.post(f"{USERS_URL}", data={'email': email, 'password1': 'StrongPassword', 'password2': 'StrongPassword'})
        return response.json()['user']

    def login(self, email):
        return self.client.post(LOGIN_URL, data={'email': email, 'password': 'StrongPassword'})

    def create_user_and_login(self, email):
        self.create_user(email)
        self.login(email)

    def test_bad_http_methods(self):
        response = self.put(ANALYTICS_URL, {'key': 'value'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('http method', response.json()['message'].lower())

        response = self.delete(ANALYTICS_URL, {'key': 'value'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('http method', response.json()['message'].lower())
    
    def test_post_no_user(self):
        self.assertEqual(Analytic.objects.count(), 0)
        response = self.client.post(ANALYTICS_URL, data={
            "data": [
                {"datetime": "2023-01-01 12:34:56", "action": "Click button"},
            ]
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Analytic.objects.count(), 1)

    def test_post_with_user(self):
        self.assertEqual(Analytic.objects.count(), 0)
        self.create_user_and_login('email@email.com')
        user = User.objects.first()

        response = self.client.post(ANALYTICS_URL, data={
            'user': user.id, 
            'data': [
                {'datetime': '2023-01-01 12:34:56', 'action': 'Click button again'}
            ]
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Analytic.objects.count(), 1)
        self.assertEqual(Analytic.objects.first().user.id, user.id)

    def test_post_with_bad_user_value(self):

        for user in ['abc', -3]:
            response = self.client.post(ANALYTICS_URL, data={
                'user': user, 
                'data': [
                    {'datetime': '2023-01-01 12:34:56', 'action': 'Click button again'}
                ]
            }, content_type='application/json')
            self.assertEqual(response.status_code, 400)



    def test_post_multiple_actions(self):
        user = User.objects.create()
        response = self.client.post(ANALYTICS_URL, data={'user': user.id, 'data': [
            {'datetime': '2023-01-01 12:34:56', 'action': 'Click button again'},
            {'datetime': '2023-01-01 12:34:57', 'action': 'Click something else'},
            {'datetime': '2023-01-01 12:34:58', 'action': 'meow meow'}
        ]}, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Analytic.objects.count(), 3)
        self.assertEqual(Analytic.objects.filter(user_id=user.id).count(), 3)
