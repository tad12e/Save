"""
JWT Cookie, Header, and API Key Authentication.
Supports:
1. Authorization: Api-Key <token> or X-API-Key: <token> (Save MCP Server / API Clients)
2. Authorization: Bearer <token> (Used by Chrome extension / API clients)
3. HttpOnly access_token cookie (Used by Web App to prevent XSS token theft)
"""

import logging
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed as JWTAuthenticationFailed

from .models import ApiKey

logger = logging.getLogger(__name__)


class ApiKeyAuthentication(authentication.BaseAuthentication):
    """
    Authenticates requests using Save API Keys.
    Supports headers:
      - Authorization: Api-Key save_live_...
      - Authorization: Bearer save_live_...
      - X-API-Key: save_live_...
    """

    def authenticate(self, request):
        raw_key = None

        # Check X-API-Key header
        x_api_key = request.headers.get('X-API-Key')
        if x_api_key:
            raw_key = x_api_key.strip()

        # Check Authorization header if not found in X-API-Key
        if not raw_key:
            auth_header = request.headers.get('Authorization')
            if auth_header:
                parts = auth_header.split()
                if len(parts) == 2:
                    scheme, token = parts[0].lower(), parts[1]
                    if scheme in ('api-key', 'apikey') or (scheme == 'bearer' and token.startswith('save_')):
                        raw_key = token

        if not raw_key:
            return None  # Let other auth classes handle this request

        if not raw_key.startswith('save_'):
            return None

        user = ApiKey.verify_key(raw_key)
        if not user:
            raise AuthenticationFailed('Invalid or inactive API key.')

        if not user.is_active:
            raise AuthenticationFailed('User account associated with this API key is inactive.')

        return (user, None)

    def authenticate_header(self, request):
        return 'Api-Key realm="api"'



class JWTCookieAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication class that checks both the Authorization header
    and the HttpOnly 'access_token' cookie.
    """

    def authenticate(self, request):
        # 1. Check standard Authorization header first (Bearer <token>)
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
            if raw_token is not None:
                # If it's an API key, let ApiKeyAuthentication handle it
                if str(raw_token).startswith("b'save_") or (isinstance(raw_token, str) and raw_token.startswith('save_')):
                    return None
                try:
                    validated_token = self.get_validated_token(raw_token)
                    return self.get_user(validated_token), validated_token
                except (InvalidToken, JWTAuthenticationFailed):
                    return None

        # 2. Fallback to HttpOnly cookie if header is not present
        raw_token = request.COOKIES.get('access_token')
        if raw_token:
            try:
                validated_token = self.get_validated_token(raw_token)
                return self.get_user(validated_token), validated_token
            except (InvalidToken, JWTAuthenticationFailed):
                return None

        return None
