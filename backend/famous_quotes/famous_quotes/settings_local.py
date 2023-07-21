import os
from .settings import BASE_DIR

ALLOWED_HOSTS = ['localhost']

CORS_ALLOWED_ORIGINS = [
    "http://localhost:8000",
    "http://localhost:3000",
]
CORS_ALLOW_CREDENTIALS = True

# CT custom IP monitoring and throttling
IP_MONITOR_LIMIT_SECONDS = 1
IP_MONITOR_LIMIT_COUNT = 100e3

DB_USERNAME='conor'
DB_PASSWORD='password'
DB_HOST='db'

STATIC_URL = 'static/'
STATIC_ROOT = '/app/famous_quotes/static/'
