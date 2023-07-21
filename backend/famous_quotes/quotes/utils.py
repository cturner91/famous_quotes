import json
import random
import logging

import pdb

logger = logging.getLogger('fq')


def check_session(request):
    if not request.session.session_key:
        request.session.create()
        request.session.set_expiry(60*60*24)  # 1 day?
        data = {
            'session_id': request.session.session_key,
            'user_agent': request.META.get('HTTP_USER_AGENT'),

            # https://stackoverflow.com/questions/4581789/how-do-i-get-user-ip-address-in-django
            'IP address': request.META.get('HTTP_X_FORWARDED_FOR').split(',')[0] if request.META.get('HTTP_X_FORWARDED_FOR') else request.META.get('REMOTE_ADDR')
        }
        logger.info(f'NEW SESSION - {json.dumps(data)}')
    return request


def get_data(request):
    # create a common interface to extract the request data
    DEFAULT_RESPONSE = {}

    if request.method == 'GET':
        if request.GET:
            return clean_dict(dict(request.GET))
        else:
            return DEFAULT_RESPONSE

    elif request.method == 'POST':
        if request.POST:
            return clean_dict(dict(request.POST))
        else:
            return clean_dict(json.loads(request.body.decode('utf-8')))
    
    elif request.method == 'PUT' or request.method == 'DELETE':
        return clean_dict(json.loads(request.body.decode('utf-8')))
    
    return DEFAULT_RESPONSE


def clean_dict(d):
    for key in d.keys():
        if type(d[key]) == list:
            if len(d[key]) == 1:
                d[key] = d[key][0]
    return d

def generate_random_code(length=32, uppers=True, lowers=True, digits=True, symbols=True):

    if not uppers and not lowers and not digits and not symbols:
        return None

    charlist = ''
    if uppers:
        charlist += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if lowers:
        charlist += 'abcdefghijklmnopqrstuvwxyz'
    if digits:
        charlist += '0123456789'
    if symbols:
        # charlist += '!@£$%^&*()_+{}:"|~<>?-=[];\'\,./`'  # must be url-safe
        charlist += '!@€#£$^*()_~-,.'  # must be url-safe
    
    code = ''
    for _ in range(length):
        code += charlist[int(random.random()*len(charlist))]
    return code
