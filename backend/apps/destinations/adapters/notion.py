import json
import urllib.error
import urllib.request

from .base import BaseDestinationAdapter, ExportResult


class NotionAdapter(BaseDestinationAdapter):
    provider = 'notion'

    def export_clip(self, clip, destination) -> ExportResult:
        token = destination.config.get('notion_token') or destination.config.get('integration_token')
        database_id = destination.config.get('database_id')

        if not token or not database_id:
            return ExportResult(
                success=False,
                error='Notion destination is missing integration_token or database_id.',
            )

        payload = {
            'parent': {'database_id': database_id},
            'properties': {
                'Name': {
                    'title': [{'text': {'content': (clip.title or clip.url)[:2000]}}],
                },
            },
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
