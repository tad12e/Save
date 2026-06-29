import uuid

from django.conf import settings
from django.db import models


class Clip(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_PROCESSING = 'processing'
    STATUS_DONE = 'done'
    STATUS_FAILED = 'failed'

    STATUS_CHOICES = (
        (STATUS_PENDING, 'Pending'),
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_DONE, 'Done'),
        (STATUS_FAILED, 'Failed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='clips',
    )
    url = models.URLField(max_length=2048)
    url_hash = models.CharField(max_length=64, db_index=True)
    selected_text = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )

    # --- Filled later by the Celery background task ---
    title = models.CharField(max_length=512, blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    content_type = models.CharField(max_length=100, blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'url_hash')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.url} ({self.status})'
