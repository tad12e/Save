"""
Background Celery tasks for user authentication and notifications.
"""

import logging
from celery import shared_task
from django.contrib.auth import get_user_model

from apps.users.services.otp import send_otp_email

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=5,
    acks_late=True,
)
def send_otp_email_task(self, user_id: str, raw_otp: str):
    """
    Asynchronously delivers the verification OTP email via Celery.
    Retries up to 3 times with exponential backoff on transient SMTP or Brevo network failures.
    """
    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        logger.error("send_otp_email_task: User %s does not exist, dropping OTP delivery.", user_id)
        return

    try:
        send_otp_email(user, raw_otp)
        logger.info("Successfully sent OTP email to user %s (%s)", user.id, user.email)
    except Exception as exc:
        retries = self.request.retries
        logger.warning(
            "send_otp_email_task failed for user %s (%s) (attempt %d/%d): %s",
            user.id,
            user.email,
            retries + 1,
            self.max_retries,
            exc,
        )
        raise self.retry(exc=exc, countdown=5 * (2 ** retries))
