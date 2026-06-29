from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    GoogleAuthSerializer,
    ResendOTPSerializer,
    SigninSerializer,
    SignupSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)
from .tokens import get_tokens_for_user


def auth_response(user, response_status=status.HTTP_200_OK):
    return Response(
        {
            **get_tokens_for_user(user),
            'user': UserSerializer(user).data,
        },
        status=response_status,
    )


class SignupView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

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
        user = serializer.save()
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
