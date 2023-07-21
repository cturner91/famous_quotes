from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor
from unittest import mock

from django.test import TestCase, Client

from ..throttling import *
from ..constants import *


class IpRequestTest(TestCase):

    def test_eq(self):
        now = datetime.now(pytz.UTC)
        ip_request1a = IpRequest('ip1', now)
        ip_request1b = IpRequest('ip1', now)
        ip_request2a = IpRequest('ip2', now)
        ip_request2b = IpRequest('ip2', now)

        self.assertEqual(ip_request1a, ip_request1b)
        self.assertNotEqual(ip_request1b, ip_request2a)
        self.assertEqual(ip_request2a, ip_request2b)

    def test_hash(self):

        # assert that they can be used as keys in dictionary
        ip_request1 = IpRequest('ip1')
        ip_request2 = IpRequest('ip2')

        mydict = {}
        mydict[ip_request1] = 'value1'
        mydict[ip_request2] = 'value2'
        self.assertIn(ip_request1, mydict.keys())
        self.assertIn(ip_request2, mydict.keys())

    def test_str(self):

        request1 = IpRequest('ip1', datetime(2023,1,1,12,34,56), 2)
        self.assertEqual(str(request1), 'IP: (ip1) @ 2023-01-01T12:34:56 (x2)')

    def test_repr(self):

        request1 = IpRequest('ip1', datetime(2023,1,1,12,34,56), 2)
        self.assertEqual(repr(request1), 'IP: (ip1) @ 2023-01-01T12:34:56 (x2)')

    # not sure how to test the two methods because I would need to use a Django request...


