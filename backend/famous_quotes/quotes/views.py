from datetime import datetime, timedelta
import json
import pytz
import logging
import random

from django.core.validators import validate_email
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.db import transaction
from django.http import JsonResponse
from django.core.mail import send_mail
from django.template import loader
from django.conf import settings
from django.shortcuts import render
from django.views.decorators.cache import cache_page

import pdb

from .serializers import *
from .models import *
from .utils import check_session, get_data, clean_dict, generate_random_code
from .constants import PASSWORD_RESET_URL
from .throttling import IpMonitorLive

logger = logging.getLogger('fq')


ip_monitor = IpMonitorLive(
    monitor_limit_seconds=settings.IP_MONITOR_LIMIT_SECONDS, 
    monitor_limit_count=settings.IP_MONITOR_LIMIT_COUNT
)


def throttle_response():
    return JsonResponse({'message': 'This IP address has been temporarily banned to protect our servers.\n\nIf you are a legitimate website user, please try using the website at a slower pace.'}, status=403)

def UserView(request):
    if not ip_monitor.add_request(request):
        return throttle_response()
    request = check_session(request)
    data = get_data(request)
    logger.info(f'{request.session.session_key} {request.method}')

    if request.method == 'GET':
    
        requested_id = data.get('id', '')
        if not requested_id:
            logger.warn(f'{request.session.session_key} {request.method} No userId provided')
            return JsonResponse({'message': 'Need UserId in request'}, status=400)

        # user can only get THEIR OWN data
        user_id = request.user.id
        if int(requested_id) != user_id:
            if request.user.is_authenticated:
                logger.warn(f'{request.session.session_key} {request.method} request non-self user data')
                return JsonResponse({'message': 'Can only return your own data'}, status=403)
            else:
                logger.warn(f'{request.session.session_key} {request.method} not authenticated')
                return JsonResponse({'message': 'Must be authenticated to get user data'}, status=401)

        # do we want a summary view i.e. all related data too?
        # faster than making multiple API calls...
        is_summary = True if request.GET.get('s', False) else False

        if not is_summary:
            # basic user info only
            try:
                user_session = UserSession.objects.filter(user_id=requested_id).select_related('user')[0]
                response_data = dict(UserSerializer(user_session.user).data)
                response_data['username'] = user_session.session_username
                return JsonResponse({'message': 'OK', 'user': response_data}, status=200)
            except:
                logger.warn(f'{request.session.session_key} {request.method} Could not find this user: {requested_id}')
                return JsonResponse({'message': 'Could not find this user'}, status=400)

        else:
            # full user-summary
            try:

                # if one of these sections fails, want to know where/how, so build a log message
                log_msg = ''

                user_session = UserSession.objects.filter(user_id=requested_id).select_related('user')[0]
                user = user_session.user
                log_msg += 'user OK'
                
                votes = Vote.objects.filter(user=user).order_by('-created_at').prefetch_related('quote')[:50]
                log_msg += '+ votes OK'
                
                quotelists = QuoteList.objects.filter(user=user).prefetch_related('quotes')
                log_msg += '+ quotelists OK'
                
                quotes = Quote.objects.filter(user=user)
                log_msg += '+ quotes OK'

                comments = Comment.objects.filter(user_session__user=user)
                log_msg += '+ comments OK'

                def reformat_response(data):  # I can't get serializers doing what I need, so bodge it here for now
                    data['username'] = data['user_session']['session_username']
                    del data['user_session']
                    return data
                comments = [CommentSerializerFull(comment).data for comment in comments]
                comments = [reformat_response(comment) for comment in comments]

                logger.info(f'{request.session.session_key} {request.method} Successfully returned full summary for: {requested_id}')
                return JsonResponse({
                    'message': 'OK', 
                    'user': {
                        'id': user_id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'username': user_session.session_username,
                        'quotes': [QuoteSerializer(quote).data for quote in quotes],
                        'quotelists': [QuoteListSerializer(quotelist).data for quotelist in quotelists],
                        'votes': [VoteSerializerExpanded(vote).data for vote in votes],
                        'comments': comments,
                    },
                }, status=200)
            except:
                logger.warn(f'{request.session.session_key} {request.method} Could not return user summary - {log_msg}')
                return JsonResponse({'message': 'Something went wrong when extracting data'}, status=400)


    elif request.method == 'POST':
        
        email = data.get('email', '')
        password1 = data.get('password1', '')
        password2 = data.get('password2', '')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        request_username = data.get('username', '')

        if not email or not password1 or not password2:
            logger.warn(f'{request.session.session_key} {request.method} Did not have all inputs')  # never ever log a password
            return JsonResponse({'message': 'Did not have all inputs'}, status=400)

        if password1 != password2:
            logger.warn(f'{request.session.session_key} {request.method} Could not create user - passwords did not match')
            return JsonResponse({'message': 'Passwords do not match'}, status=400)
        
        try:
            validate_email(email)
        except:
            logger.warn(f'{request.session.session_key} {request.method} Bad email: {email}')
            return JsonResponse({'message': 'Email invalid'}, status=400)

        try:
            with transaction.atomic():
                user = User.objects.create_user(email=email, username=email, password=password1, first_name=first_name, last_name=last_name)
                logger.info(f'{request.session.session_key} {request.method} User created: {user.id}')

                # login invalidates the user's session so we must manually re-assign it
                login(request, user)
                logger.info(f'{request.session.session_key} {request.method} User logged in')

                request = check_session(request)
                logger.info(f'{request.session.session_key} {request.method} Session updated')

                session = UserSession.objects.create(
                    user=user, 
                    session_username=request_username, 
                    session_key=request.session.session_key,
                    last_active=datetime.now(tz=pytz.UTC),
                )
                logger.info(f'{request.session.session_key} {request.method} UserSession created: {session.id}')

                # rather than getting hung up on serializers etc - just stitch the username into the response manually
                response_data = dict(UserSerializer(user).data)
                response_data['username'] = request_username
                return JsonResponse({'message': 'User created', 'user': response_data}, status=201)
        except:
            logger.warn(f'{request.session.session_key} {request.method} Could not create user - unknown why')
            return JsonResponse({'message': 'Could not create user'}, status=400)

    elif request.method == 'PUT':

        user_id = data.get('user_id', None)
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        request_username = data.get('username', '')

        if not user_id:
            logger.warn(f'{request.session.session_key} {request.method} PUT without user id')
            return JsonResponse({'message': 'Cannot update without user id'}, status=400)

        try:
            user_id = int(user_id)
        except:
            logger.warn(f'{request.session.session_key} {request.method} user_id {user_id} could not be cast to int')
            return JsonResponse({'message': 'Provided user id invalid'}, status=400)

        
        try:
            user = User.objects.get(id=user_id)
            session = UserSession.objects.get(user=user)
        except:
            logger.warn(f'{request.session.session_key} {request.method} Could not get user and session with id: {user_id}')
            return JsonResponse({'message': 'Could not find this user'}, status=400)

        with transaction.atomic():
            user.first_name = first_name
            user.last_name = last_name
            user.save()
            logger.info(f'{request.session.session_key} {request.method} User updated: {user.id}')

            session.session_username = request_username
            session.save()
            logger.info(f'{request.session.session_key} {request.method} UserSession found: {session.id}')


        # rather than getting hung up on serializers etc - just stitch the username into the response manually
        try:
            response_data = dict(UserSerializer(user).data)
            response_data['username'] = session.session_username
            return JsonResponse({'message': 'User updated', 'user': response_data}, status=200)

        except:
            logger.warn(f'{request.session.session_key} {request.method} Problem during serialisation for user: {user_id}')
            return JsonResponse({'message': 'Could not update user'}, status=400)

    else:
        logger.warn(f'{request.session.session_key} {request.method} Bad Http method')
        return JsonResponse({'message': 'Bad HTTP method for this endpoint'}, status=400)


