cd famous_quotes/
sleep 10
python manage.py collectstatic --noinput
# gunicorn famous_quotes.wsgi --bind 0.0.0.0:8000
python manage.py runserver 0.0.0.0:8000
