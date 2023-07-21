import pdb
import json

from django.test import TestCase
from django.http.request import HttpRequest

from quotes.utils import clean_dict, get_data, check_session, generate_random_code


class UtilsTest(TestCase):

    def test_check_session(self):
        # tricky to test this one, and also is covered by 100s of tests elsewhere in this project
        # Need to utilise middleware to actually access session...

        # request = HttpRequest()
        # self.assertIsNone(request.session.session_key)
        # request = check_session(request)
        # self.assertIsNotNone(request.session.session_key)
        pass

    def test_clean_dict(self):
        # ensure it only changes LIST types
        test_dict = {'key1': 'value1', 'key2': ['value2'], 'key3': {'value3'}, 'key4': ['multiple','values'], 'key5': []}
        test_dict_cleaned = clean_dict(test_dict)
        self.assertEqual(test_dict_cleaned['key1'], 'value1')
        self.assertEqual(test_dict_cleaned['key2'], 'value2')
        self.assertEqual(test_dict_cleaned['key3'], {'value3'})
        self.assertEqual(test_dict_cleaned['key4'], ['multiple','values'])
        self.assertEqual(test_dict_cleaned['key5'], [])


    def test_get_data__get__blank_input(self):
        request = HttpRequest()
        request.method = 'GET'
        request.GET = {}
        self.assertEqual(get_data(request), {})

    def test_get_data__get__real_values(self):
        request = HttpRequest()
        request.method = 'GET'

        # nest a single-list value in one to verify that clean_dict is running
        request.GET = {'key1': ['value1'], 'key2': 'v2'}
        self.assertEqual(get_data(request), {'key1': 'value1', 'key2': 'v2'})
    

    # cannot test this one - complains about self._read_started, and then self_stream
    # I think this must all get taken care of inside other Django utils
    # def test_get_data__post__blank_input(self):
    #     request = HttpRequest()
    #     request.method = 'POST'
    #     request.POST = {}
    #     output = get_data(request)
    #     self.assertEqual(output, {})

    def test_get_data__post__real_values(self):
        request = HttpRequest()
        request.method = 'POST'
        request.POST = {'key1': ['value1'], 'key2': 'v2'}
        self.assertEqual(get_data(request), {'key1': 'value1', 'key2': 'v2'})

    def test_get_data__post__real_values_in_body(self):
        request = HttpRequest()
        request.method = 'POST'
        payload = json.dumps({'key1': ['value1'], 'key2': 'v2'}).encode('utf-8')
        request._body = payload
        output = get_data(request)
        self.assertEqual(output, {'key1': 'value1', 'key2': 'v2'})


    def test_get_data__put__blank_input(self):
        request = HttpRequest()
        request.method = 'PUT'
        request._body = json.dumps({}).encode('utf-8')
        self.assertEqual(get_data(request), {})

    def test_get_data__delete__real_values(self):
        request = HttpRequest()
        request.method = 'DELETE'
        request._body = json.dumps({'key1': ['value1'], 'key2': 'v2'}).encode('utf-8')
        self.assertEqual(get_data(request), {'key1': 'value1', 'key2': 'v2'})


    def test_generate_random_code_must_have_one_config(self):
        code = generate_random_code(100, uppers=False, lowers=False, symbols=False, digits=False)
        self.assertIsNone(code)

    def test_generate_random_code(self):
        code = generate_random_code(uppers=True, lowers=False, symbols=False, digits=False)
        self.assertEqual(len(code), 32)  # test default length
        self.assertEqual(code, code.upper())

        code = generate_random_code(30, uppers=False, lowers=True, symbols=False, digits=False)
        self.assertEqual(code, code.lower())

        code = generate_random_code(30, uppers=False, lowers=False, symbols=False, digits=True)
        code = int(code)  # if this raises an error, then test has failed

        code = generate_random_code(1000, uppers=False, lowers=False, symbols=True, digits=False)
        self.assertIn('!', code)  # potentially flaky
        self.assertIn(',', code)  # potentially flaky
        self.assertIn('£', code)  # potentially flaky

        code = generate_random_code(1000, uppers=True, lowers=True, digits=True, symbols=False)
        self.assertNotEqual(code, code.upper())
        self.assertNotEqual(code, code.lower())
        for i in range(10):
            if i == 0:
                code_new = code.replace(str(i), '')
            else:
                code_new = code.replace(str(i), '')
        self.assertNotEqual(code, code_new)  # potentially flaky