def LoginView(request):
    if not ip_monitor.add_request(request):
        return throttle_response()
    request = check_session(request)
    logger.info(f'{request.session.session_key} {request.method}')

    if request.method != 'POST':
        logger.warn(f'{request.session.session_key} {request.method} Bad Http method: {request.method}')
        return JsonResponse({'message': 'Http method not recognised'}, status=400)
    
    data = get_data(request)
    email = data.get('email', '')
    password = data.get('password','')
    if not email or not password:
        logger.warn(f'{request.session.session_key} {request.method} Need both email and password')
        return JsonResponse({'message': 'Need both email and password'}, status=400)

    user = authenticate(request, username=email, password=password)
    if user is not None:
        login(request, user)
        logger.info(f'{request.session.session_key} {request.method} login successful')
        response = JsonResponse({'message': 'Login successful', 'user': UserSerializer(user).data}, status=200)

        # add session to UserSession table
        existing_session, _ = UserSession.objects.get_or_create(user=request.user)
        existing_session.session_key = request.session.session_key
        existing_session.last_active = datetime.now(tz=pytz.UTC)
        existing_session.save()
        logger.info(f'{request.session.session_key} {request.method} session updated')
        return response
    else:
        logger.warn(f'{request.session.session_key} {request.method} login unsuccessful')
        return JsonResponse({'message': 'Login unsuccessful'}, status=400)


def LogoutView(request):
    logger.info(f'{request.session.session_key} {request.method}')

    if request.method != 'POST':
        logger.warn(f'{request.session.session_key} {request.method} Bad Http method: {request.method}')
        return JsonResponse({'message': 'Must be POST request'}, status=400)

    if not request.user.is_authenticated:
        logger.warn(f'{request.session.session_key} {request.method} logout unsuccessful - unauthenticated')
        return JsonResponse({'message': 'Cannot logout an unauthenticated user'}, status=400)
    
    logout(request)
    logger.info(f'{request.session.session_key} {request.method} logout successful')
    return JsonResponse({'message': 'Logged out'}, status=200)


def ValidateSessionView(request):
    if not ip_monitor.add_request(request):
        return throttle_response()
    # should limit to GET or POST? Does it matter?!

    logger.info(f'{request.session.session_key} {request.method}')

    # return code should be 200, rather than 400, even if invalid. This is for SEO reasons
    if not request.session.session_key:
        return JsonResponse({'valid': False}, status=200)
    
    try:
        session = UserSession.objects.get(session_key=request.session.session_key)
        return JsonResponse({'valid': True, 'user': session.user.id}, status=200)
    except:
        return JsonResponse({'valid': False}, status=200)


@cache_page(60 * 5)
def HomeScreenView(request):
    if not ip_monitor.add_request(request):
        return throttle_response()

    logger.info(f'{request.session.session_key} {request.method}')

    # shortcut - if we are the home screen, don't want to make multiple requests to the API (7 currently)
    # instead - batch the specific requests together and provide in a single response
    if request.method != 'GET':
        logger.warn(f'{request.session.session_key} {request.method} bad http method: {request.method}')
        return JsonResponse({'message': 'Http method not allowed'}, status=400)

    # need:
    # * 4 of the top 20 most popular quotes
    # * 2 random quotes with min 50% popularity
    # * top 2 quotes for each of: motivational, travel, funny, political, career

    top_quotes = list(Quote.objects.filter(redirect_quote__isnull=True).order_by('-popularity')[:20])
    top_quotes = random.sample(top_quotes, 4)
    random_quotes = Quote.objects.filter(popularity__gt=0.5, redirect_quote__isnull=True).order_by('?')[:2]
    
    categories = Category.objects.filter(category__in=['Motivation', 'Travel', 'Funny', 'Politics', 'Career'])
    category_quotes = {}
    for category in categories:
        category_quotes[category.category] = list(Quote.objects.filter(categories__category=category, redirect_quote__isnull=True).order_by('-popularity')[:2])

    data = {
        'top':        [QuoteSerializer(quote).data for quote in top_quotes],
        'random':     [QuoteSerializer(quote).data for quote in random_quotes],
        'motivation': [QuoteSerializer(quote).data for quote in category_quotes['Motivation']],
        'travel':     [QuoteSerializer(quote).data for quote in category_quotes['Travel']],
        'funny':      [QuoteSerializer(quote).data for quote in category_quotes['Funny']],
        'politics':   [QuoteSerializer(quote).data for quote in category_quotes['Politics']],
        'career':     [QuoteSerializer(quote).data for quote in category_quotes['Career']],
    }
    return JsonResponse({'message': 'OK', 'data': data}, status=200)


