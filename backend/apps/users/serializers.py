from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import serializers

from .models import CustomUser
from .services.google_auth import GoogleTokenVerificationError, verify_google_access_token
from .services.otp import clear_otp, issue_and_send_otp, verify_otp


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = (
            'id',
            'email',
            'name',
            'avatar_url',
            'auth_provider',
            'is_email_verified',
            'created_at',
            'last_login',
        )
        read_only_fields = fields


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = ('email', 'name', 'password', 'confirm_password')

    def validate_email(self, value):
        normalized_email = CustomUser.objects.normalize_email(value)
        existing_user = CustomUser.objects.filter(email=normalized_email).first()
        if existing_user and existing_user.is_email_verified:
            raise serializers.ValidationError('An account with this email already exists.')
        return normalized_email

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        email = validated_data['email']

        existing_user = CustomUser.objects.filter(email=email).first()
        if existing_user and not existing_user.is_email_verified:
            existing_user.name = validated_data['name']
            existing_user.set_password(validated_data['password'])
            existing_user.save(update_fields=['name', 'password'])
            user = existing_user
            self.is_resuming_signup = True
        else:
            user = CustomUser.objects.create_user(
                auth_provider=CustomUser.AUTH_PROVIDER_EMAIL,
                is_email_verified=False,
                **validated_data,
            )
            self.is_resuming_signup = False

        try:
            issue_and_send_otp(user)
        except ValueError as exc:
            raise serializers.ValidationError({'rate_limit': str(exc)}) from exc
        return user


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate(self, attrs):
        email = CustomUser.objects.normalize_email(attrs['email'])

        try:
            user = CustomUser.objects.get(
                email=email,
                auth_provider=CustomUser.AUTH_PROVIDER_EMAIL,
            )
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('Invalid email or OTP.')

        if user.is_email_verified:
            raise serializers.ValidationError('This email is already verified.')

        if not user.otp or not verify_otp(attrs['otp'], user.otp):
            raise serializers.ValidationError('Invalid email or OTP.')

        if not user.otp_expires_at or timezone.now() > user.otp_expires_at:
            raise serializers.ValidationError('OTP has expired. Please request a new one.')

        attrs['user'] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data['user']
        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])
        clear_otp(user)
        return user


class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        email = CustomUser.objects.normalize_email(value)

        try:
            user = CustomUser.objects.get(
                email=email,
                auth_provider=CustomUser.AUTH_PROVIDER_EMAIL,
            )
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('No pending account found for this email.')

        if user.is_email_verified:
            raise serializers.ValidationError('This email is already verified.')

        self.context['user'] = user
        return email

    def save(self, **kwargs):
        user = self.context['user']
        try:
            issue_and_send_otp(user)
        except ValueError as exc:
            raise serializers.ValidationError({'rate_limit': str(exc)}) from exc
        return user


class SigninSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = CustomUser.objects.normalize_email(attrs['email'])

        try:
            existing_user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            existing_user = None

        if existing_user and existing_user.auth_provider == CustomUser.AUTH_PROVIDER_GOOGLE:
            raise serializers.ValidationError(
                'This account uses Google sign-in. Please continue with Google.'
            )

        if existing_user and not existing_user.is_email_verified:
            raise serializers.ValidationError(
                'Please verify your email before signing in. '
                'Sign up again with the same email to receive a new code, or use resend-otp.'
            )

        user = authenticate(
            request=self.context.get('request'),
            username=email,
            password=attrs['password'],
        )

        if user is None:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('This account is inactive.')

        attrs['user'] = user
        return attrs


class GoogleAuthSerializer(serializers.Serializer):
    google_access_token = serializers.CharField(write_only=True, required=False)
    token = serializers.CharField(write_only=True, required=False)
    id_token = serializers.CharField(write_only=True, required=False)
    name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    avatar_url = serializers.URLField(required=False, allow_blank=True)

    def validate(self, attrs):
        access_token = (
            attrs.get('google_access_token')
            or attrs.get('token')
            or attrs.get('id_token')
        )
        if not access_token:
            raise serializers.ValidationError({'google_access_token': 'Token is required.'})

        try:
            google_profile = verify_google_access_token(access_token)
        except GoogleTokenVerificationError as exc:
            raise serializers.ValidationError({'google_access_token': str(exc)}) from exc

        existing_user = CustomUser.objects.filter(email=google_profile['email']).first()

        attrs['google_profile'] = google_profile
        return attrs

    def create(self, validated_data):
        google_profile = validated_data['google_profile']
        email = google_profile['email']

        user = CustomUser.objects.filter(email=email).first()

        if user is None:
            user = CustomUser(
                email=email,
                name=google_profile.get('name') or validated_data.get('name', ''),
                avatar_url=google_profile.get('picture') or validated_data.get('avatar_url', ''),
                auth_provider=CustomUser.AUTH_PROVIDER_GOOGLE,
                is_email_verified=True,
                google_id=google_profile.get('google_id', ''),
            )
            user.set_unusable_password()
        else:
            if google_profile.get('name'):
                user.name = google_profile['name']
            elif validated_data.get('name'):
                user.name = validated_data['name']

            if google_profile.get('picture'):
                user.avatar_url = google_profile['picture']
            elif validated_data.get('avatar_url'):
                user.avatar_url = validated_data['avatar_url']

            if google_profile.get('google_id'):
                user.google_id = google_profile['google_id']

        user.is_email_verified = True

        user.save()
        return user