class IpMonitorLiveTest(TestCase):

    def setUp(self):
        IpThrottle.objects.all().delete()
        IpMonitor.objects.all().delete()

    def test_get_period(self):
        monitor = IpMonitorLive()
        dt = datetime(2023,1,1,12,34,0)
        for second in range(5):
            self.assertEqual(dt, monitor.get_period(dt+timedelta(seconds=second)))

    # def test_convert_request(self):
    #     pass
    
    def test_block_requests(self):
        monitor = IpMonitorLive(blocked_ips={'ip1','ip3'})
        for i in range(5):
            request = IpRequest(f'ip{i}')
            result = monitor.block_request(request)
            if i==1 or i==3:
                self.assertTrue(result)
            else:
                self.assertFalse(result)

    def test_add_request(self):
        request1 = IpRequest('ip1')
        request2 = IpRequest('ip2')

        monitor = IpMonitorLive(commit_after_number=10)  # commit_n must be higher than the number in here
        monitor.add_request(request1)
        monitor.add_request(request1)
        monitor.add_request(request2)
        monitor.add_request(request1)
        self.assertEqual(monitor.count, 4)
        self.assertEqual(monitor.requests[request1].count, 3)
        self.assertEqual(monitor.requests[request2].count, 1)
    
    @mock.patch('quotes.throttling.IpMonitorLive.remove_old_requests')
    def test_total_up_requests(self, mock_remove):
        # mock removing old requests as we don't want it to actually run, otherwise it deletes all the requests...
        request1 = IpRequest('ip1', datetime(2023,1,1,12,34,56))
        request2 = IpRequest('ip2', datetime(2023,1,1,12,34,56))
        request3 = IpRequest('ip1', datetime(2023,1,1,12,56,56))
        request4 = IpRequest('ip2', datetime(2023,1,1,12,56,56))
        monitor = IpMonitorLive()

        for i in range(1):
            monitor.add_request(request1)
        for i in range(2):
            monitor.add_request(request2)
        for i in range(3):
            monitor.add_request(request3)
        for i in range(4):
            monitor.add_request(request4)
        self.assertEqual(monitor.count, 1+2+3+4)
        
        result = monitor.total_up_requests_by_ip_address()
        self.assertIn('ip1', result.keys())
        self.assertIn('ip2', result.keys())
        self.assertNotIn('ip3', result.keys())
        self.assertEqual(result['ip1'], 1+3)
        self.assertEqual(result['ip2'], 2+4)

    @mock.patch('quotes.throttling.IpMonitorLive.remove_old_requests')
    def test_block_ips(self, mock_remove):
        # mock removing old requests as we don't want it to actually run, otherwise it deletes all the requests...
        monitor = IpMonitorLive(monitor_limit_count=60, monitor_limit_seconds=120)
        request1 = IpRequest('ip1', datetime(2023,1,1,12,34))
        request2 = IpRequest('ip1', datetime(2023,1,1,12,35))
        request3 = IpRequest('ip1', datetime(2023,1,1,12,36))

        self.assertEqual(IpThrottle.objects.count(), 0)

        # default values are 60 requests in 2 minutes
        for i in range(25):
            monitor.add_request(request1)
        self.assertNotIn('ip1', monitor.blocked_ips)
        for i in range(25):
            monitor.add_request(request2)
        self.assertNotIn('ip1', monitor.blocked_ips)
        for i in range(25):
            monitor.add_request(request3)
        self.assertIn('ip1', monitor.blocked_ips)
        self.assertTrue(monitor.block_request(request3))
        
        self.assertEqual(IpThrottle.objects.count(), 1)
        self.assertEqual(IpThrottle.objects.first().ip_address, 'ip1')

    def test_remove_old_requests(self):
        monitor = IpMonitorLive(commit_after_number=100, monitor_limit_seconds=5)
        now = datetime(2023,1,1,12,34,56)
        for second in range(10):
            request = IpRequest('ip1', dt=now-timedelta(seconds=second))
            monitor.add_request(request)
        
        self.assertEqual(monitor.count, 10)
        self.assertEqual(len(monitor.requests), 3)  # with buckets of 5s each, 46-56 will fall into 3 different buckets
        monitor.remove_old_requests(now)
        self.assertEqual(monitor.count, 2)  # only the 55s+ bucket should remain, which has 55 & 56 entries
        self.assertEqual(len(monitor.requests), 1)
        for request in monitor.requests:
            self.assertGreaterEqual(monitor.requests[request].datetime, now-timedelta(seconds=5))
        

    def test_add_request_blocks_as_expected(self):
        now = datetime.now(pytz.UTC)
        request1a = IpRequest('ip1', dt=now-timedelta(minutes=2))
        request1b = IpRequest('ip1', dt=now-timedelta(minutes=1))
        request1c = IpRequest('ip1', dt=now-timedelta(minutes=0))
        request2a = IpRequest('ip2', dt=now-timedelta(minutes=2))
        request2b = IpRequest('ip2', dt=now-timedelta(minutes=1))
        request2c = IpRequest('ip2', dt=now-timedelta(minutes=0))

        # scenario1 - too many requests more than 2 mins ago does not result in blocked IP addresses
        monitor1 = IpMonitorLive(commit_after_number=10, monitor_limit_count=60, monitor_limit_seconds=120)
        for i in range(100):
            monitor1.add_request(request1a)
        self.assertEqual(len(monitor1.blocked_ips), 0)

        # scenario2 - more than 60 requests in 2 mins across multiple IP addresses also does not block either
        monitor2 = IpMonitorLive(commit_after_number=10, monitor_limit_count=60, monitor_limit_seconds=120)
        for i in range(100):
            if i % 2 == 0:
                monitor2.add_request(request1c)
            else:
                monitor2.add_request(request2c)
        self.assertEqual(len(monitor2.blocked_ips), 0)

        # scenario 3 - more than 60 requests in last 2 mins across one ip blocks that one
        monitor3 = IpMonitorLive(commit_after_number=10, monitor_limit_count=60, monitor_limit_seconds=120)
        for i in range(100):
            if i % 3 > 0:
                monitor3.add_request(request1b)  # 66 requests
            else:
                monitor3.add_request(request2b)  # 34 requests
        self.assertIn('ip1', monitor3.blocked_ips)
        self.assertEqual(len(monitor3.blocked_ips), 1)

    def test_dump(self):
        monitor = IpMonitorLive(monitor_limit_count=60, monitor_limit_seconds=120)
        request1a = IpRequest('ip1', datetime(2023,1,1,12,34,56))
        request1b = IpRequest('ip1', datetime(2023,1,1,12,56,56))
        request2a = IpRequest('ip2', datetime(2023,1,1,12,34,56))

        monitor.add_request(request1a)
        monitor.add_request(request1a)
        monitor.add_request(request1a)
        monitor.add_request(request1b)
        monitor.add_request(request1b)
        monitor.add_request(request2a)

        self.assertEqual(monitor.dump(), {
            'requests': [
                'IP: (ip1) @ 2023-01-01T12:34:55 (x3)', 
                'IP: (ip1) @ 2023-01-01T12:56:55 (x2)', 
                'IP: (ip2) @ 2023-01-01T12:34:55 (x1)'
            ], 
            'count': 6, 
            'icount': 6, 
            'blocked_ips': []
        })

    def test_remove_old_blocks(self):
        now = datetime.now(pytz.UTC)
        monitor = IpMonitorLive(monitor_limit_seconds=5)
        monitor.blocked_ips = {
            'ip1': now-timedelta(seconds=10),
            'ip2': now-timedelta(seconds=3),
            'ip3': now+timedelta(seconds=4),
        }
        monitor.remove_old_blocks()

        self.assertEqual(len(monitor.blocked_ips), 1)
        self.assertIn('ip3', monitor.blocked_ips)

        

class ThrottleTest(TestCase):

    def setUp(self):
        self.client = Client()

    def send_get(self):
        self.client.get('http://localhost:8000/api/test/')

    def test_get(self):
        self.send_get()

    def test_throttling(self):

        # submit 100 requests
        with ThreadPoolExecutor(max_workers=2) as executor:
            for _ in range(100):
                executor.submit(self.send_get)
        
