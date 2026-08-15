import uuid
from django.conf import settings
from django.db import models


class Destination(models.Model):
    PROVIDER_NOTION = 'notion'
    PROVIDER_GOOGLE_SHEETS = 'google_sheets'
    PROVIDER_AIRTABLE = 'airtable'
    PROVIDER_WEBHOOK = 'webhook'
    PROVIDER_CUSTOM_DB = 'custom_db'
    PROVIDER_SPOTIFY = 'spotify'
    PROVIDER_YOUTUBE_MUSIC = 'youtube_music'

    PROVIDER_CHOICES = (
        (PROVIDER_NOTION, 'Notion'),
        (PROVIDER_GOOGLE_SHEETS, 'Google Sheets'),
        (PROVIDER_AIRTABLE, 'Airtable'),
        (PROVIDER_WEBHOOK, 'Webhook'),
        (PROVIDER_CUSTOM_DB, 'Custom Database'),
        (PROVIDER_SPOTIFY, 'Spotify'),
        (PROVIDER_YOUTUBE_MUSIC, 'YouTube Music'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='destinations',
        null=True,
        blank=True
    )
    provider = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    config = models.JSONField(default=dict, blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', 'name']

    def __str__(self):
        return f'{self.name} ({self.provider})'

    def save(self, *args, **kwargs):
        if self.is_default:
            if self.user:
                Destination.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(
                    is_default=False,
                )
            else:
                Destination.objects.filter(user__isnull=True, is_default=True).exclude(pk=self.pk).update(
                    is_default=False,
                )
        super().save(*args, **kwargs)
