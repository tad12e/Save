from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import serializers

from .models import CustomUser, UserSettings
from .services.google_auth import GoogleTokenVerificationError, verify_google_access_token
from .services.otp import (
    check_otp_verification_attempts,
    clear_otp,
    clear_otp_verification_attempts,
    issue_and_send_otp,
    record_otp_verification_failure,
    verify_otp,
)


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


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('name', 'avatar_url')
        extra_kwargs = {
            'name': {'required': False, 'allow_blank': False},
            'avatar_url': {'required': False, 'allow_blank': True},
        }


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
            check_otp_verification_attempts(email)
        except ValueError as err:
            raise serializers.ValidationError(str(err))

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
            remaining = record_otp_verification_failure(email)
            if remaining > 0:
                raise serializers.ValidationError(
                    f'Invalid email or OTP. {remaining} attempt{"s" if remaining != 1 else ""} remaining.'
                )
            raise serializers.ValidationError(
                'Too many failed verification attempts. Verification is locked for 15 minutes.'
            )

        if not user.otp_expires_at or timezone.now() > user.otp_expires_at:
            raise serializers.ValidationError('OTP has expired. Please request a new one.')

        clear_otp_verification_attempts(email)
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


class UserSettingsSerializer(serializers.ModelSerializer):
    enable_share_sheet = serializers.BooleanField(required=False)
    enable_quick_settings_tile = serializers.BooleanField(required=False)
    enable_floating_bubble = serializers.BooleanField(required=False)
    default_destination = serializers.CharField(required=False, allow_blank=True)
    category_rules = serializers.DictField(required=False)

    class Meta:
        model = UserSettings
        fields = (
            'id',
            'confirmation_mode',
            'music_provider',
            'music_target_playlist_id',
            'music_auto_add',
            'spotify_client_id',
            'spotify_client_secret',
            'privacy_mode',
            'ai_extraction_prompt',
            'theme',
            'extra_preferences',
            'enable_share_sheet',
            'enable_quick_settings_tile',
            'enable_floating_bubble',
            'default_destination',
            'category_rules',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {
            'spotify_client_secret': {'write_only': True},
        }

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        extra = instance.extra_preferences or {}
        ret['enable_share_sheet'] = extra.get('enable_share_sheet', True)
        ret['enable_quick_settings_tile'] = extra.get('enable_quick_settings_tile', False)
        ret['enable_floating_bubble'] = extra.get('enable_floating_bubble', False)
        ret['default_destination'] = extra.get('default_destination', 'vault')
        ret['category_rules'] = extra.get('category_rules', {})
        ret['has_spotify_secret'] = bool(instance.spotify_client_secret)
        return ret

    def update(self, instance, validated_data):
        extra = dict(instance.extra_preferences or {})
        for key in [
            'enable_share_sheet',
            'enable_quick_settings_tile',
            'enable_floating_bubble',
            'default_destination',
            'category_rules',
        ]:
            if key in validated_data:
                extra[key] = validated_data.pop(key)
        validated_data['extra_preferences'] = extra
        return super().update(instance, validated_data)

