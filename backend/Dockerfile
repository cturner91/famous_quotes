FROM python:3.10
ENV PYTHONUNBUFFERED 1
WORKDIR /app
COPY requirements.txt /app
RUN pip install -r requirements.txt
COPY ./famous_quotes/ /app
RUN apt-get update && apt-get install -y default-mysql-client
