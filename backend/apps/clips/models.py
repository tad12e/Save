import uuid

from django.conf import settings
from django.db import models

try:
    from pgvector.django import VectorField, HnswIndex
    PGVECTOR_SUPPORT = True
except ImportError:
    PGVECTOR_SUPPORT = False


class CustomPage(models.Model):
    """
    Custom user workspaces / categories with personalized identity, theme,
    content-type mappings, and specialized AI Goal extraction prompts.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='custom_pages',
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    icon_name = models.CharField(max_length=64, default='Bookmark')
    color = models.CharField(max_length=32, default='#8B5CF6')
    bg_color = models.CharField(max_length=64, default='rgba(139, 92, 246, 0.15)')
    description = models.TextField(blank=True, default='')
    content_types = models.JSONField(default=list, blank=True)
    ai_goal_prompt = models.TextField(blank=True, default='')
    is_system_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'slug')

    def __str__(self):
        return f"{self.name} ({self.user})"


class CustomCategory(models.Model):
    """
    User-defined category within a grouping dimension (e.g. custom Intent like 'Build',
    custom Content Type like 'Podcast', custom Source, or general custom tag).
    """
    DIMENSION_INTENT = 'intent'
    DIMENSION_SOURCE = 'source'
    DIMENSION_TYPE = 'type'
    DIMENSION_CUSTOM = 'custom'

    DIMENSION_CHOICES = (
        (DIMENSION_INTENT, 'Intent'),
        (DIMENSION_SOURCE, 'Source Platform'),
        (DIMENSION_TYPE, 'Content Type'),
        (DIMENSION_CUSTOM, 'Custom Dimension'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='custom_categories',
    )
    dimension = models.CharField(
        max_length=30,
        choices=DIMENSION_CHOICES,
        default=DIMENSION_INTENT,
        db_index=True,
    )
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    color = models.CharField(max_length=32, default='#3B82F6')
    bg_color = models.CharField(max_length=64, default='rgba(59, 130, 246, 0.15)')
    icon_name = models.CharField(max_length=64, default='Tag')
    description = models.CharField(max_length=255, blank=True, default='')
    keywords = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = ('user', 'dimension', 'slug')

    def __str__(self):
        return f"[{self.dimension}] {self.name} ({self.user})"


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
    PLATFORM_SPOTIFY = 'spotify'

    PLATFORM_CHOICES = (
        (PLATFORM_WEB, 'Web'),
        (PLATFORM_X_TWITTER, 'X / Twitter'),
        (PLATFORM_LINKEDIN, 'LinkedIn'),
        (PLATFORM_REDDIT, 'Reddit'),
        (PLATFORM_YOUTUBE, 'YouTube'),
        (PLATFORM_GITHUB, 'GitHub'),
        (PLATFORM_INSTAGRAM, 'Instagram'),
        (PLATFORM_TIKTOK, 'TikTok'),
        (PLATFORM_SPOTIFY, 'Spotify'),
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
    custom_page = models.ForeignKey(
        CustomPage,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
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
    intent = models.CharField(
        max_length=50,
        default='other',
        db_index=True,
        blank=True,
        help_text="Dynamic 1-word action verb (e.g. 'apply', 'cook', 'listen', 'deploy', 'learn')",
    )
    tags = models.JSONField(default=list, blank=True)
    embedding = VectorField(dimensions=768, null=True, blank=True) if PGVECTOR_SUPPORT else models.JSONField(default=list, blank=True, null=True)

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

    raw_content = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at'], name='clips_clip_user_created_idx'),
            models.Index(fields=['user', 'status', '-created_at'], name='clips_clip_usr_stat_idx'),
            models.Index(fields=['user', 'source_platform', '-created_at'], name='clips_clip_usr_plat_idx'),
            models.Index(fields=['user', 'intent', '-created_at'], name='clips_usr_intent_idx'),
            models.Index(fields=['user', 'url_hash'], name='clips_usr_urlhash_idx'),
        ]
        if PGVECTOR_SUPPORT:
            indexes.append(
                HnswIndex(
                    name='clips_clip_emb_hnsw_idx',
                    fields=['embedding'],
                    m=16,
                    ef_construction=64,
                    opclasses=['vector_cosine_ops'],
                )
            )

    def __str__(self):
        return f'{self.url} ({self.status})'

    # --- Native bookmark skin contract (see apps/clips/platform_meta.py) ---
    # extra_metadata["platform_meta"] = {"v": 1, "skin": "x"|"youtube"|..., ...}
    @property
    def platform_skin(self) -> str:
        from .platform_meta import resolve_skin
        return resolve_skin(self.source_platform, self.url)

    @property
    def platform_meta(self) -> dict:
        from .platform_meta import get_platform_meta
        return get_platform_meta(self.extra_metadata, self.source_platform, self.url)

    def set_platform_meta(self, raw: dict) -> dict:
        """Normalize + store scraper output. Caller is responsible for save()."""
        from .platform_meta import PLATFORM_META_KEY, build_platform_meta
        meta = build_platform_meta(self.source_platform, self.url, raw)
        extra = dict(self.extra_metadata or {})
        extra[PLATFORM_META_KEY] = meta
        self.extra_metadata = extra
        return meta


class BulkImportJob(models.Model):
    PLATFORM_BROWSER = 'browser'
    PLATFORM_TWITTER = 'twitter'
    PLATFORM_REDDIT = 'reddit'
    PLATFORM_YOUTUBE = 'youtube'
    PLATFORM_POCKET = 'pocket'
    PLATFORM_INSTAPAPER = 'instapaper'
    PLATFORM_RAINDROP = 'raindrop'
    PLATFORM_CSV = 'csv'
    PLATFORM_JSON = 'json'
    PLATFORM_URLS = 'urls'

    PLATFORM_CHOICES = (
        (PLATFORM_BROWSER, 'Browser Bookmarks'),
        (PLATFORM_TWITTER, 'Twitter / X'),
        (PLATFORM_REDDIT, 'Reddit'),
        (PLATFORM_YOUTUBE, 'YouTube'),
        (PLATFORM_POCKET, 'Pocket'),
        (PLATFORM_INSTAPAPER, 'Instapaper'),
        (PLATFORM_RAINDROP, 'Raindrop.io'),
        (PLATFORM_CSV, 'CSV File'),
        (PLATFORM_JSON, 'JSON File'),
        (PLATFORM_URLS, 'URL List'),
    )

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
        related_name='import_jobs',
    )
    source_platform = models.CharField(max_length=30, choices=PLATFORM_CHOICES)
    file_name = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    total_items = models.IntegerField(default=0)
    processed_items = models.IntegerField(default=0)
    created_items = models.IntegerField(default=0)
    skipped_duplicates = models.IntegerField(default=0)
    failed_items = models.IntegerField(default=0)
    error_log = models.JSONField(default=list, blank=True)
    raw_data = models.TextField(blank=True, help_text='Raw file content or URL list for processing')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Import {self.source_platform} ({self.status}) - {self.created_items} items"

