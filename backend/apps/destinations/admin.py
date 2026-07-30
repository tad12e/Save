from django.contrib import admin

from .models import Destination


@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ('name', 'provider', 'user', 'is_default', 'is_active', 'created_at')
    list_filter = ('provider', 'is_default', 'is_active')
    search_fields = ('name', 'user__email')
