import json
import logging
import urllib.error
import urllib.request

from .base import BaseDestinationAdapter, ExportResult

logger = logging.getLogger(__name__)


class NotionAdapter(BaseDestinationAdapter):
    provider = 'notion'

    def _create_database(self, token: str, parent_page_id: str, title: str = 'Clipper Database') -> dict | None:
        """Create a new Notion database under the given parent page. Returns database metadata dict."""
        payload = {
            'parent': {'type': 'page_id', 'page_id': parent_page_id},
            'title': [{'type': 'text', 'text': {'content': title}}],
            'properties': {
                'Name': {'title': {}},
                'URL': {'url': {}},
                'Summary': {'rich_text': {}},
                'Type': {'select': {
                    'options': [
                        {'name': 'job', 'color': 'blue'},
                        {'name': 'scholarship', 'color': 'green'},
                        {'name': 'article', 'color': 'yellow'},
                        {'name': 'music', 'color': 'pink'},
                        {'name': 'event', 'color': 'orange'},
                        {'name': 'course', 'color': 'purple'},
                        {'name': 'webpage', 'color': 'gray'},
                    ]
                }},
                'Tags': {'multi_select': {}},
                'Deadline': {'date': {}},
            },
        }

        request = urllib.request.Request(
            'https://api.notion.com/v1/databases',
            data=json.dumps(payload).encode(),
            headers={
                'Authorization': f'Bearer {token}',
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            method='POST',
        )

        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                return json.loads(response.read().decode())
        except (urllib.error.HTTPError, urllib.error.URLError) as exc:
            logger.error('Failed to create Notion database: %s', exc)
            return None

    def export_clip(self, clip, destination) -> ExportResult:
        token = destination.config.get('notion_token') or destination.config.get('integration_token')
        database_id = destination.config.get('database_id')

        if not token:
            return ExportResult(
                success=False,
                error='Notion destination is missing integration_token.',
            )

        # Auto-create a new database if requested
        if destination.config.get('create_new') and not database_id:
            parent_page_id = destination.config.get('parent_page_id')
            if not parent_page_id:
                return ExportResult(
                    success=False,
                    error='Notion auto-create requires a parent_page_id in config.',
                )

            result = self._create_database(token, parent_page_id)
            if result:
                database_id = result.get('id')
                destination.config['database_id'] = database_id
                destination.config['create_new'] = False
                destination.save(update_fields=['config'])
                logger.info('Auto-created Notion database: %s', database_id)
            else:
                return ExportResult(success=False, error='Failed to auto-create Notion database.')

        if not database_id:
            return ExportResult(
                success=False,
                error='Notion destination is missing database_id.',
            )

        payload = {
            'parent': {'database_id': database_id},
            'properties': {
                'Name': {
                    'title': [{'text': {'content': (clip.title or clip.url)[:2000]}}],
                },
                'URL': {'url': clip.url},
                'Summary': {
                    'rich_text': [{'text': {'content': (clip.summary or clip.selected_text or '')[:2000]}}],
                },
                'Type': {'select': {'name': clip.content_type or 'webpage'}},
                'Tags': {'multi_select': [{'name': t} for t in (clip.tags or [])[:6]]},
            },
        }

        # Add deadline date property if available
        if hasattr(clip, 'deadline_date') and clip.deadline_date:
            payload['properties']['Deadline'] = {
                'date': {'start': clip.deadline_date.strftime('%Y-%m-%d')},
            }

        children = []
        summary = clip.summary or clip.selected_text or ''
        if summary:
            children.append({
                'object': 'block',
                'type': 'paragraph',
                'paragraph': {
                    'rich_text': [{'type': 'text', 'text': {'content': summary[:2000]}}],
                },
            })

        children.append({
            'object': 'block',
            'type': 'paragraph',
            'paragraph': {
                'rich_text': [{'type': 'text', 'text': {'content': f'Source: {clip.url}'}}],
            },
        })

        if clip.tags:
            children.append({
                'object': 'block',
                'type': 'paragraph',
                'paragraph': {
                    'rich_text': [{
                        'type': 'text',
                        'text': {'content': f'Tags: {", ".join(clip.tags)}'},
                    }],
                },
            })

        if children:
            payload['children'] = children

        request = urllib.request.Request(
            'https://api.notion.com/v1/pages',
            data=json.dumps(payload).encode(),
            headers={
                'Authorization': f'Bearer {token}',
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            method='POST',
        )

        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                data = json.loads(response.read().decode())
        except urllib.error.HTTPError as exc:
            body = exc.read().decode() if exc.fp else str(exc)
            return ExportResult(success=False, error=f'Notion API error: {body}')
        except urllib.error.URLError as exc:
            return ExportResult(success=False, error=f'Notion request failed: {exc}')

        page_id = data.get('id', '')
        page_url = data.get('url') or (f'https://www.notion.so/{page_id.replace("-", "")}' if page_id else '')
        return ExportResult(success=True, external_url=page_url, external_id=page_id)

