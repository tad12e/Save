from apps.destinations.adapters.google_sheets import GoogleSheetsAdapter
from apps.destinations.adapters.notion import NotionAdapter
from apps.destinations.models import Destination

ADAPTERS = {
    Destination.PROVIDER_NOTION: NotionAdapter(),
    Destination.PROVIDER_GOOGLE_SHEETS: GoogleSheetsAdapter(),
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


def get_user_destination(user, destination_id=None):
    if destination_id:
        dest = Destination.objects.filter(
            pk=destination_id,
            user=user,
        ).first()
        if dest:
            return dest

    return Destination.objects.filter(
        user=user,
        is_active=True,
    ).order_by('-is_default', 'name').first()
