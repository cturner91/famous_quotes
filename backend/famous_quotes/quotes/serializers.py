from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Quote, Vote, Category, QuoteList, Comment, UserSession


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']


class UserNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSession
        fields = ['session_username']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'category']


class QuoteSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True)
    class Meta:
        model = Quote
        # fields = ['id', 'quote', 'author', 'context', 'total_upvotes', 'total_downvotes', 'net_votes', 'popularity']
        fields = ['id', 'quote', 'author', 'context', 'total_upvotes', 'total_downvotes', 'net_votes', 'popularity', 'categories']


class VoteSerializerExpanded(serializers.ModelSerializer):
    quote = QuoteSerializer()
    created_at = serializers.DateTimeField(format='%Y-%m-%d')
    class Meta:
        model = Vote
        fields = ['id', 'created_at', 'quote', 'value']


class VoteSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(format='%Y-%m-%d')
    class Meta:
        model = Vote
        fields = ['id', 'created_at', 'quote', 'value']


class QuoteListSerializer(serializers.ModelSerializer):

    quotes = QuoteSerializer(many=True)

    class Meta:
        model = QuoteList
        fields = ['id', 'name', 'external_id', 'quotes']


class CommentSerializerFull(serializers.ModelSerializer):
    user_session = UserNameSerializer()
    quote = QuoteSerializer()

    class Meta:
        model = Comment
        fields = ['id', 'created_at', 'user_session', 'quote', 'comment', 'reply', 'reply_datetime']


class CommentSerializerMin(serializers.ModelSerializer):
    user_session = UserNameSerializer()
    class Meta:
        model = Comment
        fields = ['id', 'created_at', 'user_session', 'quote', 'comment', 'reply', 'reply_datetime']
