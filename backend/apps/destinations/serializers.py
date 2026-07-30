from rest_framework import serializers

from .models import Destination


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
        provider = attrs.get('provider')
        config = attrs.get('config', {})

        if provider == Destination.PROVIDER_NOTION:
            token = config.get('notion_token') or config.get('integration_token')
            if not token or not config.get('database_id'):
                raise serializers.ValidationError({
                    'config': 'Notion requires integration_token (or notion_token) and database_id.',
                })

        if provider == Destination.PROVIDER_GOOGLE_SHEETS:
            if not config.get('access_token') or not config.get('spreadsheet_id'):
                raise serializers.ValidationError({
                    'config': 'Google Sheets requires access_token and spreadsheet_id.',
                })

        return attrs

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
