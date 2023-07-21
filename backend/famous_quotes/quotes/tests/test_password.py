from datetime import datetime, timedelta
import pytz
from unittest import mock
import pdb

from django.test import TestCase, Client
from django.contrib.auth.models import User

from quotes.models import UserSession

from ..constants import *


class ForgotPasswordTest(TestCase):

    def setUp(self):
        self.client = Client()

    def patch(self, url, *args, **kwargs):
        return self.client.patch(url, content_type='application/json', *args, **kwargs)

    def put(self, url, *args, **kwargs):
        return self.client.put(url, content_type='application/json', *args, **kwargs)

    def delete(self, url, *args, **kwargs):
        return self.client.delete(url, content_type='application/json', *args, **kwargs)

    def create_user(self, email):
        response = self.client.post(f"{USERS_URL}", data={'email': email, 'password1': 'StrongPassword', 'password2': 'StrongPassword'})
        return response.json()

    def login(self, email):
        self.client.post(LOGIN_URL, data={'email': email, 'password': 'StrongPassword'})

    def create_user_and_login(self, email):
        self.create_user(email)
        self.login(email)

    def test_only_POST_allowed(self):
        response = self.put(FORGOT_PASSWORD_URL, data={'key': 'value'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('method not recognised', response.json()['message'])

        response = self.client.get(FORGOT_PASSWORD_URL, data={'key': 'value'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('method not recognised', response.json()['message'])

        response = self.patch(FORGOT_PASSWORD_URL, data={'key': 'value'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('method not recognised', response.json()['message'])

        response = self.delete(FORGOT_PASSWORD_URL, data={'key': 'value'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('method not recognised', response.json()['message'])

    def test_post_no_email(self):
        response = self.client.post(FORGOT_PASSWORD_URL, data={'key': 'value'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('need an email address', response.json()['message'].lower())

    def test_invalid_email(self):
        user_id = self.create_user('abc@abc.com')['user']['id']
        user = User.objects.get(id=user_id)

        response = self.client.post(FORGOT_PASSWORD_URL, data={'email': 'bad@abc.com'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('user does not exist', response.json()['message'].lower())

    @mock.patch('quotes.views.send_mail', return_value=0)
    def test_no_problems_but_email_fails(self, mock_send_mail):
        user_id = self.create_user('abc@abc.com')['user']['id']
        user = User.objects.get(id=user_id)

        response = self.client.post(FORGOT_PASSWORD_URL, data={'email': 'abc@abc.com'})
        self.assertEqual(response.status_code, 500)
        self.assertIn('email failed to send', response.json()['message'].lower())
        self.assertEqual(mock_send_mail.call_count, 1)

        # get the UserSession and ensure it has a valid_until in the future
        user_session = UserSession.objects.all()[0]
        self.assertGreater(user_session.valid_until, datetime.now(tz=pytz.UTC)+timedelta(hours=23))
        self.assertIsNotNone(user_session.password_reset_code)
        self.assertGreater(len(user_session.password_reset_code), 10)

    @mock.patch('quotes.views.send_mail', return_value=1)
    def test_successful(self, mock_send_mail):
        user_id = self.create_user('abc@abc.com')['user']['id']
        user = User.objects.get(id=user_id)

        response = self.client.post(FORGOT_PASSWORD_URL, data={'email': 'abc@abc.com'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('email sent successfully', response.json()['message'].lower())
        self.assertEqual(mock_send_mail.call_count, 1)

        # get the UserSession and ensure it has a valid_until in the future
        user_session = UserSession.objects.all()[0]
        self.assertGreater(user_session.valid_until, datetime.now(tz=pytz.UTC)+timedelta(hours=23))
        self.assertIsNotNone(user_session.password_reset_code)
        self.assertGreater(len(user_session.password_reset_code), 10)


class ResetPasswordTest(TestCase):

    def setUp(self):
        self.client = Client()

    def patch(self, url, *args, **kwargs):
        return self.client.patch(url, content_type='application/json', *args, **kwargs)

    def put(self, url, *args, **kwargs):
        return self.client.put(url, content_type='application/json', *args, **kwargs)

    def delete(self, url, *args, **kwargs):
        return self.client.delete(url, content_type='application/json', *args, **kwargs)

    def create_user(self, email):
        response = self.client.post(f"{USERS_URL}", data={'email': email, 'password1': 'StrongPassword', 'password2': 'StrongPassword'})
        return response.json()

    def login(self, email):
        self.client.post(LOGIN_URL, data={'email': email, 'password': 'StrongPassword'})

    def create_user_and_login(self, email):
        self.create_user(email)
        self.login(email)


    def test_only_POST_allowed(self):
        response = self.put(PASSWORD_RESET_URL, data={'key': 'value'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('method not recognised', response.json()['message'])

        response = self.client.get(PASSWORD_RESET_URL, data={'key': 'value'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('method not recognised', response.json()['message'])

        response = self.patch(PASSWORD_RESET_URL, data={'key': 'value'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('method not recognised', response.json()['message'])

        response = self.delete(PASSWORD_RESET_URL, data={'key': 'value'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('method not recognised', response.json()['message'])

    def test_post_no_code(self):
        response = self.client.post(PASSWORD_RESET_URL, data={'key': 'value'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('without a valid code', response.json()['message'].lower())

    def test_post_no_email(self):
        response = self.client.post(PASSWORD_RESET_URL, data={'code': '1234'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('without email', response.json()['message'].lower())

    def test_post_no_password1(self):
        response = self.client.post(PASSWORD_RESET_URL, data={'code': '1234', 'email': 'abc@abc.com'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('must provide password', response.json()['message'].lower())

    def test_post_no_password2(self):
        response = self.client.post(PASSWORD_RESET_URL, data={'code': '1234', 'email': 'abc@abc.com', 'password1': 'password'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('must provide confirmation password', response.json()['message'].lower())

    def test_passwords_dont_match(self):
        response = self.client.post(PASSWORD_RESET_URL, data={'code': '1234', 'email': 'abc@abc.com', 'password1': 'password', 'password2': 'passwordLOL'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('passwords must match', response.json()['message'].lower())

    def test_invalid_email(self):
        user_id = self.create_user('abc@abc.com')['user']['id']
        user = User.objects.get(id=user_id)

        response = self.client.post(PASSWORD_RESET_URL, data={'code': '1234', 'email': 'BAD@abc.com', 'password1': 'password', 'password2': 'password'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('does not exist with this email', response.json()['message'].lower())

    def test_invalid_code(self):
        user_id = self.create_user('abc@abc.com')['user']['id']
        user = User.objects.get(id=user_id)
        session = UserSession.objects.get(user=user)
        session.password_reset_code = '1234'
        session.valid_until = datetime.now(tz=pytz.UTC)+timedelta(hours=24)
        session.save()

        response = self.client.post(PASSWORD_RESET_URL, data={'code': 'abcd', 'email': 'abc@abc.com', 'password1': 'password', 'password2': 'password'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('cannot validate code', response.json()['message'].lower())

    def test_expired_code(self):
        user_id = self.create_user('abc@abc.com')['user']['id']
        user = User.objects.get(id=user_id)
        session = UserSession.objects.get(user=user)
        session.password_reset_code = '1234'
        session.valid_until = datetime.now(tz=pytz.UTC)+timedelta(hours=-1)
        session.save()

        response = self.client.post(PASSWORD_RESET_URL, data={'code': '1234', 'email': 'abc@abc.com', 'password1': 'password', 'password2': 'password'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('code has expired', response.json()['message'].lower())

    def test_success(self):
        user_id = self.create_user('abc@abc.com')['user']['id']
        user = User.objects.get(id=user_id)
        session = UserSession.objects.get(user=user)
        session.password_reset_code = '1234'
        session.valid_until = datetime.now(tz=pytz.UTC)+timedelta(hours=24)
        session.save()

        response = self.client.post(PASSWORD_RESET_URL, data={'code': '1234', 'email': 'abc@abc.com', 'password1': 'password', 'password2': 'password'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('ok', response.json()['message'].lower())

        # verify metadata
        user_session = UserSession.objects.all()[0]
        self.assertIsNone(user_session.password_reset_code)
        self.assertIsNone(user_session.valid_until)

        # verify password
        user_session.refresh_from_db()
        user_session.user.refresh_from_db()
        self.assertTrue(user_session.user.check_password('password'))