def QuoteView(request):
    if not ip_monitor.add_request(request):
        return throttle_response()
    request = check_session(request)
    data = get_data(request)
    logger.info(f'{request.session.session_key} {request.method} Quotes API request parameters: %s', data)

    if request.method == 'GET':

        ALLOWABLE_SORT_BY = ['', 'random', 'newest', 'oldest', 'popularity', 'net_votes', 'total_upvotes', 'total_downvotes']
        ALLOWABLE_SORT_BY.extend(['-popularity', '-net_votes', '-total_upvotes', '-total_downvotes'])
        MAX_N = 20

        try:
            sort_by = data.get('s', '')
            if sort_by not in ALLOWABLE_SORT_BY:
                logger.warn(f"%s Bad sort value: %s", request.session.session_key, sort_by)
                return JsonResponse({'message': 'Sort value not allowed'}, status=400)
            if sort_by == 'random':
                sort_by = '?'
            elif sort_by == 'newest':
                sort_by = '-created_at'
            elif sort_by == 'oldest':
                sort_by = 'created_at'

        except:
            logger.warn(f"{request.session.session_key} {request.method} Bad sort value: {sort_by}")
            return JsonResponse({'message': 'Sort value invalid'}, status=400)

        try:
            ids = data.get('ids', None)
            if ids:
                ids = ids.split(',')
        except:
            logger.warn(f"{request.session.session_key} {request.method} Bad ids value: {ids}")
            return JsonResponse({'message': 'Ids value invalid'}, status=400)

        try:
            offset = data.get('o', 0)
            offset = int(offset)  # do in two steps so offset gets assigned for logging if fault
            if offset < 0:
                offset = 0
        except:
            logger.warn(f"{request.session.session_key} {request.method} Bad offset value: {offset}")
            return JsonResponse({'message': 'Offset value invalid'}, status=400)

        try:
            number = data.get('n', MAX_N)
            number = int(number)
            if number > MAX_N or number < 1:
                number = MAX_N
        except:
            logger.warn(f"{request.session.session_key} {request.method} Bad N value: {number}")
            return JsonResponse({'message': 'N value invalid'}, status=400)


        # default ordering for quoteset should be '-total_upvotes,-popularity'.
        # if quotes are tired on popualrity e.g. 100%, then the one with most votes should win
        queryset = Quote.objects.all()
        queryset = queryset.order_by(sort_by) if sort_by else queryset.order_by('-total_upvotes', '-popularity')
        
        # apply filters
        if ids:
            queryset = queryset.filter(id__in=ids)
        else:
            # the ONLY case where we don't want to get redirected quotes is if users are looking for specific IDs
            queryset = queryset.filter(redirect_quote__isnull=True)

        author = data.get('author', '')
        if author:
            queryset = queryset.filter(author__icontains=author)

        quote = data.get('quote', '')
        if quote:
            queryset = queryset.filter(quote__icontains=quote)

        context = data.get('context', '')
        if context:
            queryset = queryset.filter(context__icontains=context)

        # can only filter by user if YOU ARE THAT USER
        requested_user = data.get('user', '')
        if requested_user and request.user.is_authenticated:
            user = int(request.user.id)
            if user == int(requested_user):
                queryset = queryset.filter(user__id=user)
            else:
                logger.warn(f"{request.session.session_key} {request.method} Trying to filter by non-self user: {user}")
                return JsonResponse({'message': 'Cannot get quotes for this user'}, status=403)

        # filter on categories
        categories = request.GET.get('categories','')
        if categories:
            categories = categories.split(',')
            for category in categories:
                queryset = queryset.filter(categories__category=category)

        # return response
        queryset = queryset.prefetch_related('categories')
        serializer = QuoteSerializer(queryset[offset:offset+number], many=True)
        return JsonResponse({'message': 'OK', 'data': serializer.data}, status=200)

    elif request.method == 'POST':

        # ensure they are authenticated ??? decsion to be made here...
        # for now - YES. Makes it easier data-wise. Want to be able to show users how their quotes are performing, so force people to make an account to show quotes
        # ALSO YES - stops spam bots with ads for viagra
        if not request.user.is_authenticated:
            return JsonResponse({'message': 'Must be logged in to submit quotes'}, status=401)

        # minimum length on quote? If author is not known, people might put "-" which is fair enough, but quote must be > 1 word surely
        # hoping this may reduce spam...
        quote = data.get('quote', '')
        if not quote:
            logger.warn(f"{request.session.session_key} {request.method} Not quote: {quote}")
            return JsonResponse({'message': 'Must provide a quote'}, status=400)
        if len(quote) < 5:
            logger.warn(f"{request.session.session_key} {request.method} Quote too short: {quote}")
            return JsonResponse({'message': 'Quote looks to be too short'}, status=400)

        author = data.get('author', '')
        if not author:
            logger.warn(f"{request.session.session_key} {request.method} Not author: {author}")
            return JsonResponse({'message': 'Must provide an author'}, status=400)

        context = data.get('context', '')        
        
        # ensure data is valid
        try:
            with transaction.atomic():
                quote_model = Quote(quote=quote, author=author, context=context, user=request.user)
                quote_model.save()  # needs to be in DB before many-to-many values can be added
                logger.info(f"{request.session.session_key} {request.method} quote saved successfully")

                categories = data.get('categories', [])
                if type(categories) != list:  # helper function may pull out scalar value - force to list
                    categories = [categories]

                # ensure all catgories exist
                if categories:
                    logger.info(f"{request.session.session_key} {request.method} Adding categories: %s", categories)
                    categories_from_db = Category.objects.filter(id__in=categories)
                    if not len(categories_from_db) == len(categories):
                        logger.warn(f"{request.session.session_key} {request.method} One or more categories invalid: %s", categories)
                        return JsonResponse({'message': 'Categories not valid'}, status=400)

                # categories validated - add to model
                for category_id in categories:
                    quote_model.categories.add(category_id)
                quote_model.save()
                logger.info(f"{request.session.session_key} {request.method} quote re-saved successfully with categories")

            return JsonResponse({'message': 'Quote created', 'data': QuoteSerializer(quote_model).data}, status=201)

        except:
            logger.info(f"{request.session.session_key} {request.method} error with supplied data")
            return JsonResponse({'message': 'Error with the supplied data'}, status=400)



