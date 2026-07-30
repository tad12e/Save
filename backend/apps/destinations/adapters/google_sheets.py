import json
import urllib.error
import urllib.parse
import urllib.request

from .base import BaseDestinationAdapter, ExportResult


class GoogleSheetsAdapter(BaseDestinationAdapter):
    provider = 'google_sheets'

    def export_clip(self, clip, destination) -> ExportResult:
        access_token = destination.config.get('access_token')
        spreadsheet_id = destination.config.get('spreadsheet_id')
        sheet_name = destination.config.get('sheet_name', 'Clips')

        if not access_token or not spreadsheet_id:
            return ExportResult(
                success=False,
                error='Google Sheets destination is missing access_token or spreadsheet_id.',
            )

        row = [
            clip.title or '',
            clip.url,
            clip.summary or clip.selected_text or '',
            clip.content_type or '',
            ', '.join(clip.tags or []),
            clip.created_at.isoformat() if clip.created_at else '',
        ]

        range_name = urllib.parse.quote(f'{sheet_name}!A:F')
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
