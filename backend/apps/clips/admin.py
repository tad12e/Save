from django.contrib import admin

from .models import Clip


@admin.register(Clip)
class ClipAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'url', 'status', 'content_type', 'created_at')
    list_filter = ('status', 'content_type', 'created_at')
    search_fields = ('url', 'title', 'user__email')
    readonly_fields = ('id', 'url_hash', 'created_at', 'updated_at')
    ordering = ('-created_at',)
