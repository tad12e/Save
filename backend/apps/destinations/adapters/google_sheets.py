import json
import logging
import urllib.error
import urllib.parse
import urllib.request

from django.utils import timezone
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
            'Job Link',
            'Source Post URL',
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
            clean_text(
                extra.get('job_url')
                or extra.get('apply_url')
                or getattr(clip, 'extracted_resource_url', None)
                or (clip.url if not any(d in (clip.url or '') for d in ('x.com', 'twitter.com', 'linkedin.com/feed')) else None)
                or 'None'
            ),
            clean_text(getattr(clip, 'source_post_url', '') or (clip.url if any(d in (clip.url or '') for d in ('x.com', 'twitter.com', 'linkedin.com')) else 'None')),
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
            'Tool Name',
            'Website URL',
            'Description',
            'Section / Category',
            'Pricing Model',
            'Content Type',
            'Source Repo',
            'Source URL',
            'Saved At',
        ],
        'row_builder': lambda clip, extra, deadline, platform, author, saved_at: [
            clean_text(clip.title or extra.get('name') or ''),
            clip.url,
            clean_text(clip.summary or extra.get('description') or ''),
            clean_text(extra.get('section') or extra.get('category_domain') or 'General'),
            clean_text(extra.get('pricing') or extra.get('pricing_model') or 'free tier'),
            clean_text(clip.content_type or extra.get('content_type') or 'tool'),
            clean_text(extra.get('source_repo') or author or ''),
            clean_text(getattr(clip, 'source_post_url', '') or extra.get('source_url') or ''),
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


def _format_link_formula(url: str, default_label: str = 'Link ↗') -> str:
    """Format a raw URL into a clean Google Sheets =HYPERLINK formula pill."""
    if not url or str(url).strip().lower() in ('none', 'null', '', 'unspecified', '-'):
        return '—'
    url_clean = str(url).strip()
    if url_clean.startswith('//'):
        url_clean = 'https:' + url_clean
    if not url_clean.startswith(('http://', 'https://')):
        return url_clean

    escaped_url = url_clean.replace('"', '""')
    escaped_label = default_label.replace('"', '""')
    return f'=HYPERLINK("{escaped_url}", "{escaped_label}")'



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
                    if data.get('refresh_token'):
                        destination.config['refresh_token'] = data['refresh_token']
                    destination.config['token_refreshed_at'] = timezone.now().isoformat()
                    destination.is_active = True
                    destination.save(update_fields=['config', 'is_active'])
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
                sheet_data = json.loads(response.read().decode())
                new_sheet_id = sheet_data.get('spreadsheetId')
                if new_sheet_id:
                    self._beautify_tab(new_sheet_id, access_token, 'Clips', STANDARD_HEADERS, sheet_id=0)
                return sheet_data
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
        except Exception as exc:
            logger.warning("Google Sheets: failed to read tab headers for %s (%s): %s", spreadsheet_id, tab_name, exc)
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
                except Exception as retry_exc:
                    logger.warning("Google Sheets: failed to query sheet titles after token refresh for %s: %s", spreadsheet_id, retry_exc)

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

        self._beautify_tab(spreadsheet_id, tok, tab_name, headers_to_write)
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
        elif extra.get('deadline'):
            deadline_str = clean_text(str(extra.get('deadline')))

        platform_str = clip.get_source_platform_display() if hasattr(clip, 'get_source_platform_display') else getattr(clip, 'source_platform', 'web')
        author_str = getattr(clip, 'source_author', '') or extra.get('author') or ''
        
        # Native Date/Time formatting for Google Sheets (YYYY-MM-DD HH:MM)
        saved_at_str = clip.created_at.strftime('%Y-%m-%d %H:%M') if getattr(clip, 'created_at', None) else ''

        # Ensure active_headers is populated
        if not active_headers:
            active_headers = CATEGORY_SCHEMAS.get(target_tab, CATEGORY_SCHEMAS['Clips'])['headers']

        cat_fields = extra.get('category_fields') or {}
        company_val = extra.get('company') or cat_fields.get('company') or author_str or ''
        location_val = extra.get('location') or cat_fields.get('location') or ('Remote' if 'remote' in (clip.tags or []) else 'Unspecified')
        salary_val = extra.get('salary') or cat_fields.get('salary') or extra.get('award_amount') or cat_fields.get('award_amount') or 'Not Specified'
        summary_val = extra.get('requirements_summary') or cat_fields.get('requirements_summary') or extra.get('key_takeaways') or cat_fields.get('key_takeaways') or clip.summary or ''

        # Map values aligning with each header in active_headers
        row = []
        for header in active_headers:
            h_clean = header.strip()
            h_lower = h_clean.lower()
            val = (dynamic_row or {}).get(h_clean) or (dynamic_row or {}).get(header)

            if any(k in h_lower for k in ('job link', 'job url', 'application url', 'apply link', 'apply url', 'resource link', 'resource url')):
                extracted_link = (
                    extra.get('job_url')
                    or extra.get('apply_url')
                    or extra.get('extracted_resource_url')
                    or getattr(clip, 'extracted_resource_url', None)
                    or (clip.url if not any(d in (clip.url or '') for d in ('x.com', 'twitter.com', 'linkedin.com/feed')) else None)
                )
                row.append(_format_link_formula(val or extracted_link or clip.url, 'Apply ↗'))
            elif 'source' in h_lower and any(k in h_lower for k in ('url', 'link', 'post')):
                source_link = getattr(clip, 'source_post_url', '') or (clip.url if any(d in (clip.url or '') for d in ('x.com', 'twitter.com', 'linkedin.com')) else '')
                row.append(_format_link_formula(val or source_link, 'Source Post ↗'))
            elif any(k in h_lower for k in ('url', 'link', 'website')):
                row.append(_format_link_formula(val or clip.url, 'Open Link ↗'))
            elif any(k in h_lower for k in ('title', 'name', 'role')):
                raw_t = clean_text(val or clip.title or '')
                row.append(raw_t[:62] + '...' if len(raw_t) > 65 else raw_t)
            elif any(k in h_lower for k in ('saved', 'date')) and 'deadline' not in h_lower:
                row.append(saved_at_str)
            elif 'deadline' in h_lower:
                row.append(clean_text(val or deadline_str or 'Open'))
            elif 'company' in h_lower:
                row.append(clean_text(val or company_val))
            elif 'location' in h_lower or 'remote' in h_lower:
                row.append(clean_text(val or location_val))
            elif any(k in h_lower for k in ('salary', 'comp', 'price', 'award')):
                row.append(clean_text(val or salary_val))
            elif any(k in h_lower for k in ('summary', 'overview', 'description', 'notes', 'takeaway', 'requirement')):
                full_sum = clean_text(val or summary_val)
                preview = full_sum[:95] + '...' if len(full_sum) > 95 else full_sum
                row.append(preview)
            elif 'platform' in h_lower:
                row.append(clean_text(val or platform_str))
            elif any(k in h_lower for k in ('author', 'host', 'organizer', 'sponsor')):
                row.append(clean_text(val or author_str or extra.get('organizer') or extra.get('sponsor') or ''))
            elif 'tag' in h_lower or 'topic' in h_lower:
                raw_tags = clean_text(val or ', '.join(clip.tags or []))
                row.append(raw_tags[:42] + '...' if len(raw_tags) > 45 else raw_tags)
            elif 'type' in h_lower or 'category' in h_lower:
                row.append(clean_text(val or clip.content_type or 'webpage'))
            elif val:
                row.append(clean_text(str(val)))
            else:
                row.append('')

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
                        access_token = refreshed_token
                    except Exception as retry_exc:
                        return ExportResult(success=False, error=f'Google Sheets API retry error: {retry_exc}')
                else:
                    return ExportResult(success=False, error='Google OAuth token expired and refresh failed.')
            else:
                body = exc.read().decode() if exc.fp else str(exc)
                return ExportResult(success=False, error=f'Google Sheets API error: {body}')
        except urllib.error.URLError as exc:
            return ExportResult(success=False, error=f'Google Sheets request failed: {exc}')

        # Ensure tab is beautifully formatted (navy header, banding, frozen row, proper widths, date format)
        self._beautify_tab(spreadsheet_id, access_token, target_tab, active_headers)

        sheet_url = f'https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit#gid=0'
        updated_range = data.get('updates', {}).get('updatedRange', '')
        return ExportResult(success=True, external_url=sheet_url, external_id=updated_range)

    def _format_tab_headers(
        self,
        spreadsheet_id: str,
        access_token: str,
        tab_name: str,
        col_count: int,
        sheet_id: int | None = None,
    ):
        """Backward-compatible wrapper pointing to _beautify_tab."""
        self._beautify_tab(spreadsheet_id, access_token, tab_name, [], sheet_id=sheet_id)

    def _beautify_tab(
        self,
        spreadsheet_id: str,
        access_token: str,
        tab_name: str,
        headers: list[str],
        sheet_id: int | None = None,
    ):
        """
        Apply modern executive-grade dashboard styling to a Google Sheets tab:
        1. Deep Navy (#1A365D) Header with bold white text, Roboto font, centered vertically.
        2. Taller header row height (38px).
        3. Frozen Row 1 so headers remain pinned while scrolling.
        4. Alternating Row Banding (Zebra striping: pure white and soft cool-slate tint).
        5. Data rows vertical alignment (MIDDLE), modern font (Roboto, 10pt), soft borders (#E2E8F0).
        6. Native Date/Time number formatting (yyyy-mm-dd hh:mm) and center alignment for date columns.
        7. Center alignment for status, deadlines, platform, author, and link badge columns.
        8. Auto-resizing all columns + enforcing sensible minimum widths.
        """
        if not access_token or access_token.startswith('mock_') or access_token == 'demo_google_sheets_token':
            return

        col_count = len(headers) if headers else 10
        existing_banded_ranges = []

        try:
            if sheet_id is None:
                meta_req = urllib.request.Request(
                    f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}?fields=sheets(properties(sheetId,title),bandedRanges)',
                    headers={'Authorization': f'Bearer {access_token}'},
                )
                with urllib.request.urlopen(meta_req, timeout=15) as resp:
                    meta = json.loads(resp.read().decode())
                    for s in meta.get('sheets', []):
                        if s.get('properties', {}).get('title') == tab_name:
                            sheet_id = s.get('properties', {}).get('sheetId')
                            existing_banded_ranges = s.get('bandedRanges', [])
                            break

            if sheet_id is None:
                return

            requests = [
                # 1. Header Row (Deep Navy #1A365D, bold white text, Roboto font, vertical MIDDLE)
                {
                    'repeatCell': {
                        'range': {
                            'sheetId': sheet_id,
                            'startRowIndex': 0,
                            'endRowIndex': 1,
                            'startColumnIndex': 0,
                            'endColumnIndex': col_count,
                        },
                        'cell': {
                            'userEnteredFormat': {
                                'backgroundColor': {'red': 0.102, 'green': 0.212, 'blue': 0.365},
                                'textFormat': {
                                    'bold': True,
                                    'foregroundColor': {'red': 1.0, 'green': 1.0, 'blue': 1.0},
                                    'fontSize': 10,
                                    'fontFamily': 'Roboto',
                                },
                                'horizontalAlignment': 'LEFT',
                                'verticalAlignment': 'MIDDLE',
                                'wrapStrategy': 'WRAP',
                                'borders': {
                                    'bottom': {
                                        'style': 'SOLID_MEDIUM',
                                        'color': {'red': 0.06, 'green': 0.14, 'blue': 0.26},
                                    }
                                },
                            }
                        },
                        'fields': 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy,borders)',
                    }
                },
                # 2. Freeze Row 1 & Show Gridlines
                {
                    'updateSheetProperties': {
                        'properties': {
                            'sheetId': sheet_id,
                            'gridProperties': {
                                'frozenRowCount': 1,
                                'hideGridlines': False,
                            },
                        },
                        'fields': 'gridProperties.frozenRowCount,gridProperties.hideGridlines',
                    }
                },
                # 3. Header Row Height = 46px
                {
                    'updateDimensionProperties': {
                        'range': {
                            'sheetId': sheet_id,
                            'dimension': 'ROWS',
                            'startIndex': 0,
                            'endIndex': 1,
                        },
                        'properties': {'pixelSize': 46},
                        'fields': 'pixelSize',
                    }
                },
                # 3b. Data Rows Height = 44px (generous breathing room, never tight or cramped)
                {
                    'updateDimensionProperties': {
                        'range': {
                            'sheetId': sheet_id,
                            'dimension': 'ROWS',
                            'startIndex': 1,
                            'endIndex': 200,
                        },
                        'properties': {'pixelSize': 44},
                        'fields': 'pixelSize',
                    }
                },
                # 4. Base Data Rows Styling (Font Roboto 10pt, vertical MIDDLE, subtle borders #E2E8F0)
                {
                    'repeatCell': {
                        'range': {
                            'sheetId': sheet_id,
                            'startRowIndex': 1,
                            'startColumnIndex': 0,
                            'endColumnIndex': col_count,
                        },
                        'cell': {
                            'userEnteredFormat': {
                                'textFormat': {
                                    'fontSize': 10,
                                    'fontFamily': 'Roboto',
                                    'foregroundColor': {'red': 0.12, 'green': 0.16, 'blue': 0.22},
                                },
                                'verticalAlignment': 'MIDDLE',
                                'wrapStrategy': 'CLIP',
                                'borders': {
                                    'top': {
                                        'style': 'SOLID',
                                        'color': {'red': 0.886, 'green': 0.910, 'blue': 0.941},
                                    },
                                    'bottom': {
                                        'style': 'SOLID',
                                        'color': {'red': 0.886, 'green': 0.910, 'blue': 0.941},
                                    },
                                    'right': {
                                        'style': 'SOLID',
                                        'color': {'red': 0.886, 'green': 0.910, 'blue': 0.941},
                                    },
                                },
                            }
                        },
                        'fields': 'userEnteredFormat(textFormat,verticalAlignment,wrapStrategy,borders)',
                    }
                },
                # 5. Auto-Resize Columns
                {
                    'autoResizeDimensions': {
                        'dimensions': {
                            'sheetId': sheet_id,
                            'dimension': 'COLUMNS',
                            'startIndex': 0,
                            'endIndex': col_count,
                        }
                    }
                },
            ]

            # Retroactively format existing rows in this tab:
            # 1. Turn raw URLs into clean =HYPERLINK("...", "Link ↗")
            # 2. Attach full text to cell note (so hovering shows the full summary) and truncate cell preview
            try:
                val_url = f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{urllib.parse.quote(tab_name)}!A1:Z100?valueRenderOption=FORMULA'
                val_req = urllib.request.Request(val_url, headers={'Authorization': f'Bearer {access_token}'})
                with urllib.request.urlopen(val_req, timeout=15) as val_resp:
                    val_data = json.loads(val_resp.read().decode())
                    tab_rows = val_data.get('values', [])

                if tab_rows and len(tab_rows) > 1:
                    tab_headers = [str(h).strip().lower() for h in tab_rows[0]]
                    u_col = None
                    s_col = None
                    p_col = None
                    t_col = None
                    tag_col = None
                    for idx, h in enumerate(tab_headers):
                        if h == 'url' or ('link' in h and 'parent' not in h and 'hub' not in h and 'source' not in h):
                            u_col = idx
                        elif any(k in h for k in ('summary', 'overview', 'description', 'notes', 'takeaway')):
                            s_col = idx
                        elif 'parent' in h or 'hub' in h or 'source' in h:
                            p_col = idx
                        elif any(k in h for k in ('title', 'name', 'role')):
                            t_col = idx
                        elif 'tag' in h or 'topic' in h:
                            tag_col = idx

                    note_reqs = []
                    modified = False
                    for r_i in range(1, len(tab_rows)):
                        r = tab_rows[r_i]
                        # 1. URL Link Pill
                        if u_col is not None and len(r) > u_col:
                            raw_u = str(r[u_col]).strip()
                            if raw_u.startswith(('http://', 'https://', '//')):
                                r[u_col] = _format_link_formula(raw_u, 'Link ↗')
                                modified = True
                        # 2. Parent / Source Link Pill
                        if p_col is not None and len(r) > p_col:
                            raw_p = str(r[p_col]).strip()
                            if raw_p.startswith(('http://', 'https://', '//')):
                                r[p_col] = _format_link_formula(raw_p, 'Source ↗')
                                modified = True
                        # 3. Title (Hover Note + Clean Preview)
                        if t_col is not None and len(r) > t_col:
                            full_title = str(r[t_col]).strip()
                            if full_title and not full_title.startswith('='):
                                note_reqs.append({
                                    'repeatCell': {
                                        'range': {
                                            'sheetId': sheet_id,
                                            'startRowIndex': r_i,
                                            'endRowIndex': r_i + 1,
                                            'startColumnIndex': t_col,
                                            'endColumnIndex': t_col + 1,
                                        },
                                        'cell': {'note': f"Full Title:\n{full_title}"},
                                        'fields': 'note',
                                    }
                                })
                                clean_t = ' '.join(full_title.split())
                                if len(clean_t) > 65:
                                    clean_t = clean_t[:62] + '...'
                                if clean_t != full_title:
                                    r[t_col] = clean_t
                                    modified = True
                        # 4. Summary (Hover Note + Clean 1-Line Preview)
                        if s_col is not None and len(r) > s_col:
                            full_s = str(r[s_col]).strip()
                            if full_s and not full_s.startswith('='):
                                note_reqs.append({
                                    'repeatCell': {
                                        'range': {
                                            'sheetId': sheet_id,
                                            'startRowIndex': r_i,
                                            'endRowIndex': r_i + 1,
                                            'startColumnIndex': s_col,
                                            'endColumnIndex': s_col + 1,
                                        },
                                        'cell': {'note': f"Full AI Summary:\n{full_s}"},
                                        'fields': 'note',
                                    }
                                })
                                clean_s = ' '.join(full_s.split())
                                if len(clean_s) > 95:
                                    clean_s = clean_s[:92] + '...'
                                if clean_s != full_s:
                                    r[s_col] = clean_s
                                    modified = True
                        # 5. Tags (Hover Note + Clean Preview)
                        if tag_col is not None and len(r) > tag_col:
                            full_tags = str(r[tag_col]).strip()
                            if full_tags and not full_tags.startswith('='):
                                note_reqs.append({
                                    'repeatCell': {
                                        'range': {
                                            'sheetId': sheet_id,
                                            'startRowIndex': r_i,
                                            'endRowIndex': r_i + 1,
                                            'startColumnIndex': tag_col,
                                            'endColumnIndex': tag_col + 1,
                                        },
                                        'cell': {'note': f"All Extracted Tags:\n{full_tags}"},
                                        'fields': 'note',
                                    }
                                })
                                clean_tags = ' '.join(full_tags.split())
                                if len(clean_tags) > 45:
                                    clean_tags = clean_tags[:42] + '...'
                                if clean_tags != full_tags:
                                    r[tag_col] = clean_tags
                                    modified = True

                    if modified:
                        put_url = f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{urllib.parse.quote(tab_name)}!A1:Z{len(tab_rows)}?valueInputOption=USER_ENTERED'
                        put_req = urllib.request.Request(
                            put_url,
                            data=json.dumps({'values': tab_rows}).encode(),
                            headers={'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'},
                            method='PUT',
                        )
                        with urllib.request.urlopen(put_req, timeout=15):
                            pass

                    if note_reqs:
                        requests.extend(note_reqs)
            except Exception as scan_err:
                logger.info('Retroactive row scan in beautify skipped: %s', scan_err)

            # 6. Column-specific formatting (Dates, Deadlines, Links, Platform, Minimum widths)
            for idx, h in enumerate(headers):
                h_clean = str(h).strip().lower()

                # Built-in Date/Time formatting for Saved At / Date columns
                if ('saved' in h_clean or 'date' in h_clean) and 'deadline' not in h_clean:
                    requests.append({
                        'repeatCell': {
                            'range': {
                                'sheetId': sheet_id,
                                'startRowIndex': 1,
                                'startColumnIndex': idx,
                                'endColumnIndex': idx + 1,
                            },
                            'cell': {
                                'userEnteredFormat': {
                                    'numberFormat': {
                                        'type': 'DATE_TIME',
                                        'pattern': 'yyyy-mm-dd hh:mm',
                                    },
                                    'horizontalAlignment': 'CENTER',
                                }
                            },
                            'fields': 'userEnteredFormat(numberFormat,horizontalAlignment)',
                        }
                    })
                    requests.append({
                        'updateDimensionProperties': {
                            'range': {
                                'sheetId': sheet_id,
                                'dimension': 'COLUMNS',
                                'startIndex': idx,
                                'endIndex': idx + 1,
                            },
                            'properties': {'pixelSize': 140},
                            'fields': 'pixelSize',
                        }
                    })
                elif 'deadline' in h_clean:
                    requests.append({
                        'repeatCell': {
                            'range': {
                                'sheetId': sheet_id,
                                'startRowIndex': 1,
                                'startColumnIndex': idx,
                                'endColumnIndex': idx + 1,
                            },
                            'cell': {
                                'userEnteredFormat': {
                                    'horizontalAlignment': 'CENTER',
                                }
                            },
                            'fields': 'userEnteredFormat(horizontalAlignment)',
                        }
                    })
                    requests.append({
                        'updateDimensionProperties': {
                            'range': {
                                'sheetId': sheet_id,
                                'dimension': 'COLUMNS',
                                'startIndex': idx,
                                'endIndex': idx + 1,
                            },
                            'properties': {'pixelSize': 120},
                            'fields': 'pixelSize',
                        }
                    })
                elif any(k in h_clean for k in ('url', 'link')):
                    requests.append({
                        'repeatCell': {
                            'range': {
                                'sheetId': sheet_id,
                                'startRowIndex': 1,
                                'startColumnIndex': idx,
                                'endColumnIndex': idx + 1,
                            },
                            'cell': {
                                'userEnteredFormat': {
                                    'horizontalAlignment': 'CENTER',
                                }
                            },
                            'fields': 'userEnteredFormat(horizontalAlignment)',
                        }
                    })
                    requests.append({
                        'updateDimensionProperties': {
                            'range': {
                                'sheetId': sheet_id,
                                'dimension': 'COLUMNS',
                                'startIndex': idx,
                                'endIndex': idx + 1,
                            },
                            'properties': {'pixelSize': 130},
                            'fields': 'pixelSize',
                        }
                    })
                elif 'platform' in h_clean or 'author' in h_clean:
                    requests.append({
                        'repeatCell': {
                            'range': {
                                'sheetId': sheet_id,
                                'startRowIndex': 1,
                                'startColumnIndex': idx,
                                'endColumnIndex': idx + 1,
                            },
                            'cell': {
                                'userEnteredFormat': {
                                    'horizontalAlignment': 'CENTER',
                                }
                            },
                            'fields': 'userEnteredFormat(horizontalAlignment)',
                        }
                    })
                    requests.append({
                        'updateDimensionProperties': {
                            'range': {
                                'sheetId': sheet_id,
                                'dimension': 'COLUMNS',
                                'startIndex': idx,
                                'endIndex': idx + 1,
                            },
                            'properties': {'pixelSize': 130},
                            'fields': 'pixelSize',
                        }
                    })
                elif any(k in h_clean for k in ('title', 'name', 'role')):
                    requests.append({
                        'updateDimensionProperties': {
                            'range': {
                                'sheetId': sheet_id,
                                'dimension': 'COLUMNS',
                                'startIndex': idx,
                                'endIndex': idx + 1,
                            },
                            'properties': {'pixelSize': 220},
                            'fields': 'pixelSize',
                        }
                    })
                elif any(k in h_clean for k in ('summary', 'requirement', 'overview', 'notes', 'takeaway')):
                    requests.append({
                        'updateDimensionProperties': {
                            'range': {
                                'sheetId': sheet_id,
                                'dimension': 'COLUMNS',
                                'startIndex': idx,
                                'endIndex': idx + 1,
                            },
                            'properties': {'pixelSize': 280},
                            'fields': 'pixelSize',
                        }
                    })
                elif any(k in h_clean for k in ('company', 'organizer', 'sponsor', 'location', 'remote')):
                    requests.append({
                        'updateDimensionProperties': {
                            'range': {
                                'sheetId': sheet_id,
                                'dimension': 'COLUMNS',
                                'startIndex': idx,
                                'endIndex': idx + 1,
                            },
                            'properties': {'pixelSize': 150},
                            'fields': 'pixelSize',
                        }
                    })
                elif any(k in h_clean for k in ('salary', 'comp', 'price', 'award')):
                    requests.append({
                        'repeatCell': {
                            'range': {
                                'sheetId': sheet_id,
                                'startRowIndex': 1,
                                'startColumnIndex': idx,
                                'endColumnIndex': idx + 1,
                            },
                            'cell': {
                                'userEnteredFormat': {
                                    'horizontalAlignment': 'CENTER',
                                }
                            },
                            'fields': 'userEnteredFormat(horizontalAlignment)',
                        }
                    })
                    requests.append({
                        'updateDimensionProperties': {
                            'range': {
                                'sheetId': sheet_id,
                                'dimension': 'COLUMNS',
                                'startIndex': idx,
                                'endIndex': idx + 1,
                            },
                            'properties': {'pixelSize': 130},
                            'fields': 'pixelSize',
                        }
                    })

            # 7. Alternating Row Banding (Zebra striping)
            if not existing_banded_ranges:
                requests.append({
                    'addBanding': {
                        'bandedRange': {
                            'range': {
                                'sheetId': sheet_id,
                                'startRowIndex': 0,
                                'startColumnIndex': 0,
                                'endColumnIndex': col_count,
                            },
                            'rowProperties': {
                                'headerColor': {'red': 0.102, 'green': 0.212, 'blue': 0.365},
                                'firstBandColor': {'red': 1.0, 'green': 1.0, 'blue': 1.0},
                                'secondBandColor': {'red': 0.957, 'green': 0.969, 'blue': 0.984},
                            },
                        }
                    }
                })

            batch_req = urllib.request.Request(
                f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}:batchUpdate',
                data=json.dumps({'requests': requests}).encode(),
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json',
                },
                method='POST',
            )
            with urllib.request.urlopen(batch_req, timeout=20):
                logger.info('Successfully applied modern dashboard styling to tab %s in Google Sheet %s', tab_name, spreadsheet_id)
        except urllib.error.HTTPError as h_err:
            err_msg = h_err.read().decode() if h_err.fp else str(h_err)
            if any(k in err_msg.lower() for k in ('banded', 'already exists', 'alternating background', 'addbanding')) :
                try:
                    retry_requests = [r for r in requests if 'addBanding' not in r]
                    retry_req = urllib.request.Request(
                        f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}:batchUpdate',
                        data=json.dumps({'requests': retry_requests}).encode(),
                        headers={
                            'Authorization': f'Bearer {access_token}',
                            'Content-Type': 'application/json',
                        },
                        method='POST',
                    )
                    with urllib.request.urlopen(retry_req, timeout=20):
                        logger.info('Applied styling without duplicate banding to tab %s', tab_name)
                except Exception as retry_err:
                    logger.warning('Retry formatting failed for tab %s: %s', tab_name, retry_err)
            else:
                logger.warning('Failed beautifying tab %s (HTTP %s): %s', tab_name, h_err.code, err_msg)
        except Exception as exc:
            logger.warning('Failed beautifying tab %s: %s', tab_name, exc)

    def beautify_all_tabs(self, destination, spreadsheet_id: str | None = None) -> dict:
        """
        Retroactively apply executive dashboard styling to every tab in the connected Google Sheet.
        """
        access_token = destination.config.get('access_token')
        sheet_id_target = spreadsheet_id or destination.config.get('spreadsheet_id')
        if not access_token and destination.config.get('refresh_token'):
            access_token = self._refresh_access_token(destination)
        if not access_token or not sheet_id_target:
            return {'success': False, 'error': 'Missing access token or spreadsheet_id'}

        try:
            meta_req = urllib.request.Request(
                f'https://sheets.googleapis.com/v4/spreadsheets/{sheet_id_target}?fields=sheets(properties(sheetId,title))',
                headers={'Authorization': f'Bearer {access_token}'},
            )
            with urllib.request.urlopen(meta_req, timeout=20) as resp:
                meta = json.loads(resp.read().decode())

            beautified = []
            for s in meta.get('sheets', []):
                t_name = s.get('properties', {}).get('title')
                s_id = s.get('properties', {}).get('sheetId')
                headers = self._get_existing_tab_headers(sheet_id_target, access_token, t_name)
                if not headers:
                    headers = CATEGORY_SCHEMAS.get(t_name, CATEGORY_SCHEMAS['Clips'])['headers']
                self._beautify_tab(sheet_id_target, access_token, t_name, headers, sheet_id=s_id)
                beautified.append(t_name)

            return {'success': True, 'beautified_tabs': beautified}
        except Exception as exc:
            logger.error('Failed to beautify all tabs for sheet %s: %s', sheet_id_target, exc)
            return {'success': False, 'error': str(exc)}

    def batch_export_tools(
        self,
        destination,
        resources: list[dict],
        source_url: str = '',
        source_repo: str = '',
        saved_at_str: str = '',
    ) -> ExportResult:
        """
        Batch export all individual resources from a list repository to the "Tools" tab in Google Sheets.
        Uses a single values_append batch call with modern formatting.
        """
        if not resources:
            return ExportResult(success=True, external_url='', external_id='')

        access_token = destination.config.get('access_token')
        spreadsheet_id = destination.config.get('spreadsheet_id')

        # Dev / Demo mode check
        if not access_token or access_token.startswith('mock_') or access_token == 'demo_google_sheets_token':
            logger.info('Dev/Demo Mode: Simulated batch Tools export of %d items to Google Sheets', len(resources))
            return ExportResult(
                success=True,
                external_url='https://docs.google.com/spreadsheets/d/1BxiMVs0XRon539e0-vA28VPb3znu82345/edit',
                external_id=f'Tools!A1:I{len(resources)+1}',
            )

        if not access_token and destination.config.get('refresh_token'):
            access_token = self._refresh_access_token(destination)

        if not spreadsheet_id and access_token:
            result = self._create_spreadsheet(access_token)
            if result:
                spreadsheet_id = result.get('spreadsheetId')
                destination.config['spreadsheet_id'] = spreadsheet_id
                destination.save(update_fields=['config'])

        if not spreadsheet_id:
            return ExportResult(success=False, error='Missing Google Sheets spreadsheet_id.')

        # Ensure "Tools" tab exists
        target_tab = 'Tools'
        tools_schema = CATEGORY_SCHEMAS['Tools']
        headers = tools_schema['headers']

        _, access_token, _ = self._ensure_category_tab(
            spreadsheet_id,
            access_token,
            target_tab,
            dynamic_headers=headers,
            destination=destination,
        )

        # Build all rows
        rows = []
        for r in resources:
            row = [
                clean_text(r.get('name') or ''),
                _format_link_formula(r.get('url') or '', 'Website ↗'),
                clean_text(r.get('description') or ''),
                clean_text(r.get('section') or 'General'),
                clean_text(r.get('pricing') or 'free tier'),
                clean_text(r.get('content_type') or 'tool'),
                clean_text(r.get('source_repo') or source_repo or ''),
                _format_link_formula(r.get('source_url') or source_url or '', 'Repo ↗'),
                saved_at_str or r.get('saved_at') or '',
            ]
            rows.append(row)

        end_col = _col_letter(len(headers))
        range_name = urllib.parse.quote(f'{target_tab}!A:{end_col}')
        url = (
            f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/'
            f'{range_name}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS'
        )

        def _append_batch(tok: str):
            req = urllib.request.Request(
                url,
                data=json.dumps({'values': rows}).encode(),
                headers={
                    'Authorization': f'Bearer {tok}',
                    'Content-Type': 'application/json',
                },
                method='POST',
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode())

        try:
            data = _append_batch(access_token)
        except urllib.error.HTTPError as exc:
            if (exc.code == 401 or exc.code == 400) and destination.config.get('refresh_token'):
                refreshed_token = self._refresh_access_token(destination)
                if refreshed_token:
                    try:
                        data = _append_batch(refreshed_token)
                        access_token = refreshed_token
                    except Exception as retry_exc:
                        return ExportResult(success=False, error=f'Batch append retry error: {retry_exc}')
                else:
                    return ExportResult(success=False, error='Google OAuth token expired.')
            else:
                body = exc.read().decode() if exc.fp else str(exc)
                return ExportResult(success=False, error=f'Google Sheets API error: {body}')
        except Exception as exc:
            return ExportResult(success=False, error=f'Google Sheets batch request failed: {exc}')

        # Format header row and auto-resize
        self._beautify_tab(spreadsheet_id, access_token, target_tab, headers)

        sheet_url = f'https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit#gid=0'
        updated_range = data.get('updates', {}).get('updatedRange', '')
        return ExportResult(success=True, external_url=sheet_url, external_id=updated_range)
