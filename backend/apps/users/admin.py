from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'avatar_url')}),
        ('Social media login', {'fields': ('auth_provider', 'google_id')}),
        ('OTP', {'fields': ('otp', 'otp_expires_at')}),
        ('Status', {'fields': ('is_email_verified', 'is_active', 'is_staff', 'is_superuser')}),
        ('Important dates', {'fields': ('last_login', 'created_at')}),
        ('Permissions', {'fields': ('groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': ('email', 'name', 'password1', 'password2', 'is_staff', 'is_superuser'),
            },
        ),
    )
    readonly_fields = ('created_at', 'last_login')
    list_display = ('email', 'name', 'auth_provider', 'is_email_verified', 'is_staff', 'is_active')
    list_filter = ('auth_provider', 'is_email_verified', 'is_staff', 'is_active')
    ordering = ('email',)
    search_fields = ('email', 'name')
