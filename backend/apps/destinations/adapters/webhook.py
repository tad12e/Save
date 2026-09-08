"""
Webhook Destination Adapter for Save.
Dispatches saved clips as structured JSON payloads to external webhook endpoints
(Zapier, Make.com, n8n, Slack, Discord, or custom servers).
Supports optional HMAC-SHA256 signatures and Bearer token authentication.
"""

import hashlib
import hmac
import json
import logging
import time
import urllib.error
import urllib.request
import uuid
from django.utils import timezone

from .base import BaseDestinationAdapter, ExportResult

logger = logging.getLogger(__name__)


class WebhookAdapter(BaseDestinationAdapter):
    provider = 'webhook'

    @staticmethod
    def _resolve_endpoint_url(destination) -> str:
        config = destination.config or {}
        url = (
            config.get('endpoint_url')
            or config.get('webhook_url')
            or config.get('url')
            or config.get('target_resource_name')
            or ''
        ).strip()
        return url

    def export_clip(self, clip, destination) -> ExportResult:
        endpoint_url = self._resolve_endpoint_url(destination)
        if not endpoint_url or not endpoint_url.startswith(('http://', 'https://')):
            return ExportResult(
                success=False,
                error="Webhook destination is missing a valid HTTP/HTTPS endpoint_url in its configuration.",
            )

        config = destination.config or {}
        event_id = str(uuid.uuid4())

        payload = {
            'event': 'clip.created',
            'event_id': event_id,
            'timestamp': timezone.now().isoformat(),
            'destination': {
                'id': str(destination.id),
                'name': destination.name,
            },
            'clip': {
                'id': str(clip.id),
                'url': clip.url,
                'title': clip.title or clip.url,
                'summary': clip.summary or '',
                'selected_text': clip.selected_text or '',
                'content_type': clip.content_type or 'webpage',
                'intent': getattr(clip, 'intent', 'other') or 'other',
                'tags': clip.tags or [],
                'source_platform': clip.source_platform or 'web',
                'source_author': clip.source_author or '',
                'source_post_url': clip.source_post_url or clip.url,
                'deadline_date': clip.deadline_date.isoformat() if getattr(clip, 'deadline_date', None) else None,
                'created_at': clip.created_at.isoformat() if clip.created_at else None,
                'extra_metadata': clip.extra_metadata or {},
            },
        }

        data_bytes = json.dumps(payload, ensure_ascii=False).encode('utf-8')

        headers = {
            'Content-Type': 'application/json; charset=utf-8',
            'User-Agent': 'Save-Webhook-Dispatcher/1.0 (+https://save.app)',
            'X-Save-Event': 'clip.created',
            'X-Save-Delivery': event_id,
        }

        # Optional Bearer Token authentication
        auth_token = config.get('auth_token') or config.get('token') or config.get('api_key')
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'

        # Optional HMAC-SHA256 Signature
        secret = config.get('webhook_secret') or config.get('secret')
        if secret:
            sig = hmac.new(secret.encode('utf-8'), data_bytes, hashlib.sha256).hexdigest()
            headers['X-Save-Signature'] = f'sha256={sig}'

        req = urllib.request.Request(
            endpoint_url,
            data=data_bytes,
            headers=headers,
            method='POST',
        )

        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                status_code = response.status
                if 200 <= status_code < 300:
                    logger.info("Webhook clip export succeeded to %s (HTTP %d)", endpoint_url, status_code)
                    return ExportResult(
                        success=True,
                        external_url=endpoint_url,
                        external_id=event_id,
                    )
                return ExportResult(
                    success=False,
                    error=f"Webhook endpoint returned unexpected HTTP status {status_code}.",
                )
        except urllib.error.HTTPError as exc:
            body = exc.read().decode('utf-8', errors='ignore')[:250]
            logger.warning("Webhook export HTTP error %d: %s", exc.code, body)
            return ExportResult(
                success=False,
                error=f"Webhook endpoint returned HTTP {exc.code}: {body}",
            )
        except urllib.error.URLError as exc:
            logger.warning("Webhook export network connection error: %s", exc.reason)
            return ExportResult(
                success=False,
                error=f"Failed to connect to webhook endpoint: {exc.reason}",
            )
        except Exception as exc:
            logger.exception("Webhook export unexpected exception: %s", exc)
            return ExportResult(
                success=False,
                error=f"Webhook dispatch error: {str(exc)}",
            )

    def ping(self, destination) -> dict:
        """
        Sends a test ping event to verify webhook reachability and response latency.
        """
        endpoint_url = self._resolve_endpoint_url(destination)
        if not endpoint_url or not endpoint_url.startswith(('http://', 'https://')):
            return {
                'success': False,
                'error': 'Missing or invalid endpoint URL in destination configuration.',
            }

        config = destination.config or {}
        ping_id = str(uuid.uuid4())
        payload = {
            'event': 'ping',
            'delivery_id': ping_id,
            'timestamp': timezone.now().isoformat(),
            'message': 'Save Webhook connection verified OK.',
            'destination_id': str(destination.id),
            'destination_name': destination.name,
        }
        data_bytes = json.dumps(payload).encode('utf-8')

        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Save-Webhook-Dispatcher/1.0',
            'X-Save-Event': 'ping',
        }
        auth_token = config.get('auth_token') or config.get('token')
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'

        secret = config.get('webhook_secret') or config.get('secret')
        if secret:
            sig = hmac.new(secret.encode('utf-8'), data_bytes, hashlib.sha256).hexdigest()
            headers['X-Save-Signature'] = f'sha256={sig}'

        req = urllib.request.Request(endpoint_url, data=data_bytes, headers=headers, method='POST')
        start_time = time.time()
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                latency_ms = int((time.time() - start_time) * 1000)
                return {
                    'success': 200 <= resp.status < 300,
                    'status_code': resp.status,
                    'latency_ms': latency_ms,
                    'message': f"Webhook verified successfully (HTTP {resp.status}, {latency_ms}ms)",
                }
        except urllib.error.HTTPError as exc:
            latency_ms = int((time.time() - start_time) * 1000)
            return {
                'success': False,
                'status_code': exc.code,
                'latency_ms': latency_ms,
                'error': f"Webhook responded with HTTP {exc.code}",
            }
        except Exception as exc:
            return {
                'success': False,
                'error': f"Webhook connection failed: {str(exc)}",
            }
