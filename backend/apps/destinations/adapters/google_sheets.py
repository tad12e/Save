import json
import logging
import urllib.error
import urllib.parse
import urllib.request

from apps.clips.services.summarize import clean_text
from .base import BaseDestinationAdapter, ExportResult

logger = logging.getLogger(__name__)

CATEGORY_TAB_MAP = {
    'job': 'Jobs',
    'scholarship': 'Scholarships',
    'article': 'Articles',
    'event': 'Events',
    'course': 'Courses',
    'tool': 'Tools',
    'real_estate': 'Real Estate',
    'recipe': 'Recipes',
    'research_paper': 'Research Papers',
    'podcast': 'Podcasts',
    'product': 'Products',
    'finance': 'Finance',
    'music': 'Music',
    'social_post': 'Social Posts',
    'video': 'Videos',
    'webpage': 'General',
}

# Reliable fallback schemas for core categories
CATEGORY_SCHEMAS = {
    'Jobs': {
        'headers': [
            'Role / Title',
            'Company',
            'Location / Remote',
            'Salary / Comp',
            'Deadline',
            'Application URL',
            'Key Requirements & Summary',
            'Source Platform',
            'Source Author',
            'Saved At',
        ],
        'row_builder': lambda clip, extra, deadline, platform, author, saved_at: [
            clean_text(clip.title or ''),
            clean_text(extra.get('company') or author or ''),
            clean_text(extra.get('location') or ('Remote' if 'remote' in (clip.tags or []) else 'Unspecified')),
            clean_text(extra.get('salary') or 'Not Specified'),
            clean_text(deadline or 'Open'),
            clip.url,
            clean_text(extra.get('requirements_summary') or clip.summary or ''),
            platform,
            author,
            saved_at,
        ],
    },
    'Articles': {
        'headers': [
            'Article Title',
            'Author / Publisher',
            'Executive Summary & Key Takeaways',
            'Reading Time',
            'URL',
            'Tags / Topics',
            'Source Platform',
            'Saved At',
        ],
        'row_builder': lambda clip, extra, deadline, platform, author, saved_at: [
            clean_text(clip.title or ''),
            clean_text(extra.get('author') or author or ''),
            clean_text(extra.get('key_takeaways') or clip.summary or ''),
            clean_text(extra.get('reading_time') or '3-5 min'),
            clip.url,
            clean_text(', '.join(clip.tags or [])),
            platform,
            saved_at,
        ],
    },
    'Scholarships': {
        'headers': [
            'Program / Award Name',
            'Institution / Sponsor',
            'Award Amount',
            'Eligibility Criteria',
            'Deadline',
            'Application Link',
            'Summary & Notes',
            'Saved At',
        ],
        'row_builder': lambda clip, extra, deadline, platform, author, saved_at: [
            clean_text(clip.title or ''),
            clean_text(extra.get('sponsor') or author or ''),
            clean_text(extra.get('award_amount') or 'Funded'),
            clean_text(extra.get('eligibility') or ''),
            clean_text(deadline or 'Open'),
            clip.url,
            clean_text(clip.summary or ''),
            saved_at,
        ],
    },
    'Events': {
        'headers': [
            'Event Name',
            'Organizer',
            'Date & Time',
            'Location (Virtual / City)',
            'Registration Deadline',
            'Event Link',
            'Overview / Agenda',
            'Saved At',
        ],
        'row_builder': lambda clip, extra, deadline, platform, author, saved_at: [
            clean_text(clip.title or ''),
            clean_text(extra.get('organizer') or author or ''),
            clean_text(extra.get('date_time') or deadline or ''),
            clean_text(extra.get('location') or 'Virtual / Online'),
            clean_text(deadline or ''),
            clip.url,
            clean_text(clip.summary or ''),
            saved_at,
        ],
    },
    'Tools': {
        'headers': [
            'Tool / Library Name',
            'Category / Domain',
            'Pricing Model',
            'Website / Repo URL',
            'Core Features Summary',
            'Source Platform',
            'Saved At',
        ],
        'row_builder': lambda clip, extra, deadline, platform, author, saved_at: [
            clean_text(clip.title or ''),
            clean_text(extra.get('category_domain') or (', '.join(clip.tags[:2]) if clip.tags else 'Software Tool')),
            clean_text(extra.get('pricing_model') or 'Freemium / Open Source'),
            clip.url,
            clean_text(extra.get('features_summary') or clip.summary or ''),
            platform,
            saved_at,
        ],
    },
    'Clips': {
        'headers': [
            'Title',
            'URL',
            'Clean Summary',
            'Content Type',
            'Tags',
            'Source Platform',
            'Saved At',
        ],
        'row_builder': lambda clip, extra, deadline, platform, author, saved_at: [
            clean_text(clip.title or ''),
            clip.url,
            clean_text(clip.summary or ''),
            clean_text(clip.content_type or 'webpage'),
            clean_text(', '.join(clip.tags or [])),
            platform,
            saved_at,
        ],
    },
}

