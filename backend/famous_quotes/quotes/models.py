from datetime import datetime, timedelta
import logging
import pytz

from django.db import models, transaction
from django.contrib.auth.models import User

from .utils import generate_random_code
import pdb

logger = logging.getLogger('fq')


class UserSession(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    session_username = models.CharField(max_length=100, null=True, blank=True)
    session_key = models.CharField(max_length=100, null=True, blank=True)
    last_active = models.DateTimeField(null=True, blank=True)
    password_reset_code = models.CharField(max_length=64, null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.session_key}"
    
    class Meta:
        indexes = [models.Index(fields=['session_key'])]


class Category(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    category = models.CharField(max_length=50, null=False, blank=False, unique=True)

    def __str__(self):
        return self.category


class Quote(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    quote = models.TextField(null=False, max_length=5000)
    author = models.CharField(null=False, max_length=300)
    context = models.TextField(null=True, blank=True, max_length=1000)

    total_upvotes = models.IntegerField(default=0)
    total_downvotes = models.IntegerField(default=0)
    net_votes = models.IntegerField(default=0)
    popularity = models.FloatField(default=0.5)

    duplicate_votes = models.IntegerField(default=0)
    offensive_votes = models.IntegerField(default=0)
    misattribution_votes = models.IntegerField(default=0)
    misattribution_resolved = models.BooleanField(default=False)

    categories = models.ManyToManyField(Category)

    # cannot have a foreign key to itself
    redirect_quote = models.BigIntegerField(null=True, blank=True)

    def merge_with(self, other_quote):
        if type(other_quote) == int:
            other_quote = Quote.objects.get(pk=other_quote)
        
        # need to take the quotes off the old one, and update the vote table
        with transaction.atomic():
            # note: up/down votes for self get updated automatically when the vote gets saved

            other_quote.total_upvotes = 0
            other_quote.total_downvotes = 0

            for category in other_quote.categories.all():
                self.categories.add(category.id)
            
            votes = Vote.objects.filter(quote=other_quote)
            for vote in votes:
                vote.quote = self
                vote.save()

            # most importantly - set up the redirect!
            other_quote.redirect_quote = self.id

            self.save()
            other_quote.save()

            logger.info(f'Quote {self.id} successfully merged with quote {other_quote.id}!')


    def update_popularity(self):

        total_votes = self.total_upvotes + self.total_downvotes
        if total_votes == 0:
            self.popularity = 0.5
            return

        self.popularity = self.total_upvotes / total_votes

        # adjust popularity score based on number of votes
        # if more than 20 votes, don't adjust
        # if 1 vote, then max/min are 80%/20%
        # adjust linearly in-between
        if total_votes >= 20:
            return
        factor = 0.6 + 0.4 / 18 * (total_votes-1)
        self.popularity = (self.popularity - 0.5) * factor + 0.5

        # co-ords: (1,0.6), (10, 0.8), (19,1.0). These two lines DO NOT HAVE THE SAME GRADIENT
        # instead - move n_votes from 20 to 19. these means both lines have dx = 9 and dy = 0.2


    def update_votes(self, vote_value):
        if vote_value > 0:
            self.total_upvotes += 1
            self.net_votes += 1
        elif vote_value < 0:
            self.total_downvotes += 1
            self.net_votes -= 1
        
        # votes have changed therefore need to update popularity
        self.update_popularity()
        

    def __str__(self):
        return f"Quote {self.id} - {self.author} - {self.quote}"

    @property
    def short_description(self):
        return f"Quote {self.id} - {self.author} - {self.quote[:20]}"

    class Meta:
        ordering = ['-popularity', '-total_upvotes']
        indexes = [models.Index(fields=['author'])]


class QuoteList(models.Model):

    @staticmethod
    def make_code():  # just utility function with specific config
        return generate_random_code(8, uppers=True, symbols=False, lowers=False, digits=False)

    created_at = models.DateTimeField(auto_now_add=True)

    name = models.CharField(max_length=100, null=False)
    external_id = models.CharField(max_length=20, null=False, blank=True, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    quotes = models.ManyToManyField(Quote)

    def __str__(self):
        return f"{self.id}: {self.user.email if self.user else '-'} - {self.name}"

    class Meta:
        indexes = [models.Index(fields=['user'])]

    def save(self, *args, **kwargs):

        # create external id and ensure it is unique
        if not self.external_id:

            code = self.make_code()
            while QuoteList.objects.filter(external_id=code).count() > 0:
                code = self.make_code()
            self.external_id = code
        
        super().save(*args, **kwargs)


class Vote(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=100, null=True, blank=True)
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE)
    value = models.IntegerField()

    class Meta:
        indexes = [
            models.Index(fields=['user']), 
            models.Index(fields=['quote']),
        ]
    
    def __str__(self):
        return f"{self.id}: {self.user.email if self.user else 'null_user'} - QuoteId: {self.quote.id}"

    @property
    def short_description(self):
        return f"{self.quote.author} - {self.quote.quote if len(self.quote.quote) < 30 else self.quote.quote[:30]+'...'}"


    def save(self, *args, **kwargs):

        # when saving the vote, update the quote data
        with transaction.atomic():
            self.quote.update_votes(self.value)
            self.quote.save()
            super().save(*args, **kwargs)


class Analytic(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    datetime = models.DateTimeField(null=False, blank=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    session_id = models.CharField(null=True, max_length=100)
    action = models.CharField(max_length=1000, null=False, blank=False)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['session_id','datetime'])]

    def __str__(self):
      return f"{self.id} - {self.session_id} @ {self.created_at.isoformat()}"


class Comment(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    user_session = models.ForeignKey(UserSession, on_delete=models.SET_NULL, null=True, blank=True)
    quote = models.ForeignKey(Quote, on_delete=models.SET_NULL, null=True, blank=True)

    comment = models.TextField(null=False, blank=False)
    reply = models.TextField(null=True, blank=True)
    reply_datetime = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['user_session', '-created_at']
        indexes = [models.Index(fields=['user_session', 'quote'])]

    def __str__(self):
        return f'{str(self.user.email)} - {self.created_at.isoformat()}: {self.comment[:20]}'


class QuoteOfTheDay(models.Model):
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.CASCADE)
    date = models.DateField()
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['category', 'date']
        indexes = [models.Index(fields=['date'])]


class IpMonitor(models.Model):
    '''DEFUNCT FOR NOW. May reinstate later'''
    ip_address = models.CharField(max_length=100, null=False, blank=False)
    datetime = models.DateTimeField(null=False, blank=False)
    count = models.IntegerField(null=False, blank=False, default=0)

    def __str__(self):
        return f'{self.ip_address} {self.datetime}'

    class Meta:
        indexes = [models.Index(fields=['datetime', 'ip_address'])]


class IpThrottle(models.Model):
    ip_address = models.CharField(max_length=100, null=False, blank=False)
    block_expires = models.DateTimeField(null=True, blank=True, default=datetime.now(pytz.UTC)+timedelta(days=1))
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.ip_address} - blocked until {self.block_expires.isoformat()}'