def VoteView(request):
    if not ip_monitor.add_request(request):
        return throttle_response()
    request = check_session(request)
    data = get_data(request)
    logger.info(f'{request.session.session_key} {request.method} Votes API request parameters: %s', data)

    if request.method == 'POST':

        # should be allowed to vote even if not authenticated
        user = request.user
        if not user.is_authenticated:
            user = None

        quote_id = data.get('quote_id', None)
        if not quote_id:
            logger.warn(f'{request.session.session_key} {request.method} Not quote_id: {quote_id}')
            return JsonResponse({'message': 'Request needs a quote'}, status=400)
        
        value = data.get('value', None)
        if not value:
            logger.warn(f'{request.session.session_key} {request.method} Not value: {value}')
            return JsonResponse({'message': 'Request needs a value'}, status=400)
        
        try:
            value = int(value)
        except:
            logger.warn(f'{request.session.session_key} {request.method} Value not integer: {value}')
            return JsonResponse({'message': 'Value must be integer'}, status=400)

        if value != -1 and value != 1:
            logger.warn(f'{request.session.session_key} {request.method} Value not +/- 1: {value}')
            return JsonResponse({'message': 'Value must be +/- 1'}, status=400)
                
        session_key = request.session.session_key

        # has this user voted on this quote recently?
        # can't use user as a filter as could be unauthenticated
        recent_dt = (datetime.now(tz=pytz.UTC) + timedelta(hours=-1))  # cannot vote again within X hours - if it's a full day, people may not come back as much
        recent_votes = Vote.objects.filter(created_at__gte=recent_dt, quote_id=quote_id, session_id=session_key).count()  # using count means we return less data?
        if recent_votes > 0:
            logger.warn(f'{request.session.session_key} {request.method} Voting twice in quick succession: {quote_id}')
            return JsonResponse({'message': 'Cannot vote twice in quick succession'}, status=400)

        try:
            quote = Quote.objects.get(pk=quote_id)
            vote = Vote(quote=quote, user=user, session_id=session_key, value=int(value))
            vote.save()
            logger.info(f'{request.session.session_key} {request.method} Vote saved successfully: {vote.id}')
            return JsonResponse({'message': 'OK', 'data': VoteSerializer(vote).data}, status=201)

        except:
            logger.warn(f'{request.session.session_key} {request.method} Could not create vote: %s', data)
            return JsonResponse({'message': 'Could not create vote from provided data'}, status=400)


    elif request.method == 'GET':
        
        # determine whether or not to get the fully expanded quote
        expand = request.GET.get('x')
        if expand:
            if expand.lower() not in ['y','true','1',1]:
                logger.warn(f'{request.session.session_key} {request.method} Bad expand value: %s', expand)
                return JsonResponse({'message': 'Bad expand value'}, status=400)

            queryset = Vote.objects.all().order_by('-created_at').select_related('quote')
        else:
            queryset = Vote.objects.all().order_by('-created_at')  # most recent first

        # can only filter by user or quote
        quote = request.GET.get('quote')
        if quote:
            try:
                quote_id = int(quote)
            except:
                logger.warn(f'{request.session.session_key} {request.method} Could not convert quote to int: %s', quote)
                return JsonResponse({'message': 'Bad quote value'}, status=400)

            queryset = queryset.filter(quote_id=quote_id)
        
        user = request.GET.get('user')
        if user:
            try:
                user_id = int(user)
            except:
                logger.warn(f'{request.session.session_key} {request.method} Could not convert user to int: %s', user)
                return JsonResponse({'message': 'Bad user value'}, status=400)

            if not request.user.is_authenticated or user_id != request.user.id:
                logger.warn(f'{request.session.session_key} {request.method} Can only return your own votes i.e. for user: %s', user_id)
                return JsonResponse({'message': 'Forbidden'}, status=403)

            queryset = queryset.filter(user_id=user_id)

        # make sure we're not about to dump every vote ever
        if not quote and not user:
            logger.warn(f'{request.session.session_key} {request.method} Cannot return every single vote')
            return JsonResponse({'message': 'Cannot return every single vote - filter by quote or by user'}, status=400)

        if expand:
            queryset = [VoteSerializerExpanded(x).data for x in queryset]
        else:
            queryset = [VoteSerializer(x).data for x in queryset]

        # return all individual votes, but also package as a summary?
        def month_day(dt_string):
            return dt_string[:10]

        def year_month(dt_string):
            return dt_string[:7]

        days = sorted(list(set([month_day(x['created_at']) for x in queryset]))[-21:])  # max 21?
        months = sorted(list(set([year_month(x['created_at']) for x in queryset]))[-12:])  # max 12
        summary = {'daily': {}, 'monthly': {}}
        for day in days:
            query_subset = [x for x in queryset if month_day(x['created_at'])==day]
            upvotes = [x for x in query_subset if x['value']==1]
            downvotes = [x for x in query_subset if x['value']==-1]
            summary['daily'][day] = {'upvotes': len(upvotes), 'downvotes': len(downvotes)}
        for month in months:
            query_subset = [x for x in queryset if year_month(x['created_at'])==month]
            upvotes = [x for x in query_subset if x['value']==1]
            downvotes = [x for x in query_subset if x['value']==-1]
            summary['monthly'][month] = {'upvotes': len(upvotes), 'downvotes': len(downvotes)}

        return JsonResponse({'message': 'OK', 'data': queryset, 'summary': summary}, status=200)
        


    else:
        logger.warn(f'{request.session.session_key} {request.method} Http method {request.method} to Vote endpoint')
        return JsonResponse({'message': 'Http method not allowed'}, status=400)


