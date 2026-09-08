"""
Airtable Destination Adapter for Save.
Exports saved clips into user Airtable Bases and Tables via the Airtable Web API.
Supports Personal Access Tokens (PAT) and OAuth tokens with typecasting.
"""

import json
import logging
import time
import urllib.error
import urllib.parse
import urllib.request
from django.utils import timezone

from .base import BaseDestinationAdapter, ExportResult

logger = logging.getLogger(__name__)


class AirtableAdapter(BaseDestinationAdapter):
    provider = 'airtable'

    @staticmethod
    def _get_credentials(destination) -> tuple[str, str, str]:
        """
        Extracts token, base_id, and table_name from destination config.
        """
        config = destination.config or {}
        token = (
            config.get('access_token')
            or config.get('airtable_token')
            or config.get('api_key')
            or ''
        ).strip()
        base_id = (
            config.get('base_id')
            or config.get('target_resource_id')
            or ''
        ).strip()
        table_name = (
            config.get('table_name')
            or config.get('table_id')
            or config.get('target_table_name')
            or config.get('target_resource_name')
            or 'Clips'
        ).strip()
        return token, base_id, table_name

    def export_clip(self, clip, destination) -> ExportResult:
        token, base_id, table_name = self._get_credentials(destination)

        if not token:
            return ExportResult(
                success=False,
                error="Airtable destination is missing access_token (Personal Access Token).",
            )
        if not base_id:
            return ExportResult(
                success=False,
                error="Airtable destination is missing base_id (e.g. appXXXXXXXXXXXXXX).",
            )

        encoded_table = urllib.parse.quote(table_name)
        api_url = f"https://api.airtable.com/v0/{base_id}/{encoded_table}"

        fields = {
            'Title': (clip.title or clip.url)[:255],
            'URL': clip.url,
            'Summary': (clip.summary or '')[:10000],
            'Category': clip.content_type or 'webpage',
            'Intent': getattr(clip, 'intent', 'other') or 'other',
            'Tags': ', '.join(clip.tags or []) if clip.tags else '',
            'Platform': clip.source_platform or 'web',
            'Author': clip.source_author or '',
            'Date Saved': clip.created_at.strftime('%Y-%m-%d') if clip.created_at else timezone.now().strftime('%Y-%m-%d'),
        }
        if getattr(clip, 'deadline_date', None):
            fields['Deadline'] = clip.deadline_date.isoformat()

        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'User-Agent': 'Save-Airtable-Adapter/1.0 (+https://save.app)',
        }

        body = {
            'records': [{'fields': fields}],
            'typecast': True,
        }
        data_bytes = json.dumps(body).encode('utf-8')

        req = urllib.request.Request(api_url, data=data_bytes, headers=headers, method='POST')

        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                records = res_data.get('records', [])
                if records:
                    record_id = records[0].get('id', '')
                    external_url = f"https://airtable.com/{base_id}/{encoded_table}/{record_id}"
                    logger.info("Airtable export succeeded for clip %s -> %s", clip.id, record_id)
                    return ExportResult(
                        success=True,
                        external_url=external_url,
                        external_id=record_id,
                    )
                return ExportResult(
                    success=True,
                    external_url=f"https://airtable.com/{base_id}/{encoded_table}",
                    external_id='',
                )

        except urllib.error.HTTPError as exc:
            err_body = exc.read().decode('utf-8', errors='ignore')
            logger.warning("Airtable API error (HTTP %d): %s", exc.code, err_body)

            # Check for missing table / schema mismatch and attempt fallback with standard Name/Notes columns
            if exc.code == 422:
                try:
                    fallback_body = {
                        'records': [{
                            'fields': {
                                'Name': (clip.title or clip.url)[:255],
                                'Notes': f"{clip.url}\n\n{clip.summary or ''}",
                            }
                        }],
                        'typecast': True,
                    }
                    fallback_req = urllib.request.Request(
                        api_url,
                        data=json.dumps(fallback_body).encode('utf-8'),
                        headers=headers,
                        method='POST',
                    )
                    with urllib.request.urlopen(fallback_req, timeout=12) as fb_resp:
                        fb_data = json.loads(fb_resp.read().decode('utf-8'))
                        fb_records = fb_data.get('records', [])
                        if fb_records:
                            fb_id = fb_records[0].get('id', '')
                            return ExportResult(
                                success=True,
                                external_url=f"https://airtable.com/{base_id}/{encoded_table}/{fb_id}",
                                external_id=fb_id,
                            )
                except Exception as fb_exc:
                    logger.debug("Airtable fallback attempt also failed: %s", fb_exc)

            try:
                err_json = json.loads(err_body)
                error_msg = err_json.get('error', {}).get('message', err_body)
            except Exception:
                error_msg = err_body[:200]

            return ExportResult(
                success=False,
                error=f"Airtable HTTP {exc.code}: {error_msg}",
            )
        except urllib.error.URLError as exc:
            logger.warning("Airtable connection error: %s", exc.reason)
            return ExportResult(
                success=False,
                error=f"Failed to connect to Airtable API: {exc.reason}",
            )
        except Exception as exc:
            logger.exception("Unexpected error exporting to Airtable: %s", exc)
            return ExportResult(
                success=False,
                error=f"Airtable export failed: {str(exc)}",
            )

    def ping(self, destination) -> dict:
        """
        Tests connection to Airtable Base and Table by querying the first record.
        """
        token, base_id, table_name = self._get_credentials(destination)
        if not token:
            return {'success': False, 'error': 'Missing Airtable token.'}
        if not base_id:
            return {'success': False, 'error': 'Missing Airtable base_id.'}

        encoded_table = urllib.parse.quote(table_name)
        api_url = f"https://api.airtable.com/v0/{base_id}/{encoded_table}?maxRecords=1"
        headers = {
            'Authorization': f'Bearer {token}',
            'User-Agent': 'Save-Airtable-Adapter/1.0',
        }
        req = urllib.request.Request(api_url, headers=headers, method='GET')
        start_time = time.time()
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                latency_ms = int((time.time() - start_time) * 1000)
                return {
                    'success': True,
                    'status_code': resp.status,
                    'latency_ms': latency_ms,
                    'message': f"Airtable connection verified OK to base '{base_id}' / table '{table_name}'.",
                }
        except urllib.error.HTTPError as exc:
            latency_ms = int((time.time() - start_time) * 1000)
            err_text = exc.read().decode('utf-8', errors='ignore')[:200]
            return {
                'success': False,
                'status_code': exc.code,
                'latency_ms': latency_ms,
                'error': f"Airtable HTTP {exc.code}: {err_text}",
            }
        except Exception as exc:
            return {'success': False, 'error': f"Airtable ping failed: {str(exc)}"}
