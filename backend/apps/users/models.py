import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address.')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_email_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    AUTH_PROVIDER_EMAIL = 'email'
    AUTH_PROVIDER_GOOGLE = 'google'

    AUTH_PROVIDER_CHOICES = (
        (AUTH_PROVIDER_EMAIL, 'Email'),
        (AUTH_PROVIDER_GOOGLE, 'Google'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    avatar_url = models.URLField(blank=True)
    auth_provider = models.CharField(
        max_length=20,
        choices=AUTH_PROVIDER_CHOICES,
        default=AUTH_PROVIDER_EMAIL,
    )
    is_email_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    google_id = models.CharField(max_length=255, blank=True, db_index=True)
    otp = models.CharField(max_length=128, blank=True)
    otp_expires_at = models.DateTimeField(blank=True, null=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return self.email


class ApiKey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'CustomUser',
        on_delete=models.CASCADE,
        related_name='api_keys',
    )
    name = models.CharField(max_length=100, help_text='Friendly label, e.g. "My MCP Key"')
    key_hash = models.CharField(max_length=64, unique=True, db_index=True)
    prefix = models.CharField(max_length=8, help_text='First 8 chars of the key for identification')
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.prefix}...)"

    @classmethod
    def generate_key(cls, user, name: str) -> tuple['ApiKey', str]:
        import hashlib
        import secrets

        # Format: save_live_<32 hex chars> (total 42 chars)
        raw_token = f"save_live_{secrets.token_hex(16)}"
        key_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
        prefix = raw_token[:8]

        api_key = cls.objects.create(
            user=user,
            name=name,
            key_hash=key_hash,
            prefix=prefix,
        )
        return api_key, raw_token

    @classmethod
    def verify_key(cls, raw_token: str):
        import hashlib
        from django.utils import timezone

        if not raw_token or not raw_token.startswith('save_'):
            return None

        key_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
        try:
            api_key = cls.objects.select_related('user').get(key_hash=key_hash, is_active=True)
            # Update last_used_at
            api_key.last_used_at = timezone.now()
            api_key.save(update_fields=['last_used_at'])
            return api_key.user
        except cls.DoesNotExist:
            return None