STANDARD_HEADERS = CATEGORY_SCHEMAS['Clips']['headers']


def _col_letter(col_count: int) -> str:
    """Convert 1-based column count to spreadsheet column letter (1 -> A, 10 -> J)."""
    result = ''
    while col_count > 0:
        col_count, remainder = divmod(col_count - 1, 26)
        result = chr(65 + remainder) + result
    return result


class GoogleSheetsAdapter(BaseDestinationAdapter):
    provider = 'google_sheets'

    def _refresh_access_token(self, destination) -> str | None:
        """Exchange refresh_token for a fresh Google OAuth access token."""
        refresh_token = destination.config.get('refresh_token')
        if not refresh_token or refresh_token.startswith('mock_'):
            return None

        from django.conf import settings

        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', '')
        if not client_id or not client_secret:
            return None

        payload = urllib.parse.urlencode({
            'client_id': client_id,
            'client_secret': client_secret,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token',
        }).encode()

        request = urllib.request.Request(
            'https://oauth2.googleapis.com/token',
            data=payload,
            method='POST',
        )

        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                data = json.loads(response.read().decode())
                new_token = data.get('access_token')
                if new_token:
                    destination.config['access_token'] = new_token
                    destination.save(update_fields=['config'])
                    logger.info('Successfully refreshed Google OAuth access token.')
                    return new_token
        except Exception as exc:
            logger.warning('Failed to refresh Google access token: %s', exc)

        return None

    def _create_spreadsheet(self, access_token: str, title: str = 'Clipper Saved Clips') -> dict | None:
        """Create a new Google Sheet with formatted initial tab and headers."""
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
                                        for h in STANDARD_HEADERS
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

    def _get_existing_tab_headers(self, spreadsheet_id: str, access_token: str, tab_name: str) -> list[str]:
        """Fetch the current headers in Row 1 of an existing tab."""
        try:
            range_name = urllib.parse.quote(f'{tab_name}!1:1')
            req = urllib.request.Request(
                f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{range_name}',
                headers={'Authorization': f'Bearer {access_token}'},
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode())
                rows = data.get('values', [])
                if rows and len(rows[0]) > 0:
                    return [clean_text(str(h)) for h in rows[0]]
        except Exception:
            pass
        return []

    def _ensure_category_tab(
        self,
        spreadsheet_id: str,
        access_token: str,
        tab_name: str,
        dynamic_headers: list[str] | None = None,
        destination=None,
    ) -> tuple[bool, str, list[str]]:
        """
        Check if tab_name exists in spreadsheet. If not, create it with AI dynamic headers
        or category fallback headers. Returns (success_bool, current_valid_token, existing_headers)
        """
        tok = access_token
        # Determine headers to write if creating new tab
        headers_to_write = dynamic_headers or CATEGORY_SCHEMAS.get(tab_name, CATEGORY_SCHEMAS['Clips'])['headers']

        def _get_titles(cur_tok):
            req = urllib.request.Request(
                f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}?fields=sheets.properties.title',
                headers={'Authorization': f'Bearer {cur_tok}'},
            )
            with urllib.request.urlopen(req, timeout=20) as resp:
                meta = json.loads(resp.read().decode())
                return [s.get('properties', {}).get('title') for s in meta.get('sheets', [])]

        try:
            titles = _get_titles(tok)
            if tab_name in titles:
                existing_headers = self._get_existing_tab_headers(spreadsheet_id, tok, tab_name)
                return True, tok, existing_headers or headers_to_write
        except urllib.error.HTTPError as exc:
            if exc.code == 401 and destination:
                tok = self._refresh_access_token(destination) or tok
                try:
                    titles = _get_titles(tok)
                    if tab_name in titles:
                        existing_headers = self._get_existing_tab_headers(spreadsheet_id, tok, tab_name)
                        return True, tok, existing_headers or headers_to_write
                except Exception:
                    pass

        # Tab does not exist -> Create tab via batchUpdate
        add_sheet_payload = {
            'requests': [
                {
                    'addSheet': {
                        'properties': {
                            'title': tab_name,
                        }
                    }
                }
            ]
        }
        batch_req = urllib.request.Request(
            f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}:batchUpdate',
            data=json.dumps(add_sheet_payload).encode(),
            headers={
                'Authorization': f'Bearer {tok}',
                'Content-Type': 'application/json',
            },
            method='POST',
        )
        try:
            with urllib.request.urlopen(batch_req, timeout=20):
                pass
        except urllib.error.HTTPError as exc:
            if exc.code == 401 and destination:
                tok = self._refresh_access_token(destination) or tok
                batch_req = urllib.request.Request(
                    f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}:batchUpdate',
                    data=json.dumps(add_sheet_payload).encode(),
                    headers={
                        'Authorization': f'Bearer {tok}',
                        'Content-Type': 'application/json',
                    },
                    method='POST',
                )
                try:
                    with urllib.request.urlopen(batch_req, timeout=20):
                        pass
                except Exception as b_exc:
                    if 'already exists' not in str(b_exc):
                        logger.warning('Failed to add category tab %s: %s', tab_name, b_exc)
            elif 'already exists' not in str(exc):
                logger.warning('Failed to add category tab %s: %s', tab_name, exc)

        # Write category headers to the newly created tab
        end_col = _col_letter(len(headers_to_write))
        header_range = urllib.parse.quote(f'{tab_name}!A1:{end_col}1')
        header_url = f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{header_range}?valueInputOption=USER_ENTERED'
        header_req = urllib.request.Request(
            header_url,
            data=json.dumps({'values': [headers_to_write]}).encode(),
            headers={
                'Authorization': f'Bearer {tok}',
                'Content-Type': 'application/json',
            },
            method='PUT',
        )
        try:
            with urllib.request.urlopen(header_req, timeout=15):
                logger.info('Initialized dynamic headers for new tab %s (%s)', tab_name, headers_to_write)
        except Exception as h_exc:
            logger.warning('Could not write header row for tab %s: %s', tab_name, h_exc)

        return True, tok, headers_to_write

    def export_clip(self, clip, destination) -> ExportResult:
        access_token = destination.config.get('access_token')
        spreadsheet_id = destination.config.get('spreadsheet_id')
        routing_mode = destination.config.get('routing_mode', 'category_tabs')

        extra = getattr(clip, 'extra_metadata', {}) or {}
        dynamic_tab_name = extra.get('category_name')
        dynamic_headers = extra.get('dynamic_headers')
        dynamic_row = extra.get('dynamic_row') or {}

        # Determine target tab name based on AI category or fallback map
        if routing_mode == 'single_table':
            target_tab = destination.config.get('sheet_name', 'Clips')
        elif dynamic_tab_name:
            target_tab = dynamic_tab_name.strip()
        else:
            category_key = (clip.content_type or 'webpage').lower()
            target_tab = CATEGORY_TAB_MAP.get(category_key, 'Clips')

        # Try refreshing the token if missing or stale
        if not access_token and destination.config.get('refresh_token'):
            access_token = self._refresh_access_token(destination)

        # Fallback to simulated demo mode only if no token is available at all
        if not access_token or access_token.startswith('mock_') or access_token == 'demo_google_sheets_token':
            logger.info('Dev/Demo Mode: Simulated Google Sheets export succeeded for clip %s to tab %s', clip.id, target_tab)
            return ExportResult(
                success=True,
                external_url='https://docs.google.com/spreadsheets/d/1BxiMVs0XRon539e0-vA28VPb3znu82345/edit',
                external_id=f'{target_tab}!A:J',
            )

        # Auto-create spreadsheet if missing
        if not spreadsheet_id and access_token:
            result = self._create_spreadsheet(access_token)
            if not result and destination.config.get('refresh_token'):
                access_token = self._refresh_access_token(destination)
                if access_token:
                    result = self._create_spreadsheet(access_token)

            if result:
                spreadsheet_id = result.get('spreadsheetId')
                destination.config['spreadsheet_id'] = spreadsheet_id
                destination.save(update_fields=['config'])
                logger.info('Auto-created Google Sheet: %s', spreadsheet_id)

        if not spreadsheet_id:
            return ExportResult(
                success=False,
                error='Google Sheets destination is missing spreadsheet_id (Google OAuth Token required).',
            )

        # Ensure category tab exists with dynamic AI headers or fallback schema
        active_headers = []
        try:
            _, access_token, active_headers = self._ensure_category_tab(
                spreadsheet_id,
                access_token,
                target_tab,
                dynamic_headers=dynamic_headers if isinstance(dynamic_headers, list) and dynamic_headers else None,
                destination=destination,
            )
        except Exception as tab_err:
            logger.warning('Tab ensure warning: %s — falling back to Clips tab', tab_err)
            target_tab = 'Clips'
            active_headers = CATEGORY_SCHEMAS['Clips']['headers']

        deadline_str = ''
        if hasattr(clip, 'deadline_date') and clip.deadline_date:
            deadline_str = clip.deadline_date.strftime('%Y-%m-%d')

        platform_str = clip.get_source_platform_display() if hasattr(clip, 'get_source_platform_display') else getattr(clip, 'source_platform', 'web')
        author_str = getattr(clip, 'source_author', '') or ''
        saved_at_str = clip.created_at.isoformat() if clip.created_at else ''

        # Build row values aligning with active_headers
        row = []
        if dynamic_row and active_headers:
            # Map dynamic AI values to the active columns of the tab
            for header in active_headers:
                h_clean = header.strip()
                h_lower = h_clean.lower()
                val = dynamic_row.get(h_clean) or dynamic_row.get(header)
                if val:
                    row.append(clean_text(str(val)))
                elif any(k in h_lower for k in ('title', 'name', 'role')):
                    row.append(clean_text(clip.title or ''))
                elif any(k in h_lower for k in ('url', 'link')):
                    row.append(clip.url)
                elif any(k in h_lower for k in ('summary', 'overview', 'description', 'notes', 'takeaway')):
                    row.append(clean_text(clip.summary or ''))
                elif 'platform' in h_lower or 'source' in h_lower and 'author' not in h_lower:
                    row.append(platform_str)
                elif 'author' in h_lower or 'host' in h_lower:
                    row.append(clean_text(author_str or extra.get('author') or ''))
                elif 'saved' in h_lower or 'date' in h_lower and 'deadline' not in h_lower:
                    row.append(saved_at_str)
                elif 'deadline' in h_lower:
                    row.append(deadline_str or 'Open')
                elif 'company' in h_lower:
                    row.append(clean_text(extra.get('company') or author_str or ''))
                elif 'location' in h_lower:
                    row.append(clean_text(extra.get('location') or ''))
                elif 'salary' in h_lower or 'price' in h_lower or 'award' in h_lower:
                    row.append(clean_text(extra.get('salary') or extra.get('award_amount') or ''))
                elif 'tags' in h_lower:
                    row.append(clean_text(', '.join(clip.tags or [])))
                else:
                    row.append('')
        else:
            # Fallback to hardcoded category schema builder if AI dynamic mapping is not available
            schema = CATEGORY_SCHEMAS.get(target_tab, CATEGORY_SCHEMAS['Clips'])
            row = schema['row_builder'](
                clip=clip,
                extra=extra,
                deadline=deadline_str,
                platform=platform_str,
                author=author_str,
                saved_at=saved_at_str,
            )

        end_col = _col_letter(len(row))
        range_name = urllib.parse.quote(f'{target_tab}!A:{end_col}')
        url = (
            f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/'
            f'{range_name}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS'
        )

        def _append_row(tok: str):
            req = urllib.request.Request(
                url,
                data=json.dumps({'values': [row]}).encode(),
                headers={
                    'Authorization': f'Bearer {tok}',
                    'Content-Type': 'application/json',
                },
                method='POST',
            )
            with urllib.request.urlopen(req, timeout=20) as resp:
                return json.loads(resp.read().decode())

        try:
            data = _append_row(access_token)
        except urllib.error.HTTPError as exc:
            if (exc.code == 401 or exc.code == 400) and destination.config.get('refresh_token'):
                refreshed_token = self._refresh_access_token(destination)
                if refreshed_token:
                    # Retry ensuring tab and appending
                    self._ensure_category_tab(
                        spreadsheet_id,
                        refreshed_token,
                        target_tab,
                        dynamic_headers=dynamic_headers if isinstance(dynamic_headers, list) and dynamic_headers else None,
                        destination=destination,
                    )
                    try:
                        data = _append_row(refreshed_token)
                    except Exception as retry_exc:
                        return ExportResult(success=False, error=f'Google Sheets API retry error: {retry_exc}')
                else:
                    return ExportResult(success=False, error='Google OAuth token expired and refresh failed.')
            else:
                body = exc.read().decode() if exc.fp else str(exc)
                return ExportResult(success=False, error=f'Google Sheets API error: {body}')
        except urllib.error.URLError as exc:
            return ExportResult(success=False, error=f'Google Sheets request failed: {exc}')

        sheet_url = f'https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit#gid=0'
        updated_range = data.get('updates', {}).get('updatedRange', '')
        return ExportResult(success=True, external_url=sheet_url, external_id=updated_range)
