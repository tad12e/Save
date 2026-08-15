from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe

from .models import Clip


@admin.register(Clip)
class ClipAdmin(admin.ModelAdmin):
    list_display = (
        'short_title',
        'user',
        'source_badge',
        'status_badge',
        'content_type',
        'summary_preview',
        'parent_clip_link',
        'embedding_status',
        'deadline_date',
        'export_status_badge',
        'created_at',
    )
    list_filter = (
        'source_platform',
        'status',
        'content_type',
        'is_resource_hub',
        'export_status',
        'reminder_sent',
        'destination',
        'created_at',
    )
    search_fields = (
        'title',
        'url',
        'summary',
        'selected_text',
        'source_author',
        'user__email',
        'tags',
    )
    readonly_fields = (
        'id',
        'url_hash',
        'embedding_summary',
        'created_at',
        'updated_at',
    )
    ordering = ('-created_at',)
    list_per_page = 25

    fieldsets = (
        (
            'Core Information',
            {
                'fields': (
                    'id',
                    'user',
                    'parent_clip',
                    'url',
                    'url_hash',
                    'status',
                    'created_at',
                    'updated_at',
                ),
            },
        ),
        (
            'Source Platform & Origin',
            {
                'fields': (
                    'source_platform',
                    'source_author',
                    'source_post_url',
                    'is_resource_hub',
                    'extracted_resource_url',
                ),
            },
        ),
        (
            'Clip Content & Selection',
            {
                'fields': (
                    'title',
                    'selected_text',
                    'summary',
                    'content_type',
                    'tags',
                ),
            },
        ),
        (
            'AI Extraction & Vector Embedding',
            {
                'fields': (
                    'embedding_summary',
                    'embedding',
                    'deadline_date',
                    'music_embed_url',
                    'reminder_sent',
                ),
            },
        ),
        (
            'Destination & Sync Export',
            {
                'fields': (
                    'destination',
                    'export_status',
                    'export_url',
                    'export_error',
                ),
            },
        ),
    )

    @admin.display(description='Title / URL')
    def short_title(self, obj):
        title = obj.title or obj.url or 'Untitled Clip'
        if len(title) > 40:
            return f'{title[:37]}...'
        return title

    @admin.display(description='Source')
    def source_badge(self, obj):
        badge_styles = {
            'x_twitter': ('#000000', '𝕏 X/Twitter'),
            'linkedin': ('#0a66c2', 'in LinkedIn'),
            'reddit': ('#ff4500', 'Reddit'),
            'youtube': ('#ff0000', 'YouTube'),
            'github': ('#24292e', 'GitHub'),
            'web': ('#64748b', 'Web'),
        }
        color, label = badge_styles.get(obj.source_platform, ('#64748b', obj.source_platform or 'Web'))
        author_html = f' <span style="font-size: 11px; color: #475569;">{obj.source_author}</span>' if obj.source_author else ''
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">{}</span>{}',
            color,
            label,
            mark_safe(author_html),
        )

    @admin.display(description='Parent / Rel')
    def parent_clip_link(self, obj):
        if obj.parent_clip:
            return format_html(
                '<a href="/admin/clips/clip/{}/change/" style="font-size: 11px; color: #3b82f6;">↳ Parent: {}</a>',
                obj.parent_clip.id,
                obj.parent_clip.title[:20] if obj.parent_clip.title else 'Parent Clip',
            )
        children_count = obj.child_clips.count()
        if children_count > 0:
            return format_html(
                '<span style="background: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">📦 {} items</span>',
                children_count,
            )
        return mark_safe('<span style="color: #9ca3af;">-</span>')

    @admin.display(description='Summary')
    def summary_preview(self, obj):
        if not obj.summary:
            return '-'
        if len(obj.summary) > 50:
            return f'{obj.summary[:47]}...'
        return obj.summary

    @admin.display(description='Status')
    def status_badge(self, obj):
        colors = {
            'done': '#10b981',
            'processing': '#3b82f6',
            'pending': '#f59e0b',
            'failed': '#ef4444',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase;">{}</span>',
            color,
            obj.status,
        )

    @admin.display(description='Embedding')
    def embedding_status(self, obj):
        if obj.embedding and isinstance(obj.embedding, list) and len(obj.embedding) > 0:
            return format_html(
                '<span style="color: #10b981; font-weight: bold;">✓ ({} dims)</span>',
                len(obj.embedding),
            )
        return mark_safe('<span style="color: #9ca3af;">None</span>')

    @admin.display(description='Export')
    def export_status_badge(self, obj):
        colors = {
            'done': '#10b981',
            'processing': '#3b82f6',
            'pending': '#f59e0b',
            'failed': '#ef4444',
            'skipped': '#6b7280',
        }
        color = colors.get(obj.export_status, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px;">{}</span>',
            color,
            obj.export_status,
        )

    @admin.display(description='Embedding Vector Details')
    def embedding_summary(self, obj):
        if not obj.embedding or not isinstance(obj.embedding, list) or len(obj.embedding) == 0:
            return 'No embedding generated yet.'
        sample = obj.embedding[:5]
        sample_str = ', '.join(f'{x:.5f}' for x in sample)
        return format_html(
            '<strong>Vector Dimension:</strong> {} dimensions<br>'
            '<strong>Sample Values (first 5):</strong> <code>[{}]</code>',
            len(obj.embedding),
            sample_str,
        )
