import uuid
from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPE_ALERT = 'alert'
    TYPE_INFO = 'info'
    TYPE_WARNING = 'warning'
    TYPE_SUCCESS = 'success'

    TYPE_CHOICES = (
        (TYPE_ALERT, 'Alert'),
        (TYPE_INFO, 'Info'),
        (TYPE_WARNING, 'Warning'),
        (TYPE_SUCCESS, 'Success'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default=TYPE_INFO,
    )
    action_url = models.CharField(max_length=512, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type.upper()}] {self.title} ({self.user})"
