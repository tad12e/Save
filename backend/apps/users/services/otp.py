import hashlib
import json
import logging
import secrets
import urllib.error
import urllib.request
from datetime import timedelta
from email.utils import parseaddr
from smtplib import SMTPAuthenticationError, SMTPException

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils import timezone

OTP_LENGTH = 6
OTP_COOLDOWN_SECONDS = 60  # minimum seconds between OTP sends per user
MAX_OTP_ATTEMPTS = 7  # maximum allowed failed verification attempts
OTP_LOCKOUT_TIMEOUT_SECONDS = 900  # 15 minutes lockout window
BREVO_SEND_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email'

logger = logging.getLogger(__name__)


class OTPEmailDeliveryError(Exception):
    """Raised when the verification email cannot be delivered."""


def _otp_attempt_cache_key(email: str) -> str:
    return f"otp_fail_count:{email.strip().lower()}"


def check_otp_verification_attempts(email: str):
    """Raise ValueError if max verification attempts have been reached."""
    key = _otp_attempt_cache_key(email)
    fails = cache.get(key, 0)
    if fails >= MAX_OTP_ATTEMPTS:
        raise ValueError(
            'Too many failed verification attempts. Verification is locked for 15 minutes.'
        )


def record_otp_verification_failure(email: str) -> int:
    """Increment failed attempts count in cache and return remaining attempts."""
    key = _otp_attempt_cache_key(email)
    current = cache.get(key, 0) + 1
    cache.set(key, current, timeout=OTP_LOCKOUT_TIMEOUT_SECONDS)
    remaining = max(0, MAX_OTP_ATTEMPTS - current)
    return remaining


def clear_otp_verification_attempts(email: str):
    """Reset the failure attempt counter for an email."""
    key = _otp_attempt_cache_key(email)
    cache.delete(key)


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
    subject = 'Verify your Save account'
    message = (
        f'Hi {user.name},\n\n'
        f'Your verification code is: {raw_otp}\n\n'
        f'This code expires in {expiry_minutes} minutes.\n'
    )
    brevo_api_key = getattr(settings, 'BREVO_API_KEY', '')

    if brevo_api_key:
        _, sender_email = parseaddr(settings.DEFAULT_FROM_EMAIL)
        payload = json.dumps(
            {
                'sender': {'name': 'Save', 'email': sender_email},
                'to': [{'email': user.email, 'name': user.name}],
                'subject': subject,
                'textContent': message,
            }
        ).encode('utf-8')
        request = urllib.request.Request(
            BREVO_SEND_EMAIL_URL,
            data=payload,
            headers={
                'accept': 'application/json',
                'api-key': brevo_api_key,
                'content-type': 'application/json',
            },
            method='POST',
        )

        try:
            with urllib.request.urlopen(request, timeout=15):
                return
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode('utf-8', errors='ignore').strip()
            if error_body:
                raise OTPEmailDeliveryError(f'Brevo rejected the request: {error_body}') from exc
            raise OTPEmailDeliveryError(f'Brevo rejected the request with HTTP {exc.code}.') from exc
        except urllib.error.URLError as exc:
            raise OTPEmailDeliveryError('Unable to connect to the email service.') from exc

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except SMTPAuthenticationError as exc:
        raise OTPEmailDeliveryError(
            'The SMTP provider rejected this server. For Brevo, authorize this IP address '
            'or configure BREVO_API_KEY and use the Brevo API instead.'
        ) from exc
    except (OSError, SMTPException) as exc:
        raise OTPEmailDeliveryError('Unable to connect to the email service.') from exc


def clear_otp(user):
    """Wipe the OTP hash and expiry from the user record."""
    user.otp = ''
    user.otp_expires_at = None
    user.save(update_fields=['otp', 'otp_expires_at'])
    if getattr(user, 'email', None):
        clear_otp_verification_attempts(user.email)


def issue_and_send_otp(user, async_delivery: bool = True):
    """Full flow: rate-limit check → generate → hash & store → dispatch raw OTP via Celery."""
    check_otp_rate_limit(user)
    raw_otp = assign_otp(user)       # stores HASH on user, returns raw

    dispatched = False
    if async_delivery:
        try:
            from apps.users.tasks import send_otp_email_task
            send_otp_email_task.delay(str(user.id), raw_otp)
            dispatched = True
        except Exception as exc:
            logger.warning(
                "Celery dispatch failed for OTP email to user %s (%s): %s. Falling back to direct delivery.",
                user.id,
                user.email,
                exc,
            )

    if not dispatched:
        send_otp_email(user, raw_otp)

    _record_otp_sent(user)           # start cooldown timer
    if getattr(user, 'email', None):
        clear_otp_verification_attempts(user.email)
