import logging
from rest_framework import serializers
from .models import Destination, DestinationSyncLog

logger = logging.getLogger(__name__)


class DestinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destination
        fields = (
            'id',
            'provider',
            'name',
            'config',
            'is_default',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class DestinationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destination
        fields = ('provider', 'name', 'config', 'is_default', 'is_active')

    def validate(self, attrs):
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if request and getattr(request, 'user', None) and request.user.is_authenticated:
            validated_data['user'] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        new_config = validated_data.pop('config', None)
        if new_config is not None:
            current_config = dict(instance.config or {})
            current_config.update(new_config)
            instance.config = current_config

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class DestinationSyncLogSerializer(serializers.ModelSerializer):
    destination_id = serializers.UUIDField(required=False, allow_null=True)
    clip_id = serializers.UUIDField(required=False, allow_null=True)

    # CamelCase aliases for frontend compatibility
    destinationId = serializers.SerializerMethodField()
    destinationName = serializers.SerializerMethodField()
    clipTitle = serializers.SerializerMethodField()
    durationMs = serializers.IntegerField(source='duration_ms', read_only=True)
    payloadSize = serializers.CharField(source='payload_size', read_only=True)
    timestamp = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = DestinationSyncLog
        fields = (
            'id',
            'destination',
            'destination_id',
            'destination_name',
            'clip',
            'clip_id',
            'clip_title',
            'status',
            'duration_ms',
            'payload_size',
            'details',
            'error_message',
            'created_at',
            'updated_at',
            # CamelCase aliases
            'destinationId',
            'destinationName',
            'clipTitle',
            'durationMs',
            'payloadSize',
            'timestamp',
        )
        read_only_fields = (
            'id',
            'created_at',
            'updated_at',
            'destinationId',
            'destinationName',
            'clipTitle',
            'durationMs',
            'payloadSize',
            'timestamp',
        )
        extra_kwargs = {
            'destination': {'required': False, 'allow_null': True},
            'clip': {'required': False, 'allow_null': True},
        }

    def get_destinationId(self, obj) -> str:
        if obj.destination_id:
            return str(obj.destination_id)
        return ''

    def get_destinationName(self, obj) -> str:
        return obj.destination_name or (obj.destination.name if obj.destination else '')

    def get_clipTitle(self, obj) -> str:
        return obj.clip_title or (getattr(obj.clip, 'title', '') if obj.clip else '')

    def create(self, validated_data):
        from apps.clips.models import Clip

        request = self.context.get('request')
        if request and getattr(request, 'user', None) and request.user.is_authenticated:
            validated_data['user'] = request.user

        initial = getattr(self, 'initial_data', {}) or {}

        # Support destinationId or destination_id
        dest_id = validated_data.pop('destination_id', None) or initial.get('destinationId') or initial.get('destination_id')
        if dest_id and 'destination' not in validated_data:
            try:
                dest = Destination.objects.filter(id=dest_id).first()
                if dest:
                    validated_data['destination'] = dest
                    if not validated_data.get('destination_name'):
                        validated_data['destination_name'] = dest.name
            except Exception as exc:
                logger.warning("DestinationSyncLog: failed to lookup destination by ID %r: %s", dest_id, exc)

        # Support clipId or clip_id
        clip_id = validated_data.pop('clip_id', None) or initial.get('clipId') or initial.get('clip_id')
        if clip_id and 'clip' not in validated_data:
            try:
                clip = Clip.objects.filter(id=clip_id).first()
                if clip:
                    validated_data['clip'] = clip
                    if not validated_data.get('clip_title'):
                        validated_data['clip_title'] = getattr(clip, 'title', '')
            except Exception as exc:
                logger.warning("DestinationSyncLog: failed to lookup clip by ID %r: %s", clip_id, exc)

        if 'clipTitle' in initial and not validated_data.get('clip_title'):
            validated_data['clip_title'] = str(initial['clipTitle'])
        if 'destinationName' in initial and not validated_data.get('destination_name'):
            validated_data['destination_name'] = str(initial['destinationName'])
        if 'durationMs' in initial and 'duration_ms' not in validated_data:
            try:
                validated_data['duration_ms'] = int(initial['durationMs'])
            except (ValueError, TypeError) as exc:
                logger.warning("DestinationSyncLog: invalid durationMs %r: %s", initial.get('durationMs'), exc)
        if 'payloadSize' in initial and not validated_data.get('payload_size'):
            validated_data['payload_size'] = str(initial['payloadSize'])

        return super().create(validated_data)
