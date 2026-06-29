from rest_framework import serializers

from .models import Clip
from .services.url import hash_url, normalise_url


class ClipSerializer(serializers.ModelSerializer):
    """Read serializer — returned in all responses."""
    duplicate = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = Clip
        fields = (
            'id',
            'url',
            'selected_text',
            'status',
            'duplicate',
            'title',
            'content_type',
            'tags',
            'summary',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields


class ClipCreateSerializer(serializers.Serializer):
    """Write serializer — accepts the POST payload from the extension."""
    url = serializers.URLField(max_length=2048)
    selected_text = serializers.CharField(required=False, default='', allow_blank=True)

    def validate_url(self, value):
        """Normalise + hash the URL upfront so the view can use them."""
        self._normalised_url = normalise_url(value)
        self._url_hash = hash_url(self._normalised_url)
        return value

    def create(self, validated_data):
        user = self.context['request'].user

        # --- Dedup check ---
        existing = Clip.objects.filter(user=user, url_hash=self._url_hash).first()
        if existing:
            existing.duplicate = True
            return existing

        # --- Create new clip ---
        clip = Clip.objects.create(
            user=user,
            url=validated_data['url'],
            url_hash=self._url_hash,
            selected_text=validated_data.get('selected_text', ''),
            status=Clip.STATUS_PENDING,
        )
        clip.duplicate = False

        # --- Fire background processing (Celery) ---
        # Import inside create to avoid circular imports and to make
        # the module importable even when Celery is not configured yet.
        try:
            from .tasks import process_clip
            process_clip.delay(str(clip.id))
        except ImportError:
            # Celery task module not yet created — skip silently in dev.
            pass

        return clip
