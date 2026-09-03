"""
JWT Cookie & Header Authentication.
Supports both:
1. Authorization: Bearer <token> (Used by Chrome extension background script / API clients)
2. HttpOnly access_token cookie (Used by Next.js Web App to prevent XSS token theft)
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed


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
                validated_token = self.get_validated_token(raw_token)
                return self.get_user(validated_token), validated_token

        # 2. Fallback to HttpOnly cookie if header is not present
        raw_token = request.COOKIES.get('access_token')
        if raw_token:
            try:
                validated_token = self.get_validated_token(raw_token)
                return self.get_user(validated_token), validated_token
            except (InvalidToken, AuthenticationFailed):
                return None

        return None
