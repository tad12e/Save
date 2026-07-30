from rest_framework import serializers

from apps.destinations.models import Destination

from .models import Clip
from .services.url import hash_url, normalise_url


class ClipSerializer(serializers.ModelSerializer):
    duplicate = serializers.BooleanField(read_only=True, default=False)
    destination_id = serializers.UUIDField(source='destination.id', read_only=True, allow_null=True)
    destination_name = serializers.CharField(source='destination.name', read_only=True, allow_null=True)
    destination_provider = serializers.CharField(source='destination.provider', read_only=True, allow_null=True)

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
            'destination_id',
            'destination_name',
            'destination_provider',
            'export_status',
            'export_url',
            'export_error',
            'created_at',
            'updated_at',
        )
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
