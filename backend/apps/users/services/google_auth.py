import json
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings

GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo'
GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'


class GoogleTokenVerificationError(Exception):
    pass


def verify_google_access_token(access_token):
    query = urllib.parse.urlencode({'access_token': access_token})
    url = f'{GOOGLE_TOKENINFO_URL}?{query}'

    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            token_data = json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        raise GoogleTokenVerificationError('Invalid or expired Google access token.') from exc
    except urllib.error.URLError as exc:
        raise GoogleTokenVerificationError('Unable to verify Google access token.') from exc

    if token_data.get('error'):
        raise GoogleTokenVerificationError('Invalid or expired Google access token.')

    client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
    if client_id and token_data.get('aud') != client_id:
        raise GoogleTokenVerificationError('Google access token audience mismatch.')

    if token_data.get('email_verified') not in (True, 'true'):
        raise GoogleTokenVerificationError('Google account email is not verified.')

    email = token_data.get('email')
    if not email:
        raise GoogleTokenVerificationError('Google account does not provide an email address.')

    profile = {
        'email': email,
        'google_id': token_data.get('sub', ''),
        'name': '',
        'picture': '',
    }

    try:
        request = urllib.request.Request(
            GOOGLE_USERINFO_URL,
            headers={'Authorization': f'Bearer {access_token}'},
        )
        with urllib.request.urlopen(request, timeout=10) as response:
            userinfo = json.loads(response.read().decode())
        profile['name'] = userinfo.get('name', '')
        profile['picture'] = userinfo.get('picture', '')
    except (urllib.error.HTTPError, urllib.error.URLError):
        pass

    return profile
