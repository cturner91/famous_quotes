from secrets import *

ALLOWED_HOSTS = [
    '.famous-quotes.uk',
    '.ctsoftware.co.uk',
]

# https://stackoverflow.com/questions/8436666/how-to-make-python-on-heroku-https-only/26670053#26670053
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

CORS_ALLOWED_ORIGINS = [
    'https://www.famous-quotes.uk',
    'https://www.ctsoftware.co.uk',
]
CORS_ALLOW_CREDENTIALS = True
CORS_ORIGIN_ALLOW_ALL = True  # https://stackoverflow.com/questions/67327660/cors-not-working-in-django-but-settings-seem-correct 


# CT custom IP monitoring and throttling
IP_MONITOR_LIMIT_SECONDS = 30
IP_MONITOR_LIMIT_COUNT = 30

DB_HOST='localhost'

STATIC_URL = 'static/'
STATIC_ROOT = '/app/famous_quotes/static/'