@cache_page(60 * 60 * 24)
def CategoriesView(request):
    if not ip_monitor.add_request(request):
        return throttle_response()

    if request.method != 'GET':
        logger.warn(f'{request.session.session_key} {request.method} Bad Http method: {request.method}')
        return JsonResponse({'message': 'Must be GET'}, status=400)
    
    data = Category.objects.all().order_by('id')
    data = CategorySerializer(data, many=True).data
    return JsonResponse({'message': 'OK', 'data': data}, status=200)


def QuoteListView(request):
    if not ip_monitor.add_request(request):
        return throttle_response()

    data = get_data(request)
    if request.method == 'POST':
        
        if not request.user.is_authenticated:
            logger.warn(f'{request.session.session_key} {request.method} User not authenticated')
            return JsonResponse({'message': 'Must be authenticated to create quote-list'}, status=401)
        
        name = data.get('name', '')
        if not name:
            logger.warn(f'{request.session.session_key} {request.method} No name provided for quote list')
            return JsonResponse({'message': 'Must provide a name for quote-list'}, status=400)

        # ensure no lists already exist with this name
        quotelist_same_name = QuoteList.objects.filter(user=request.user, name=name)
        if len(quotelist_same_name) > 0:
            logger.warn(f'{request.session.session_key} {request.method} Quote-list name not unique')
            return JsonResponse({'message': 'Must provide a unique name for quote-list'}, status=400)
        
        quotelist = QuoteList.objects.create(user=request.user, name=name)
        logger.info(f'{request.session.session_key} {request.method} Quotelist created successfully: {quotelist.id}')
        return JsonResponse({'message': 'OK', 'data': QuoteListSerializer(quotelist).data}, status=201)


    elif request.method == 'PUT':
        
        if not request.user.is_authenticated:
            logger.warn(f'{request.session.session_key} {request.method} User not authenticated')
            return JsonResponse({'message': 'Must be authenticated to update quote-list'}, status=401)
        
        name = data.get('name', '')
        quotelist_id = data.get('id', '')
        if not name and not quotelist_id:
            logger.warn(f'{request.session.session_key} {request.method} Neither name nor id specified for quotelist')
            return JsonResponse({'message': 'Must provide a name or id for quote-list'}, status=400)
        
        if quotelist_id:
            quotelist = QuoteList.objects.filter(user=request.user, id=quotelist_id)
        else:
            quotelist = QuoteList.objects.filter(user=request.user, name=name)

        if len(quotelist) == 0:
            logger.warn(f'{request.session.session_key} {request.method} Could not find this quotelist - %s', {'name': name, 'quotelist_id': quotelist_id})
            return JsonResponse({'message': 'Could not find this quote list'}, status=400)
        quotelist = quotelist[0]

        quote_ids = data.get('quote_ids', [])
        # clean_dict will convert single-length list items into their scalar value
        # need to convert back to list
        if type(quote_ids) != list:
            quote_ids = [quote_ids]
        quote_ids = quote_ids

        # if marked as append, then just add quotes to list - don't delete any
        append = data.get('append', False)
        delete = data.get('delete', False)
        if append and delete:
            return JsonResponse({'message': 'Cannot mark as both delete and append'}, status=400)
        
        # get list of quotes we WANT to have
        # compare with list of quotes we CURRENTLY have
        existing_quotes_ids = set([x.id for x in quotelist.quotes.all()])

        if append:
            quotes_to_add = set(quote_ids).difference(existing_quotes_ids)

            # specific case to catch - if we're adding only a single quote, then we can return an error if it already exists
            if len(quote_ids)==1 and len(quotes_to_add)==0:
                return JsonResponse({'message': 'Quote already in list'}, status=400)

            quotelist.quotes.add(*quote_ids)

        elif delete:
            quotes_to_delete = set(quote_ids).intersection(existing_quotes_ids)

            # specific case to catch - if we're deleting only a single quote, then we can return an error if it doesn't exist
            if len(quote_ids)==1 and len(quotes_to_delete)==0:
                return JsonResponse({'message': 'Quote not in list'}, status=400)

            quotelist.quotes.remove(*quote_ids)

        else:
            quotelist.quotes.set(quote_ids)
            
        logger.info(f'{request.session.session_key} {request.method} Quotelist successfully saved: {quotelist.id}')

        return JsonResponse({'message': 'OK', 'data': QuoteListSerializer(quotelist).data}, status=200)
        

    elif request.method == 'GET':

        # special-case - if eid is provided, just get and return. No need for authentication
        external_id = data.get('eid')
        if external_id:
            quotelists = QuoteList.objects.filter(external_id=external_id).prefetch_related('quotes')
            quotelists = [QuoteListSerializer(x).data for x in quotelists]
            logger.info(f'{request.session.session_key} {request.method} Returning {len(quotelists)} quotelists for {external_id}')
            return JsonResponse({'message': 'OK', 'data': quotelists}, status=200)


        if not request.user.is_authenticated:
            logger.warn(f'{request.session.session_key} {request.method} User not authenticated')
            return JsonResponse({'message': 'Must be authenticated to get quote-list'}, status=401)

        name = data.get('name', '')
        quotelist_id = data.get('id', None)

        # if neither specified, return everything for this user
        if not name and not quotelist_id:
            quotelists = QuoteList.objects.filter(user=request.user).prefetch_related('quotes')
            quotelists = [QuoteListSerializer(x).data for x in quotelists]
            logger.info(f'{request.session.session_key} {request.method} Returning all {len(quotelists)} quotelists')
            return JsonResponse({'message': 'OK', 'data': quotelists}, status=200)

        # return a single quotelist
        try:
            if quotelist_id:
                quotelist = QuoteList.objects.get(user=request.user, id=quotelist_id)
            else:
                quotelist = QuoteList.objects.get(user=request.user, name=name)

            logger.info(f'{request.session.session_key} {request.method} Quotelist returned successfully')
            return JsonResponse({'message': 'OK', 'data': QuoteListSerializer(quotelist).data}, status=200)
        except:
            logger.warn(f'{request.session.session_key} {request.method} Could not find this quotelist - %s', {'name': name, 'quotelist_id': quotelist_id})
            return JsonResponse({'message': 'Could not find this quote-list'}, status=400)


    elif request.method == 'DELETE':

        if not request.user.is_authenticated:
            logger.warn(f'{request.session.session_key} {request.method} User not authenticated')
            return JsonResponse({'message': 'Must be authenticated to delete quote-list'}, status=401)

        name = data.get('name', '')
        quotelist_id = data.get('id', '')
        if not name and not quotelist_id:
            logger.warn(f'{request.session.session_key} {request.method} Must provide name or id for quote-list - %s', {'name': name, 'quotelist_id': quotelist_id})
            return JsonResponse({'message': 'Must provide a name or id for quote-list'}, status=400)
        
        if quotelist_id:
            quotelist = QuoteList.objects.filter(user=request.user, id=quotelist_id)
        else:
            quotelist = QuoteList.objects.filter(user=request.user, name=name)

        if len(quotelist) == 0:
            logger.warn(f'{request.session.session_key} {request.method} Cannot find this quotelist - %s', {'name': name, 'quotelist_id': quotelist_id})
            return JsonResponse({'message': 'Cannot find quote-list'}, status=400)
        quotelist = quotelist[0]

        quotelist.delete()
        logger.info(f'{request.session.session_key} {request.method} quote-list deleted successfully')
        return JsonResponse({'message': 'Quote-list deleted successfully'}, status=200)
        

    else:
        logger.warn(f'{request.session.session_key} {request.method} Bad Http method: {request.method}')
        return JsonResponse({'message': 'Method not recognised'}, status=405)



