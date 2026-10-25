import re

from rest_framework import serializers

from apps.destinations.models import Destination

from .models import Clip, CustomCategory, CustomPage
from .services.url import hash_url, normalise_url


class CustomCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomCategory
        fields = (
            'id',
            'dimension',
            'name',
            'slug',
            'color',
            'bg_color',
            'icon_name',
            'description',
            'keywords',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class CustomPageSerializer(serializers.ModelSerializer):
    clip_count = serializers.SerializerMethodField()
    parent_id = serializers.UUIDField(source='parent.id', read_only=True, allow_null=True)
    sub_page_count = serializers.SerializerMethodField()

    class Meta:
        model = CustomPage
        fields = (
            'id',
            'parent_id',
            'name',
            'slug',
            'icon_name',
            'color',
            'bg_color',
            'description',
            'content_types',
            'ai_goal_prompt',
            'is_system_default',
            'clip_count',
            'sub_page_count',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'parent_id', 'created_at', 'updated_at')

    def get_clip_count(self, obj) -> int:
        annotated = getattr(obj, 'annotated_clip_count', None)
        if annotated is not None:
            return int(annotated)
        return obj.clips.count()

    def get_sub_page_count(self, obj) -> int:
        return obj.sub_pages.count()


from apps.clips.services.sanitizer import (
    BOILERPLATE_PATTERNS,
    clean_boilerplate,
    clean_clip_summary,
    clean_clip_title,
)

clean_summary_text = clean_clip_summary


class ClipSerializer(serializers.ModelSerializer):
    duplicate = serializers.BooleanField(read_only=True, default=False)
    destination_id = serializers.UUIDField(source='destination.id', read_only=True, allow_null=True)
    destination_name = serializers.CharField(source='destination.name', read_only=True, allow_null=True)
    destination_provider = serializers.CharField(source='destination.provider', read_only=True, allow_null=True)
    parent_clip_id = serializers.UUIDField(source='parent_clip.id', read_only=True, allow_null=True)
    parent_clip_title = serializers.CharField(source='parent_clip.title', read_only=True, allow_null=True)
    child_clips_count = serializers.SerializerMethodField()
    custom_page_id = serializers.UUIDField(source='custom_page.id', read_only=True, allow_null=True)
    custom_page_name = serializers.CharField(source='custom_page.name', read_only=True, allow_null=True)
    is_favorite = serializers.SerializerMethodField()
    platform_skin = serializers.CharField(read_only=True)
    platform_meta = serializers.DictField(read_only=True)
    platform_metadata = serializers.DictField(source='platform_meta', read_only=True)

    class Meta:
        model = Clip
        fields = (
            'id',
            'is_favorite',
            'url',
            'selected_text',
            'status',
            'duplicate',
            'source_platform',
            'source_author',
            'source_post_url',
            'platform_skin',
            'platform_meta',
            'platform_metadata',
            'parent_clip_id',
            'parent_clip_title',
            'child_clips_count',
            'custom_page_id',
            'custom_page_name',
            'is_resource_hub',
            'extracted_resource_url',
            'title',
            'content_type',
            'intent',
            'tags',
            'summary',
            'deadline_date',
            'music_embed_url',
            'reminder_sent',
            'destination_id',
            'destination_name',
            'destination_provider',
            'export_status',
            'export_url',
            'export_error',
            'extra_metadata',
            'created_at',
            'updated_at',
            # raw_content is intentionally excluded here to allow .defer('raw_content')
            # in list feeds without triggering lazy N+1 queries.
        )
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)
        summary = data.get('summary')
        if summary:
            data['summary'] = clean_summary_text(summary, data.get('title') or '')
        # Cross-platform parity: ensure extra_metadata includes intent for clients expecting it there
        intent_val = data.get('intent') or getattr(instance, 'intent', None)
        if intent_val and intent_val != 'other':
            if isinstance(data.get('extra_metadata'), dict):
                if 'intent' not in data['extra_metadata']:
                    data['extra_metadata']['intent'] = intent_val
        return data

    def get_child_clips_count(self, obj) -> int:
        # Prefers the annotated count (same query, no extra DB hit) when the
        # view provides it; otherwise falls back to a per-object COUNT query.
        annotated = getattr(obj, 'prefetched_child_count', None)
        if annotated is not None:
            return int(annotated)
        if hasattr(obj, 'child_clips'):
            return obj.child_clips.count()
        return 0

    def get_is_favorite(self, obj) -> bool:
        meta = obj.extra_metadata or {}
        return bool(meta.get('is_favorite') or meta.get('is_starred') or meta.get('is_liked'))


class ClipDetailSerializer(ClipSerializer):
    """
    Detailed serializer for single-clip views.
    Includes the heavy raw_content field.
    """
    class Meta(ClipSerializer.Meta):
        fields = ClipSerializer.Meta.fields + ('raw_content',)
        read_only_fields = fields


class ClipCreateSerializer(serializers.Serializer):
    url = serializers.URLField(max_length=2048)
    selected_text = serializers.CharField(required=False, default='', allow_blank=True)
    destination_id = serializers.PrimaryKeyRelatedField(
        queryset=Destination.objects.none(),
        required=False,
        allow_null=True,
        source='destination',
    )
    unpack_sub_items = serializers.BooleanField(required=False, default=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['destination_id'].queryset = Destination.objects.filter(
                user=request.user,
                is_active=True,
            )

    def validate_url(self, value):
        self._normalised_url = normalise_url(value)
        self._url_hash = hash_url(self._normalised_url)
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        destination = validated_data.get('destination')

        existing = Clip.objects.filter(user=user, url_hash=self._url_hash).first()
        if existing:
            existing.duplicate = True
            return existing

        clip = Clip.objects.create(
            user=user,
            url=validated_data['url'],
            url_hash=self._url_hash,
            selected_text=validated_data.get('selected_text', ''),
            status=Clip.STATUS_PENDING,
            destination=destination,
        )
        clip.duplicate = False

        from .tasks import process_clip

        process_clip.delay(str(clip.id))

        return clip
