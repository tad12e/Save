from django.contrib import admin

from .models import Destination, DestinationSyncLog


@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ('name', 'provider', 'user', 'is_default', 'is_active', 'created_at')
    list_filter = ('provider', 'is_default', 'is_active')
    search_fields = ('name', 'user__email')


@admin.register(DestinationSyncLog)
class DestinationSyncLogAdmin(admin.ModelAdmin):
    list_display = ('destination_name', 'status', 'clip_title', 'duration_ms', 'user', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('destination_name', 'clip_title', 'user__email', 'details')
