from datetime import datetime, timedelta
import logging
import pytz

from django.http import HttpRequest

from quotes.models import IpMonitor, IpThrottle

import pdb

logger = logging.getLogger('fq')


def values_equal(value1, value2):

    if value1 is None and value2 is None:
        return True

    if value1 is not None and value2 is not None:
        return value1 == value2    

    # one is None and the other isn't
    return False


class IpMonitorLive:
    '''
    This is the in-memory monitor. It is almost equivalent to the DB model
    Requirements:
    * must work in-memory for performance reasons
    * must be able to load blocked IP addresses from DB
    * if a request comes in for a blocked IP address, must return blank/401 response
    * must be able to monitor all requests over the last X minutes
    * if more than Y requests occur in the last X minutes, should add IP address to block list
    '''

    def __init__(
        self, 
        count=0, 
        icount=0, 
        requests=None, 
        commit_after_number=10, 
        blocked_ips=None,
        monitor_limit_seconds=30,
        monitor_limit_count=30,
    ):
        self.count = count
        self.icount = icount
        self.commit_after_number = commit_after_number
        self.requests = requests or {}
        self.blocked_ips = blocked_ips or {}
        self.monitor_limit_seconds = monitor_limit_seconds
        self.monitor_limit_count = monitor_limit_count

        logger.info(f'New IpMonitor created at {datetime.now().isoformat()}')

        # load blocked ips from database
        # if instantiated with blocked_ips present, do not overwrite
        if len(self.blocked_ips) == 0:
            db_blocked_ips = IpThrottle.objects.filter(block_expires__gte=datetime.now(pytz.UTC))
            self.blocked_ips = {v.ip_address: v.block_expires for v in db_blocked_ips}

    def dump(self):
        output = {}
        output['requests'] = [str(request) for request in self.requests.values()]
        output['count'] = self.count
        output['icount'] = self.icount
        output['blocked_ips'] = [f'{ip}: {dt.isoformat()}' for ip,dt in self.blocked_ips.items()]
        return output

    def convert_request(self, request):
        if isinstance(request, HttpRequest):
            return IpRequest().from_django(request)
        return request

    def get_period(self, dt):
        # define how to chunk time-periods
        return datetime(dt.year, dt.month, dt.day, dt.hour, dt.minute, int(dt.second/5)*5, tzinfo=dt.tzinfo)

    def block_request(self, request):
        # logger.info(f'status: {self.dump()}')
        if request.ip_address in self.blocked_ips:
            return True
        return False
    
    def add_request(self, request):
        request = self.convert_request(request)
        if self.block_request(request):
            self.remove_old_blocks()  # if a user gets blocked, they cannot unblock themselves without this line
            return False

        request.datetime = self.get_period(request.datetime)

        if self.requests.get(request):
            self.requests[request].count += 1
        else:
            self.requests[request] = request

        self.count += 1
        self.icount += 1
        if self.icount >= self.commit_after_number:
            self.remove_old_requests()
            self.remove_old_blocks()
            self.block_ips()
            self.icount -= self.commit_after_number
        
        return True

    def remove_old_blocks(self, now=None):
        # loop through all blocked IPs and see if we are now beyond their blocking date. If so, remove them
        if now is None:
            now = datetime.now(pytz.UTC)
        keys_to_delete = set()
        for ip, dt in self.blocked_ips.items():  # dt is block expiry datetime
            if dt < now:
                keys_to_delete.add(ip)

        for key in keys_to_delete:
            del self.blocked_ips[key]
        

    def total_up_requests_by_ip_address(self):
        ip_addresses = {}
        for key in self.requests:
            if ip_addresses.get(key.ip_address):
                ip_addresses[key.ip_address] += key.count
            else:
                ip_addresses[key.ip_address] = key.count
        return ip_addresses

    def block_ips(self):
        ip_addresses = self.total_up_requests_by_ip_address()        
        for key in ip_addresses:
            if ip_addresses[key] > self.monitor_limit_count:

                # block repeat offenders for longer
                # 5s -> 30s -> 60s -> 120s -> 240s ...
                # start at 5s because it could be a legit user who won't appreicate being banned
                previous_blocks = IpThrottle.objects.filter(ip_address=key)
                block_duration_seconds = 5 if len(previous_blocks) == 0 else 30 * (2 ** len(previous_blocks))

                logger.warn(f'IP block applied for {key} at {datetime.now().isoformat()} for {block_duration_seconds}')
                block_until = datetime.now(pytz.UTC)+timedelta(seconds=block_duration_seconds)
                IpThrottle.objects.create(
                    ip_address=key, 
                    block_expires=block_until,
                )
                self.blocked_ips[key]=block_until

    def remove_old_requests(self, now=None):
        # removes anything that was added more than monitor_limit_seconds ago
        if now is None:
            now = datetime.now(pytz.UTC)
        keys_to_delete = set()
        for request in self.requests:
            if (now - request.datetime).total_seconds() > self.monitor_limit_seconds:
                keys_to_delete.add(request)

        for key in keys_to_delete:
            request = self.requests[key]
            self.count -= request.count
            # IpMonitor.objects.create(ip_address=request.ip_address, datetime=request.datetime, count=request.count)
            del self.requests[key]


class IpRequest:

    def __init__(self, ip_address=None, dt=None, count=1):
        self.ip_address = ip_address
        self.datetime = datetime.now(pytz.UTC) if not dt else dt
        self.count = count

    def __eq__(self, other):
        if (
            values_equal(self.ip_address, other.ip_address) 
            and values_equal(self.datetime, other.datetime)
        ):
            return True
        return False
    
    def __hash__(self):
        return hash((self.ip_address, self.datetime))
    
    def __str__(self):
        return f'IP: ({self.ip_address}) @ {self.datetime.isoformat()} (x{self.count})'

    def __repr__(self):
        return str(self)

    # https://stackoverflow.com/questions/4581789/how-do-i-get-user-ip-address-in-django
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        return x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')
    
    def from_django(self, request):
        self.ip_address = self.get_client_ip(request)
        self.datetime = datetime.now(pytz.UTC)  # should have a way to get django request datetime?
        self.count = 1
        return self
