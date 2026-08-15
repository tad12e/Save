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

    PLATFORM_WEB = 'web'
    PLATFORM_X_TWITTER = 'x_twitter'
    PLATFORM_LINKEDIN = 'linkedin'
    PLATFORM_REDDIT = 'reddit'
    PLATFORM_YOUTUBE = 'youtube'
    PLATFORM_GITHUB = 'github'
    PLATFORM_INSTAGRAM = 'instagram'
    PLATFORM_TIKTOK = 'tiktok'

    PLATFORM_CHOICES = (
        (PLATFORM_WEB, 'Web'),
        (PLATFORM_X_TWITTER, 'X / Twitter'),
        (PLATFORM_LINKEDIN, 'LinkedIn'),
        (PLATFORM_REDDIT, 'Reddit'),
        (PLATFORM_YOUTUBE, 'YouTube'),
        (PLATFORM_GITHUB, 'GitHub'),
        (PLATFORM_INSTAGRAM, 'Instagram'),
        (PLATFORM_TIKTOK, 'TikTok'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='clips',
    )
    parent_clip = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='child_clips',
    )
    url = models.URLField(max_length=2048)
    url_hash = models.CharField(max_length=64, db_index=True)
    selected_text = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )

    # --- Source Platform Origin Attribution ---
    source_platform = models.CharField(
        max_length=50,
        choices=PLATFORM_CHOICES,
        default=PLATFORM_WEB,
        db_index=True,
    )
    source_author = models.CharField(max_length=255, blank=True)
    source_post_url = models.URLField(max_length=2048, blank=True)

    # --- Linked Resource Hub Fields ---
    is_resource_hub = models.BooleanField(default=False)
    extracted_resource_url = models.URLField(max_length=2048, blank=True)

    # --- Filled later by the Celery background task ---
    title = models.CharField(max_length=512, blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    content_type = models.CharField(max_length=100, blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    embedding = models.JSONField(default=list, blank=True, null=True)

    # --- AI-extracted metadata ---
    deadline_date = models.DateField(null=True, blank=True)
    music_embed_url = models.URLField(max_length=2048, blank=True)
    reminder_sent = models.BooleanField(default=False)
    extra_metadata = models.JSONField(default=dict, blank=True)

    destination = models.ForeignKey(
        'destinations.Destination',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clips',
    )
    export_status = models.CharField(
        max_length=20,
        choices=(
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('done', 'Done'),
            ('failed', 'Failed'),
            ('skipped', 'Skipped'),
        ),
        default='pending',
    )
    export_url = models.URLField(max_length=2048, blank=True)
    export_error = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.url} ({self.status})'
