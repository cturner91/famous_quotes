from django.test import TestCase, Client
from django.contrib.auth.models import User

from ..constants import *
from quotes.models import UserSession
import pdb

class UserTest(TestCase):    

    def setUp(self):
        self.client = Client()

    def put(self, url, *args, **kwargs):
        return self.client.put(url, content_type='application/json', *args, **kwargs)

    def create_user(self, email):
        response = self.client.post(f"{USERS_URL}", data={'email': email, 'password1': 'StrongPassword', 'password2': 'StrongPassword'})
        return response.json()

    def login(self, email):
        self.client.post(LOGIN_URL, data={'email': email, 'password': 'StrongPassword'})

    def create_user_and_login(self, email):
        self.create_user(email)
        self.login(email)


    def test_create_user_via_api_successful(self):
        # no username
        response = self.client.post(USERS_URL, data={'email': 'email@email.com', 'password1': 'StrongPassword', 'password2': 'StrongPassword'})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(User.objects.count(), 1)
        for key in ['id', 'first_name', 'last_name', 'email']:
            self.assertIn(key, response.json()['user'].keys())

        # with username
        response = self.client.post(USERS_URL, data={'email': 'email2@email.com', 'password1': 'StrongPassword', 'password2': 'StrongPassword', 'username': 'CoolUsername'})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(User.objects.count(), 2)
        for key in ['id', 'first_name', 'last_name', 'email', 'username']:
            self.assertIn(key, response.json()['user'].keys())
        self.assertEqual(response.json()['user']['username'], 'CoolUsername')


    def test_create_user_with_long_email(self):
        # as I'm using username instead of email, reading online tells me it's capped at 30 chars?
        # django.contrib.auth.models.AbstractUser shows max_length for username = 150
        response = self.client.post(USERS_URL, data={'email': 'myreallyreallyreallyreallyreallyreallylonggggggemaillllll@email.com', 'password1': 'StrongPassword', 'password2': 'StrongPassword'})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(User.objects.count(), 1)
    

    def test_create_user_via_api_fails_with_duplicate_email(self):
        response = self.client.post(USERS_URL, data={'email': 'email@email.com', 'password1': 'StrongPassword', 'password2': 'StrongPassword'})
        response = self.client.post(USERS_URL, data={'email': 'email@email.com', 'password1': 'NewPassword', 'password2': 'NewPassword'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('could not create user', response.json()['message'].lower())
        # self.assertEqual(User.objects.count(), 1)  # can't actually assert this as it's part of a now-failed Django transaction

    def test_create_user_via_api_fails_without_enough_info(self):
        response = self.client.post(USERS_URL, data={'email': 'email@email.com'})
        self.assertEqual(User.objects.count(), 0)
        self.assertEqual(response.status_code, 400)
        self.assertIn('did not have all inputs', response.json()['message'].lower())
        
        response = self.client.post(USERS_URL, data={'email': 'email@email.com', 'password1': 'password'})
        self.assertEqual(User.objects.count(), 0)
        self.assertEqual(response.status_code, 400)
        self.assertIn('did not have all inputs', response.json()['message'].lower())

    def test_create_user_via_api_fails_if_passwords_do_not_match(self):
        response = self.client.post(USERS_URL, data={'email': 'email@email.com', 'password1': 'StrongPassword', 'password2': 'ExtraStrongPassword'})
        self.assertEqual(User.objects.count(), 0)
        self.assertEqual(response.status_code, 400)
        self.assertIn('passwords do not match', response.json()['message'].lower())

    def test_create_user_fails_with_bad_email(self):
        response = self.client.post(USERS_URL, data={'email': 'email', 'password1': 'Password1', 'password2': 'Password1'})
        self.assertEqual(User.objects.count(), 0)
        self.assertEqual(response.status_code, 400)
        self.assertIn('email invalid', response.json()['message'].lower())

        response = self.client.post(USERS_URL, data={'email': 'email@email', 'password1': 'Password1', 'password2': 'Password1'})
        self.assertEqual(User.objects.count(), 0)
        self.assertEqual(response.status_code, 400)
        self.assertIn('email invalid', response.json()['message'].lower())

        response = self.client.post(USERS_URL, data={'email': '@email.com', 'password1': 'Password1', 'password2': 'Password1'})
        self.assertEqual(User.objects.count(), 0)
        self.assertEqual(response.status_code, 400)
        self.assertIn('email invalid', response.json()['message'].lower())

        response = self.client.post(USERS_URL, data={'email': 'email.com', 'password1': 'Password1', 'password2': 'Password1'})
        self.assertEqual(User.objects.count(), 0)
        self.assertEqual(response.status_code, 400)
        self.assertIn('email invalid', response.json()['message'].lower())

        # make sure I'm not going crazy and can make one actually work
        response = self.client.post(USERS_URL, data={'email': 'email@email.com', 'password1': 'Password1', 'password2': 'Password1'})
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(response.status_code, 201)

    def test_login(self):
        response = self.client.post(USERS_URL, data={'email': 'email@email.com', 'password1': 'StrongPassword', 'password2': 'StrongPassword'})
        response = self.client.post(LOGIN_URL, data={'email': 'email@email.com', 'password': 'StrongPassword'})
        self.assertEqual(response.status_code, 200)
        for key in ['id', 'email', 'first_name', 'last_name']:
            self.assertIn(key, response.json()['user'].keys())

        # validate-session endpoint should IMMEDIATELY become valid
        response = self.client.post(SESSION_URL)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['valid'])

        session = UserSession.objects.get(user__email='email@email.com')
        self.assertEqual(session.session_key, self.client.cookies['sessionid'].value)


    def test_logout(self):
        response = self.client.post(USERS_URL, data={'email': 'email@email.com', 'password1': 'StrongPassword', 'password2': 'StrongPassword'})

        # check that I am logged in
        user_id = response.json()['user']['id']
        response = self.client.get(f"{USERS_URL}?id={user_id}")
        self.assertEqual(response.status_code, 200)

        # logout
        response = self.client.post(LOGOUT_URL)
        self.assertEqual(response.status_code, 200)

        # check that I cannot get my data anymore
        response = self.client.get(f"{USERS_URL}?id={user_id}")
        self.assertEqual(response.status_code, 401)


    def test_get_user_allowed(self):
        # create user and log in
        response = self.client.post(USERS_URL, data={'email': 'email@email.com', 'password1': 'StrongPassword', 'password2': 'StrongPassword', 'first_name': 'First', 'last_name': 'Last'})
        user_id = response.json()['user']['id']
        response = self.client.post(LOGIN_URL, data={'email': 'email@email.com', 'password': 'StrongPassword'})

        # get my own data
        response = self.client.get(f"{USERS_URL}?id={user_id}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['user']['first_name'], 'First')
        for key in ['id','email','first_name','last_name','username']:
            self.assertIn(key, response.json()['user'].keys())


    def test_get_user_not_allowed(self):
        # create user
        response = self.client.post(USERS_URL, data={'email': 'email@email.com', 'password1': 'StrongPassword', 'password2': 'StrongPassword', 'first_name': 'First', 'last_name': 'Last'})
        user_id1 = response.json()['user']['id']

        # create a new user and log in
        response = self.client.post(USERS_URL, data={'email': 'email2@email.com', 'password1': 'Password2', 'password2': 'Password2'})
        user_id2 = response.json()['user']['id']
        response = self.client.post(LOGIN_URL, data={'email': 'email2@email.com', 'password': 'Password2'})

        # ensure we cannot get the original user's data while unauthorised
        response = self.client.get(f"{USERS_URL}?id={user_id1}")
        self.assertEqual(response.status_code, 403)
        self.assertIn('your own data', response.json()['message'])

    def test_get_user_that_does_not_exist(self):
        # I don't think I can test this - once I delete the user object, the request.user becomes None
        # which makes this look like an unauthenticated request
        pass


    def test_validate_session_endpoint(self):
        # should be false initially
        response = self.client.get(f'{SESSION_URL}')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['valid'])

        # make user and login - session should now exist
        response = self.client.post(USERS_URL, data={'email': 'email2@email.com', 'password1': 'Password', 'password2': 'Password'})
        user_id = response.json()['user']['id']
        response = self.client.get(f'{SESSION_URL}')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['valid'])
        self.assertEqual(response.json()['user'], user_id)

        # delete session - should not return True anymore
        UserSession.objects.all().delete()
        response = self.client.get(f'{SESSION_URL}')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()['valid'])


    def put_setup(self):
        self.create_user_and_login('email@email.com')
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(UserSession.objects.count(), 1)
        user = User.objects.first()
        user.first_name = 'First'
        user.last_name = 'LastName'
        user.save()
        session = UserSession.objects.first()
        session.session_username = 'Jonny boy'
        session.save()

        self.user = user
        self.session = session

        # # get user data for current info
        # response = self.client.get(f'{USERS_URL}?id={user.id}')
        # self.assertEqual(response.status_code, 200)
        # response = response.json()['user']
        # self.assertEqual(response['first_name'], 'First')
        # self.assertEqual(response['last_name'], 'LastName')
        # self.assertEqual(response['username'], 'Jonny boy')

    def test_put_with_no_user_id(self):
        self.put_setup()
        response = self.put(f'{USERS_URL}', data={'username': 'Jonny2', 'first_name': 'FIRST', 'last_name': 'LAST'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('without user id', response.json()['message'].lower())

    def test_put_with_invalid_user_id(self):
        self.put_setup()
        response = self.put(f'{USERS_URL}', data={'user_id': 'my user', 'username': 'Jonny2', 'first_name': 'FIRST', 'last_name': 'LAST'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('user id invalid', response.json()['message'].lower())

    def test_put_with_bad_user(self):
        self.put_setup()
        user = User.objects.first()
        response = self.put(f'{USERS_URL}', data={'user_id': self.user.id+5, 'username': 'Jonny2', 'first_name': 'FIRST', 'last_name': 'LAST'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('could not find this user', response.json()['message'].lower())

    def test_put_with_bad_user_session(self):
        self.put_setup()
        UserSession.objects.first().delete()
        user = User.objects.first()
        response = self.put(f'{USERS_URL}', data={'user_id': self.user.id+5, 'username': 'Jonny2', 'first_name': 'FIRST', 'last_name': 'LAST'})
        self.assertEqual(response.status_code, 400)
        self.assertIn('could not find this user', response.json()['message'].lower())


    def test_put_successful(self):
        self.put_setup()
        response = self.put(f'{USERS_URL}', data={'user_id': self.user.id, 'username': 'Jonny2', 'first_name': 'FIRST', 'last_name': 'LAST'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['user']['username'], 'Jonny2')
        self.assertEqual(response.json()['user']['first_name'], 'FIRST')
        self.assertEqual(response.json()['user']['last_name'], 'LAST')

    # # BELOW TEST CASE DOES NOT REPLICATE BAD BEHAVIOUR SEEN IN PROD
    # def test_with_session_assigned_to_another_user(self):
    #     # encountered a bug post go-live where after creating a user, the session endpoint would return False
    #     # after digging, I think this is because the login() function will flush the session if it exists for another user
    #     # In our case, any anonymous action counts as another user (I think)
    #     self.create_user_and_login('email@email.com')
    #     response = self.client.post(SESSION_URL)
    #     self.assertEqual(response.status_code, 200)

    #     response = self.client.post(f"{USERS_URL}", data={'email': 'email2@email.com', 'password1': 'StrongPassword', 'password2': 'StrongPassword'})
    #     self.assertEqual(response.status_code, 201)
    #     response = self.client.post(SESSION_URL)
    #     self.assertEqual(response.status_code, 200)