def RecommendView(request):
    if not ip_monitor.add_request(request):
        return throttle_response()

    data = get_data(request)
    
    if request.method == 'GET':

        # if logged in, use the user - otherwise, can only use the session
        if request.user.is_authenticated:
            user = request.user.id
            column = 'user'
        else:
            user = request.session.session_key
            column = 'session_id'

        # based on this person's votes, which other quotes do we think they'll like?


def QuoteReportView(request):
    # note: as I'm saving this against the quote directly, I have no way to 
    # know if this user has reported this vote on the backend :/
    # will have to implement against the frontend (if at all)

    if not ip_monitor.add_request(request):
        return throttle_response()
    request = check_session(request)
    data = get_data(request)

    if request.method != 'POST':
        logger.warn(f'{request.session.session_key} {request.method} Bad Http method: {request.method}')
        return JsonResponse({'message': 'Bad Http method'}, status=400)
    
    quote_id = data.get('quote_id')
    if not quote_id:
        logger.warn(f'{request.session.session_key} {request.method} Must provide quoteId')
        return JsonResponse({'message': 'Must provide quoteId'}, status=400)
    
    report_type = data.get('report_type')
    if not report_type:
        logger.warn(f'{request.session.session_key} {request.method} Must provide report_type')
        return JsonResponse({'message': 'Must provide report_type'}, status=400)
    report_type = report_type.lower()
    
    if report_type not in ['misattribution', 'duplicate', 'offensive']:
        logger.warn(f'{request.session.session_key} {request.method} Bad report_type: {report_type}')
        return JsonResponse({'message': 'Bad report_type'}, status=400)

    
    # get this quote
    try:
        quote = Quote.objects.get(pk=quote_id)
    except:
        logger.warn(f'{request.session.session_key} {request.method} Could not find quote: {quote_id}')
        return JsonResponse({'message': 'Could not find this quote'}, status=400)
    
    if report_type=='misattribution':
        quote.misattribution_votes += 1
    elif report_type=='duplicate':
        quote.duplicate_votes += 1
    elif report_type=='offensive':
        quote.offensive_votes += 1
    quote.save()

    logger.info(f'{request.session.session_key} {request.method} Quote report successful')
    return JsonResponse({'message': 'OK'}, status=200)


