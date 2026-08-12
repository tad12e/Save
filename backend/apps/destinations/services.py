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
