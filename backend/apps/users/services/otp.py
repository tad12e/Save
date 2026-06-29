import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils import timezone

OTP_LENGTH = 6
OTP_COOLDOWN_SECONDS = 60  # minimum seconds between OTP sends per user


def _otp_expiry_minutes():
    return getattr(settings, 'OTP_EXPIRY_MINUTES', 10)


def hash_otp(raw_otp: str) -> str:
    """One-way SHA-256 hash of the raw OTP string."""
    return hashlib.sha256(raw_otp.encode('utf-8')).hexdigest()


def verify_otp(raw_otp: str, hashed_otp: str) -> bool:
    """Compare a raw OTP against a stored hash using constant-time comparison."""
    return secrets.compare_digest(hash_otp(raw_otp), hashed_otp)


def generate_otp():
    return ''.join(secrets.choice('0123456789') for _ in range(OTP_LENGTH))


def assign_otp(user):
    """Generate an OTP, store its SHA-256 hash on the user, return the raw OTP."""
    raw_otp = generate_otp()
    user.otp = hash_otp(raw_otp)
    user.otp_expires_at = timezone.now() + timedelta(minutes=_otp_expiry_minutes())
    user.save(update_fields=['otp', 'otp_expires_at'])
    return raw_otp


def _rate_limit_cache_key(user) -> str:
    return f'otp_cooldown:{user.pk}'


def check_otp_rate_limit(user):
    """
    Raise ValueError if user is sending OTPs too frequently.
    Returns remaining cooldown seconds or 0 if allowed.
    """
    key = _rate_limit_cache_key(user)
    last_sent = cache.get(key)
    if last_sent is not None:
        remaining = OTP_COOLDOWN_SECONDS - (timezone.now() - last_sent).total_seconds()
        if remaining > 0:
            raise ValueError(
                f'Please wait {int(remaining)} seconds before requesting a new OTP.'
            )


def _record_otp_sent(user):
    """Mark that an OTP was just sent for this user."""
    cache.set(
        _rate_limit_cache_key(user),
        timezone.now(),
        timeout=OTP_COOLDOWN_SECONDS,
    )


def send_otp_email(user, raw_otp: str):
    """Send the raw OTP via email. The raw value never touches the DB."""
    expiry_minutes = _otp_expiry_minutes()
    send_mail(
        subject='Verify your Save account',
        message=(
            f'Hi {user.name},\n\n'
            f'Your verification code is: {raw_otp}\n\n'
            f'This code expires in {expiry_minutes} minutes.\n'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def clear_otp(user):
    """Wipe the OTP hash and expiry from the user record."""
    user.otp = ''
    user.otp_expires_at = None
    user.save(update_fields=['otp', 'otp_expires_at'])


def issue_and_send_otp(user):
    """Full flow: rate-limit check → generate → hash & store → email raw OTP."""
    check_otp_rate_limit(user)
    raw_otp = assign_otp(user)       # stores HASH on user, returns raw
    send_otp_email(user, raw_otp)    # emails the raw OTP
    _record_otp_sent(user)           # start cooldown timer