def QuoteOfTheDayView(request):
    if not ip_monitor.add_request(request):
        return throttle_response()
    
    if request.method != 'GET':
        logger.warn(f'{request.session.session_key} {request.method} Bad Http method: {request.method}')
        return JsonResponse({'message': 'Must GET from this endpoint'}, status=400)
    
    category = request.GET.get('category', '')
    if category:
        # validate category
        try:
            category_model = Category.objects.get(category__iexact=category)
        except:
            logger.warn(f'{request.session.session_key} {request.method} Bad Category value: {category}')
            return JsonResponse({'message': 'Category was not one of the expected values'}, status=400)
    
    # check if we already have a qotd for today
    current_date = datetime.now().date()
    if category:
        qotd = QuoteOfTheDay.objects.filter(category__category__iexact=category, date=current_date)
    else:
        qotd = QuoteOfTheDay.objects.filter(category__isnull=True, date=current_date)

    if qotd:
        logger.info(f'{request.session.session_key} {request.method} Category: "{category}" QOTD found (already existed): {qotd[0].quote.id}')
        return JsonResponse({'quote': QuoteSerializer(qotd[0].quote).data}, status=200)
    
    # does not exist yet - create it
    # choose the most popular quote that has not been used for a period of time
    def get_qotd_queryset(category, days_to_ignore):
        older_dt = datetime.now().date() - timedelta(days=days_to_ignore)
        if category:
            recent_qotds = list(QuoteOfTheDay.objects
                .filter(category__category__iexact=category, date__gte=older_dt)
                .prefetch_related('quote')
                .values_list('quote_id', flat=True)
            )
            
            quoteset = (Quote.objects
                .exclude(id__in=recent_qotds)
                .filter(categories__category__iexact=category, redirect_quote__isnull=True)
                .order_by('-popularity','-total_upvotes')
            )
        else:
            recent_qotds = list(QuoteOfTheDay.objects
                .filter(category__isnull=True, date__gte=older_dt)
                .prefetch_related('quote')
                .values_list('quote_id', flat=True)
            )

            # do not filter on category at all - can pick any quote from any category
            quoteset = (Quote.objects
                .exclude(id__in=recent_qotds)
                .filter(redirect_quote__isnull=True)
                .order_by('-popularity','-total_upvotes')  
            )
        
        return list(quoteset)
    
    # try 6 months at first - if no results, reduce the timeframe
    # keep reducing until 1 week - if still no results, apologise and finish
    found = False
    for days in [180, 90, 45, 30, 14, 7]:
        quoteset = get_qotd_queryset(category, days)
        if len(quoteset) > 0:
            found = True
            break

    if not found:
        logger.warn(f'{request.session.session_key} {request.method} Could not find a suitable quote')
        return JsonResponse({'message': 'Could not find a suitable quote'}, status=400)

    # add to db
    if category:
        qotd = QuoteOfTheDay.objects.create(date=current_date, category=category_model, quote=quoteset[0])
    else:
        qotd = QuoteOfTheDay.objects.create(date=current_date, quote=quoteset[0])
    
    logger.info(f'{request.session.session_key} {request.method} Category: "{category}" QOTD returned successfully (generated): {qotd.quote.id}')
    return JsonResponse({'message': 'OK', 'quote': QuoteSerializer(qotd.quote).data}, status=200)


def ForgotPasswordView(request):
    if not ip_monitor.add_request(request):
        return throttle_response()
    request = check_session(request)
    data = get_data(request)

    # if request.method == 'GET':
    if request.method == 'POST':

        email = data.get('email')
        if not email:
            logger.warning(f'{request.session.session_key} {request.method} Needs email')
            return JsonResponse({'message': 'Need an email address to send to'}, status=400)

        # for this user, create a code
        try:
            user = UserSession.objects.get(user__email=email)
        except:
            logger.warning(f'{request.session.session_key} {request.method} Couldn\'t get user with email: {email}')
            return JsonResponse({'message': 'User does not exist with this email'}, status=400)
        
        code = generate_random_code(32, uppers=True, digits=True, lowers=False, symbols=False)
        user.password_reset_code = code
        user.valid_until = datetime.now(tz=pytz.UTC) + timedelta(days=1)
        user.save()

        base_url = 'http://localhost:3000/' if settings.DEBUG else 'https://famous-quotes.uk/'
        link = f'{base_url}password-reset/?code={code}'

        template = loader.get_template('quotes/forgot_password.html')
        context = {'email': email, 'link': link}
        html_message = template.render(context)

        success = send_mail(
            'Famous-Quotes.uk - Password reset',
            None,
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
            html_message=html_message,
        )

        if success:
            logger.info(f'{request.session.session_key} {request.method} Email sent successfully')
            return JsonResponse({'message': 'Email sent successfully'}, status=200)
        else:
            logger.warning(f'{request.session.session_key} {request.method} Email failed')
            return JsonResponse({'message': 'Email failed to send'}, status=500)

    else:
        logger.warning(f'{request.session.session_key} {request.method} Bad Http method')
        return JsonResponse({'message': 'Http method not recognised'}, status=400)


def ResetPasswordView(request):
    if not ip_monitor.add_request(request):
        return throttle_response()
    request = check_session(request)
    data = get_data(request)

    # if request.method == 'GET':
    if request.method == 'POST':

        code = data.get('code')
        if not code:
            logger.warning(f'{request.session.session_key} {request.method} No code provided')
            return JsonResponse({'message': 'Cannot reset password without a valid code'}, status=400)
        
        email = data.get('email')
        if not email:
            logger.warning(f'{request.session.session_key} {request.method} No email provided')
            return JsonResponse({'message': 'Cannot reset password without email'}, status=400)
        

        password1 = data.get('password1')
        if not password1:
            logger.warning(f'{request.session.session_key} {request.method} No password1')
            return JsonResponse({'message': 'Must provide password'}, status=400)

        password2 = data.get('password2')
        if not password2:
            logger.warning(f'{request.session.session_key} {request.method} No password2')
            return JsonResponse({'message': 'Must provide confirmation password'}, status=400)
        
        if password1 != password2:
            logger.warning(f'{request.session.session_key} {request.method} Passwords do not match')
            return JsonResponse({'message': 'Passwords must match'}, status=400)

        # get the user
        try:
            user_session = UserSession.objects.get(user__email=email)
        except:
            logger.warning(f'{request.session.session_key} {request.method} Couldn\'t get user with that email')
            return JsonResponse({'message': 'User does not exist with this email'}, status=400)
        
        # validate code
        if user_session.password_reset_code != code:
            logger.warning(f'{request.session.session_key} {request.method} Cannot validate code')
            return JsonResponse({'message': 'Cannot validate code'}, status=400)
        if datetime.now(tz=pytz.UTC) > user_session.valid_until:
            logger.warning(f'{request.session.session_key} {request.method} Code {code} expired on {user_session.valid_until.isoformat()}')
            return JsonResponse({'message': 'Code has expired'}, status=400)
        
        # passwords match and code is valid - let's update the password
        with transaction.atomic():
            user_session.user.set_password(password1)
            user_session.user.save()
            user_session.password_reset_code = None
            user_session.valid_until = None
            user_session.save()

        logger.info(f'{request.session.session_key} {request.method} Password changed successfully')
        return JsonResponse({'message': 'OK'}, status=200)
    
    else:
        logger.warning(f'{request.session.session_key} {request.method} Bad Http method')
        return JsonResponse({'message': 'Http method not recognised'}, status=400)


