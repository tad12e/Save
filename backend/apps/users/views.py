from django.conf import settings
import logging
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserSettings
from .serializers import (
    GoogleAuthSerializer,
    ResendOTPSerializer,
    SigninSerializer,
    SignupSerializer,
    UserProfileUpdateSerializer,
    UserSerializer,
    UserSettingsSerializer,
    VerifyOTPSerializer,
)
from .services.otp import OTPEmailDeliveryError
from .tokens import get_tokens_for_user

logger = logging.getLogger(__name__)


def set_auth_cookies(response: Response, access_token: str, refresh_token: str | None = None) -> Response:
    """Sets HttpOnly, Secure, SameSite cookies to protect tokens against XSS."""
    is_secure = not getattr(settings, 'DEBUG', True)

    response.set_cookie(
        key='access_token',
        value=access_token,
        max_age=90 * 24 * 60 * 60,
        httponly=True,
        secure=is_secure,
        samesite='Lax',
        path='/',
    )
    if refresh_token:
        response.set_cookie(
            key='refresh_token',
            value=refresh_token,
            max_age=365 * 24 * 60 * 60,
            httponly=True,
            secure=is_secure,
            samesite='Lax',
            path='/',
        )
    return response


def clear_auth_cookies(response: Response) -> Response:
    """Clears authentication cookies upon signout."""
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/')
    return response


def auth_response(user, response_status=status.HTTP_200_OK) -> Response:
    """Returns user profile and tokens in JSON while also setting HttpOnly cookies."""
    tokens = get_tokens_for_user(user)
    access_token = tokens.get('access') or tokens.get('access_token')
    refresh_token = tokens.get('refresh') or tokens.get('refresh_token')

    response = Response(
        {
            **tokens,
            'access': access_token,
            'refresh': refresh_token,
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': UserSerializer(user).data,
        },
        status=response_status,
    )
    return set_auth_cookies(response, access_token, refresh_token)


class SignupView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = serializer.save()
        except OTPEmailDeliveryError as exc:
            return Response(
                {
                    'message': str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if getattr(serializer, 'is_resuming_signup', False):
            message = (
                'An unverified account already exists for this email. '
                'Your details have been updated and a new verification code has been sent.'
            )
            status_code = status.HTTP_200_OK
        else:
            message = 'Account created. Please verify your email with the OTP sent to your inbox.'
            status_code = status.HTTP_201_CREATED

        return Response(
            {
                'message': message,
                'email': user.email,
                'pending_verification': True,
                'verification_resent': getattr(serializer, 'is_resuming_signup', False),
            },
            status=status_code,
        )


class VerifyOTPView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return auth_response(user)


class ResendOTPView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        try:
            user = serializer.save()
        except OTPEmailDeliveryError as exc:
            return Response(
                {
                    'message': str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {
                'message': 'A new OTP has been sent to your email.',
                'email': user.email,
            },
            status=status.HTTP_200_OK,
        )


class SigninView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SigninSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        return auth_response(serializer.validated_data['user'])


class GoogleAuthView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return auth_response(user)


class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)

    def put(self, request):
        return self.patch(request)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh_token') or request.COOKIES.get('refresh_token')
        revoked = False
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
                revoked = True
            except Exception as exc:
                logger.warning("Logout blacklist failed: %s", exc)

        response = Response({'message': 'Logged out successfully.', 'revoked': revoked}, status=status.HTTP_200_OK)
        return clear_auth_cookies(response)


class UserSettingsView(APIView):
    """
    GET: Retrieves the current user's settings (or global/guest settings if unauthenticated).
    PATCH/PUT: Updates user settings and returns the updated state.
    """
    permission_classes = [AllowAny]

    def _get_or_create_settings(self, request):
        user = request.user if (request.user and request.user.is_authenticated) else None
        if user:
            settings_obj, _ = UserSettings.objects.get_or_create(user=user)
        else:
            settings_obj = UserSettings.objects.filter(user__isnull=True).first()
            if not settings_obj:
                settings_obj = UserSettings.objects.create(user=None)
        return settings_obj

    def get(self, request):
        settings_obj = self._get_or_create_settings(request)
        serializer = UserSettingsSerializer(settings_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        settings_obj = self._get_or_create_settings(request)
        serializer = UserSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        return self.patch(request)
