from apps.destinations.adapters.google_sheets import GoogleSheetsAdapter
from apps.destinations.adapters.notion import NotionAdapter
from apps.destinations.adapters.spotify import SpotifyAdapter
from apps.destinations.adapters.airtable import AirtableAdapter
from apps.destinations.adapters.webhook import WebhookAdapter
from apps.destinations.adapters.youtube_music import YouTubeMusicAdapter
from apps.destinations.models import Destination

ADAPTERS = {
    Destination.PROVIDER_NOTION: NotionAdapter(),
    Destination.PROVIDER_GOOGLE_SHEETS: GoogleSheetsAdapter(),
    Destination.PROVIDER_SPOTIFY: SpotifyAdapter(),
    Destination.PROVIDER_AIRTABLE: AirtableAdapter(),
    Destination.PROVIDER_WEBHOOK: WebhookAdapter(),
    Destination.PROVIDER_YOUTUBE_MUSIC: YouTubeMusicAdapter(),
}


def export_clip_to_destination(clip, destination):
    adapter = ADAPTERS.get(destination.provider)
    if adapter is None:
        from apps.destinations.adapters.base import ExportResult

        return ExportResult(success=False, error=f'Unsupported provider: {destination.provider}')

    return adapter.export_clip(clip, destination)


def batch_export_resources_to_destination(destination, resources: list[dict], source_url: str = '', source_repo: str = '', saved_at_str: str = ''):
    """
    Batch export list resources (e.g. from GitHub awesome lists) to the user's destination (Google Sheets Tools tab).
    """
    adapter = ADAPTERS.get(destination.provider)
    if adapter is None:
        from apps.destinations.adapters.base import ExportResult
        return ExportResult(success=False, error=f'Unsupported provider: {destination.provider}')

    if hasattr(adapter, 'batch_export_tools'):
        return adapter.batch_export_tools(
            destination=destination,
            resources=resources,
            source_url=source_url,
            source_repo=source_repo,
            saved_at_str=saved_at_str,
        )

    from apps.destinations.adapters.base import ExportResult
    return ExportResult(success=True, external_url='', external_id='')


def get_user_destination(user, destination_id=None, content_type=None):
    if destination_id:
        dest = Destination.objects.filter(
            pk=destination_id,
            user=user,
        ).first()
        if dest:
            return dest

    # 1. Special rule for Music: route to preferred or default connected music provider
    if content_type == 'music':
        preferred_music = Destination.objects.filter(
            user=user,
            is_active=True,
            provider__in=['spotify', 'youtube_music'],
            config__is_preferred_music=True,
        ).first()
        if preferred_music:
            return preferred_music

        music_dest = Destination.objects.filter(
            user=user,
            is_active=True,
            provider__in=['spotify', 'youtube_music'],
        ).order_by('-is_default', 'name').first()
        if music_dest:
            return music_dest

    # 2. Check if user configured a specific default destination for this category
    if content_type:
        category_dest = Destination.objects.filter(
            user=user,
            is_active=True,
            config__content_types__contains=content_type,
        ).first()
        if category_dest:
            return category_dest

    # 3. Universal Global Default Destination (fallback for blogs, articles, and general clips)
    return Destination.objects.filter(
        user=user,
        is_active=True,
    ).order_by('-is_default', 'name').first()

