from datetime import datetime, timedelta
import pdb

from django.test import TestCase, Client

from quotes.models import Quote, Comment, UserSession

from ..constants import *


class CommentTest(TestCase):

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
    
    def create_quote_with_number(self, n=1):
        quote = Quote.objects.create(quote=f'quote{n}', author=f'author{n}')
        return quote


    def test_bad_http_methods(self):
        response = self.put(COMMENTS_URL, {'key': 'value'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('http method', response.json()['message'].lower())

        response = self.delete(COMMENTS_URL, {'key': 'value'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('http method', response.json()['message'].lower())

    def test_post_not_authenticated(self):
        self.create_user('email@email.com')
        self.client.post(LOGOUT_URL)

        response = self.client.post(COMMENTS_URL, {'comment': 'This is a comment!'})
        self.assertEqual(response.status_code, 401)
        self.assertIn('must be logged in', response.json()['message'].lower())
    
    def test_post_no_comment(self):
        self.create_user('email@email.com')

        # comment not present
        response = self.client.post(COMMENTS_URL, {'key': 'value'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('no comment', response.json()['message'].lower())

        # comment present but not valid
        response = self.client.post(COMMENTS_URL, {'comment': ''})
        self.assertEqual(response.status_code, 400)
        self.assertIn('no comment', response.json()['message'].lower())

    def test_post_successful_no_quote(self):
        self.create_user('email@email.com')

        response = self.client.post(COMMENTS_URL, {'comment': 'This is a comment!'})
        self.assertEqual(response.status_code, 201)
        self.assertIn('ok', response.json()['message'].lower())

        self.assertEqual(Comment.objects.count(), 1)
        comment = Comment.objects.all()[0]
        self.assertIn('is a comment', comment.comment)
        self.assertIsNone(comment.reply)

    def test_post_successful_with_quote(self):
        self.create_user('email@email.com')
        quote = self.create_quote_with_number()

        response = self.client.post(COMMENTS_URL, {'comment': 'This is a comment!', 'quote': quote.id})
        self.assertEqual(response.status_code, 201)
        self.assertIn('ok', response.json()['message'].lower())

        self.assertEqual(Comment.objects.count(), 1)
        comment = Comment.objects.all()[0]
        self.assertIn('is a comment', comment.comment)
        self.assertIsNone(comment.reply)
        self.assertEqual(comment.quote.id, quote.id)


    def test_get_with_no_quote_and_no_user(self):
        response = self.client.get(f'{COMMENTS_URL}')
        self.assertEqual(response.status_code, 400)
        self.assertIn('must filter', response.json()['message'].lower())

    def test_get_with_quote(self):
        user = self.create_user('email@email.com')
        session = UserSession.objects.get(user_id=user['id'])
        quote1 = self.create_quote_with_number(1)
        quote2 = self.create_quote_with_number(2)
        comment1a = Comment.objects.create(quote=quote1, user_session=session, comment='This is comment1a')
        comment1b = Comment.objects.create(quote=quote1, user_session=session, comment='This is comment1b')
        comment2a = Comment.objects.create(quote=quote2, user_session=session, comment='This is comment2a')

        # quote 1 should have two comments
        response = self.client.get(f'{COMMENTS_URL}?quote={quote1.id}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['data']), 2)

        # quote 2 should have one comment
        response = self.client.get(f'{COMMENTS_URL}?quote={quote2.id}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['data']), 1)

        # assert content on the response with only one quote
        self.assertIn('comment2a', response.json()['data'][0]['comment'])


    def test_get_with_user(self):
        user1 = self.create_user('email@email.com')
        user2 = self.create_user('email2@email.com')
        session1 = UserSession.objects.get(user_id=user1['id'])
        session2 = UserSession.objects.get(user_id=user2['id'])
        quote1 = self.create_quote_with_number(1)
        quote2 = self.create_quote_with_number(2)
        comment1a = Comment.objects.create(quote=quote1, user_session=session1, comment='This is comment1a')
        comment1b = Comment.objects.create(quote=quote1, user_session=session1, comment='This is comment1b')
        comment2a = Comment.objects.create(quote=quote2, user_session=session2, comment='This is comment2a')

        user1_id = user1['id']
        user2_id = user2['id']

        # user 1 should have two comments
        response = self.login('email@email.com')
        self.assertEqual(response.status_code, 200)
        response = self.client.get(f'{COMMENTS_URL}?user={user1_id}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['data']), 2)

        # user 2 should have one comment
        response = self.login('email2@email.com')
        self.assertEqual(response.status_code, 200)
        response = self.client.get(f'{COMMENTS_URL}?user={user2_id}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['data']), 1)

    def test_get_with_quote_and_user(self):
        user1 = self.create_user('email@email.com')
        user2 = self.create_user('email2@email.com')
        session1 = UserSession.objects.get(user_id=user1['id'])
        session2 = UserSession.objects.get(user_id=user2['id'])
        quote1 = self.create_quote_with_number(1)
        quote2 = self.create_quote_with_number(2)
        comment11a = Comment.objects.create(quote=quote1, user_session=session1, comment='This is comment1a')
        comment11b = Comment.objects.create(quote=quote1, user_session=session1, comment='This is comment1b')
        comment12a = Comment.objects.create(quote=quote1, user_session=session2, comment='This is comment1b')
        comment22a = Comment.objects.create(quote=quote2, user_session=session2, comment='This is comment2a')

        user1_id = user1['id']
        user2_id = user2['id']

        # user 1, quote 1 has two comments
        response = self.login('email@email.com')
        self.assertEqual(response.status_code, 200)
        response = self.client.get(f'{COMMENTS_URL}?user={user1_id}&quote={quote1.id}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['data']), 2)

        # user 2, quote 1 has one comment
        response = self.login('email2@email.com')
        self.assertEqual(response.status_code, 200)
        response = self.client.get(f'{COMMENTS_URL}?user={user2_id}&quote={quote1.id}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['data']), 1)

    def test_get_with_full_serializer(self):
        user1 = self.create_user('email@email.com')
        session1 = UserSession.objects.get(user_id=user1['id'])
        session1.session_username = 'username'
        session1.save()
        quote1 = self.create_quote_with_number(1)
        comment11a = Comment.objects.create(quote=quote1, user_session=session1, comment='This is comment1a')
        comment11b = Comment.objects.create(quote=quote1, user_session=session1, comment='This is comment1b')

        user1_id = user1['id']

        response = self.login('email@email.com')
        self.assertEqual(response.status_code, 200)
        response = self.client.get(f'{COMMENTS_URL}?user={user1_id}&quote={quote1.id}&type=full')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['data']), 2)

        # assert the extra expected fields exist
        result_a = response.json()['data'][0] if response.json()['data'][0]['id']==comment11a.id else response.json()['data'][1]
        result_b = response.json()['data'][0] if response.json()['data'][0]['id']==comment11b.id else response.json()['data'][1]
        self.assertIn('username', result_a.keys())
        self.assertIn('quote', result_a.keys())
        self.assertEqual(quote1.id, result_a['quote']['id'])

        # need to ensure we are NOT exposing personal info! Email / first name / last name must NOT be in user data!
        # print(response.json()['data'][0])
        self.assertNotIn('email', result_a.keys())
        self.assertNotIn('first_name', result_a.keys())
        self.assertIn('username', result_a.keys())
        self.assertEqual('username', result_a['username'])
