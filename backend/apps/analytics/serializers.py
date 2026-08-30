from rest_framework import serializers
from .models import Notification


class CardMetricSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    value = serializers.IntegerField()
    sub_label = serializers.CharField()
    trend = serializers.CharField(required=False, allow_null=True)
    trend_diff = serializers.IntegerField(required=False, allow_null=True)
    color = serializers.CharField(required=False, allow_null=True)
    is_alert = serializers.BooleanField(required=False)
    last_week_value = serializers.IntegerField(required=False, allow_null=True)
    total_available = serializers.IntegerField(required=False, allow_null=True)
    target_url = serializers.CharField()


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'message',
            'notification_type',
            'action_url',
            'is_read',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
