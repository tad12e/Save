from django.core.management.base import BaseCommand
from apps.destinations.models import Destination
from apps.destinations.services import ADAPTERS


class Command(BaseCommand):
    help = 'Retroactively apply executive dashboard styling to all Google Sheets tabs'

    def add_arguments(self, parser):
        parser.add_argument('--sheet-id', type=str, help='Optional explicit Google Spreadsheet ID')

    def handle(self, *args, **options):
        sheet_id = options.get('sheet_id')
        destinations = Destination.objects.filter(provider='google_sheets', is_active=True)

        if not destinations.exists():
            self.stdout.write(self.style.WARNING('No active Google Sheets destination found.'))
            return

        adapter = ADAPTERS.get('google_sheets')
        if not adapter or not hasattr(adapter, 'beautify_all_tabs'):
            self.stdout.write(self.style.ERROR('GoogleSheetsAdapter not registered or missing beautify_all_tabs.'))
            return

        for dest in destinations:
            target_id = sheet_id or dest.config.get('spreadsheet_id')
            self.stdout.write(f"Beautifying Google Sheet '{dest.name}' (ID: {target_id})...")
            result = adapter.beautify_all_tabs(dest, spreadsheet_id=target_id)
            if result.get('success'):
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Successfully styled tabs: {', '.join(result.get('beautified_tabs', []))}"
                    )
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f"Error beautifying '{dest.name}': {result.get('error')}")
                )
