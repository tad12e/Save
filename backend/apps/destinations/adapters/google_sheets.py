import json
import logging
import urllib.error
import urllib.parse
import urllib.request

from .base import BaseDestinationAdapter, ExportResult

logger = logging.getLogger(__name__)


class GoogleSheetsAdapter(BaseDestinationAdapter):
    provider = 'google_sheets'

    def _create_spreadsheet(self, access_token: str, title: str = 'Clipper Saved Clips') -> dict | None:
        """Create a new Google Sheet with formatted headers. Returns spreadsheet metadata dict."""
        payload = {
            'properties': {'title': title},
            'sheets': [
                {
                    'properties': {'title': 'Clips'},
                    'data': [
                        {
                            'startRow': 0,
                            'startColumn': 0,
                            'rowData': [
                                {
                                    'values': [
                                        {'userEnteredValue': {'stringValue': h}}
                                        for h in ['Title', 'URL', 'Summary', 'Type', 'Tags', 'Deadline', 'Saved At']
                                    ]
                                }
                            ],
                        }
                    ],
                }
            ],
        }

        request = urllib.request.Request(
            'https://sheets.googleapis.com/v4/spreadsheets',
            data=json.dumps(payload).encode(),
            headers={
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            },
            method='POST',
        )

        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                return json.loads(response.read().decode())
        except (urllib.error.HTTPError, urllib.error.URLError) as exc:
            logger.error('Failed to create Google Sheet: %s', exc)
            return None

    def export_clip(self, clip, destination) -> ExportResult:
        access_token = destination.config.get('access_token')
        spreadsheet_id = destination.config.get('spreadsheet_id')
        sheet_name = destination.config.get('sheet_name', 'Clips')

        if not access_token:
            return ExportResult(
                success=False,
                error='Google Sheets destination is missing access_token.',
            )

        # Auto-create a new spreadsheet if requested
        if destination.config.get('create_new') and not spreadsheet_id:
            result = self._create_spreadsheet(access_token)
            if result:
                spreadsheet_id = result.get('spreadsheetId')
                # Persist the new spreadsheet_id so future clips append to the same sheet
                destination.config['spreadsheet_id'] = spreadsheet_id
                destination.config['create_new'] = False
                destination.save(update_fields=['config'])
                logger.info('Auto-created Google Sheet: %s', spreadsheet_id)
            else:
                return ExportResult(success=False, error='Failed to auto-create Google Sheet.')

        if not spreadsheet_id:
            return ExportResult(
                success=False,
                error='Google Sheets destination is missing spreadsheet_id.',
            )

        deadline_str = ''
        if hasattr(clip, 'deadline_date') and clip.deadline_date:
            deadline_str = clip.deadline_date.strftime('%Y-%m-%d')

        row = [
            clip.title or '',
            clip.url,
            clip.summary or clip.selected_text or '',
            clip.content_type or '',
            ', '.join(clip.tags or []),
            deadline_str,
            clip.created_at.isoformat() if clip.created_at else '',
        ]

        range_name = urllib.parse.quote(f'{sheet_name}!A:G')
        url = (
            f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/'
            f'{range_name}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS'
        )

        request = urllib.request.Request(
            url,
            data=json.dumps({'values': [row]}).encode(),
            headers={
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            },
            method='POST',
        )

        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                data = json.loads(response.read().decode())
        except urllib.error.HTTPError as exc:
            body = exc.read().decode() if exc.fp else str(exc)
            return ExportResult(success=False, error=f'Google Sheets API error: {body}')
        except urllib.error.URLError as exc:
            return ExportResult(success=False, error=f'Google Sheets request failed: {exc}')

        sheet_url = f'https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit'
        updated_range = data.get('updates', {}).get('updatedRange', '')
        return ExportResult(success=True, external_url=sheet_url, external_id=updated_range)