def CommentView(request):
    if not ip_monitor.add_request(request):
        return throttle_response()
    request = check_session(request)
    data = get_data(request)

    def reformat_response(data):  # I can't get serializers doing what I need, so bodge it here for now
        data['username'] = data['user_session']['session_username']
        del data['user_session']
        return data

    if request.method == 'POST':
        
        if not request.user.is_authenticated:
            logger.warning(f'{request.session.session_key} {request.method} Request unauthenticated')
            return JsonResponse({'message': 'Must be logged in to add comments'}, status=401)
        
        user = request.user
        quote = data.get('quote')
        if str(quote) == '-1':
            quote = None
        # if quote not specified, then it is a profile comment??

        comment = data.get('comment')
        if not comment:
            logger.warning(f'{request.session.session_key} {request.method} No comment specified')
            return JsonResponse({'message': 'No comment provided'}, status=400)

        user_session = UserSession.objects.get(user_id=user)
        comment = Comment.objects.create(user_session=user_session, quote_id=quote, comment=comment)
        logger.info(f'{request.session.session_key} {request.method} Comment created successfully: {comment.id}')
        response_data = CommentSerializerFull(comment).data
        response_data = reformat_response(response_data)
        return JsonResponse({'message': 'OK', 'data': response_data}, status=201)

    elif request.method == 'GET':
        
        queryset = Comment.objects.all().order_by('-created_at')  # most often, want to show msot recent first?

        quote = data.get('quote')
        if quote:
            try:
                quote = int(quote)
            except:
                logger.warning(f'{request.session.session_key} {request.method} quote: {quote} could not be converted to int')
                return JsonResponse({'message': 'Quote must be integer'}, status=400)
            queryset = queryset.filter(quote__id=quote)

        user = data.get('user')
        if user:
            try:
                user_id = int(user)
            except:
                logger.warning(f'{request.session.session_key} {request.method} user_id: {user} could not be converted to int')
                return JsonResponse({'message': 'Bad user value'}, status=400)

            # can only get your OWN comments
            if not request.user.is_authenticated:
                logger.warning(f'{request.session.session_key} {request.method} Must be authenticated to query by user')
                return JsonResponse({'message': 'Unauthenticated'}, status=403)

            if not request.user.id == user_id:
                logger.warning(f'{request.session.session_key} {request.method} User trying to get another\'s comments')
                return JsonResponse({'message': 'Can only get your own comments'}, status=400)
            
            queryset = queryset.filter(user_session__user_id=user_id)
        
        if not user and not quote:
            logger.warning(f'{request.session.session_key} {request.method} Must filter by either user or quote!')
            return JsonResponse({'message': 'Must filter on either user or quote'}, status=400)
        
        serializer_input = data.get('type')
        if serializer_input == 'full':
            serializer = CommentSerializerFull
            reformat = True
        else:
            serializer = CommentSerializerMin
            reformat = True
        
        logger.info(f'{request.session.session_key} {request.method} Comments query OK')
        response_data = [serializer(x).data for x in queryset]
        if reformat:
            response_data = [reformat_response(x) for x in response_data]
        return JsonResponse({'message': 'OK', 'data': response_data}, status=200)

    else:
        logger.warning(f'{request.session.session_key} {request.method} Bad Http method')
        return JsonResponse({'message': 'Http method not recognised'}, status=400)


def AnalyticsView(request):
    if not ip_monitor.add_request(request):
        return throttle_response()
    request = check_session(request)
    data = get_data(request)

    if request.method != 'POST':
        logger.warning(f'{request.session.session_key} {request.method} Bad Http method')
        return JsonResponse({'message': 'Http method not recognised'}, status=400)
    
    # append all new analytics
    session = request.session.session_key
    user_id = data.get('user')
    analytics = data.get('data')

    # if just one, clean_dict will extract from list. Force back into list
    if type(analytics) == dict:
        analytics = [analytics]
    logger.info(f'{request.session.session_key} {request.method} Processing {len(analytics)} analytics')

    if user_id:
        try:
            user = User.objects.get(id=user_id)
        except:
            logger.warning(f'{request.session.session_key} {request.method} Invalid user: {user_id}')
            return JsonResponse({'message': 'Invalid user'}, status=400)
    else:
        user = None

    for analytic in analytics:
        dt = datetime.strptime(analytic['datetime'], '%Y-%m-%d %H:%M:%S').replace(tzinfo=pytz.UTC)
        try:
            Analytic.objects.create(
                user=user, 
                session_id=session, 
                datetime=dt, 
                action=analytic['action']
            )
        except Exception as e:
            logger.warning(f'{request.session.session_key} {request.method} Bad analytic: {str(analytic)} - {str(e)}')

    return JsonResponse({'message': 'OK'}, status=200)



# testing for throttling
# @cache_page(60 * 5)  # lol, using the test view to test that caching actually works!
def TestView(request):
    if not ip_monitor.add_request(request):
        return JsonResponse({'message': 'This IP address has been banned. Contact support to get unbanned.'}, status=403)
    return JsonResponse({'datetime': datetime.now()})


# this is just the react app right - inside there it still makes the API calls, so I could/should cache this for a long time?!
@cache_page(60 * 60 * 24)
def FrontendView(request):
    return render(request, 'quotes/react-build/index.html')
