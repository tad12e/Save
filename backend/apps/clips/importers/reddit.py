import csv
import io
import json
from typing import Any

from .base import BaseImporter, ParsedBookmark


class RedditImporter(BaseImporter):
    def parse(self, content: str | bytes) -> list[ParsedBookmark]:
        if isinstance(content, bytes):
            text = content.decode('utf-8', errors='replace')
        else:
            text = content

        text = text.strip()
        if text.startswith('{') or text.startswith('['):
            try:
                data = json.loads(text)
                return self._parse_json(data)
            except Exception:
                pass

        # Fallback to CSV
        return self._parse_csv(text)

    def _parse_json(self, data: Any) -> list[ParsedBookmark]:
        items = data if isinstance(data, list) else data.get('saved_posts') or data.get('data') or []
        bookmarks = []
        for item in items:
            if not isinstance(item, dict):
                continue
            # Handle standard Reddit export or API listing format
            data_dict = item.get('data') if 'data' in item and isinstance(item['data'], dict) else item
            
            permalink = data_dict.get('permalink') or data_dict.get('url') or ''
            if permalink.startswith('/'):
                url = f"https://www.reddit.com{permalink}"
            elif permalink.startswith('http'):
                url = permalink
            else:
                continue

            title = data_dict.get('title') or 'Reddit Saved Item'
            subreddit = data_dict.get('subreddit') or ''
            author = data_dict.get('author') or ''
            body = data_dict.get('selftext') or data_dict.get('body') or ''

            tags = ['reddit']
            if subreddit:
                tags.append(f"r/{subreddit.lower()}")

            bookmarks.append(
                ParsedBookmark(
                    url=url,
                    title=title,
                    tags=tags,
                    source_platform='reddit',
                    source_author=author,
                    selected_text=body[:2000],
                    extra_metadata={'subreddit': subreddit},
                )
            )
        return bookmarks

    def _parse_csv(self, text: str) -> list[ParsedBookmark]:
        reader = csv.DictReader(io.StringIO(text))
        bookmarks = []
        for row in reader:
            # Clean keys to lowercase
            cleaned = {k.strip().lower(): (v or '').strip() for k, v in row.items() if k}
            url = cleaned.get('url') or cleaned.get('permalink') or cleaned.get('link')
            if not url:
                continue

            if url.startswith('/'):
                url = f"https://www.reddit.com{url}"

            title = cleaned.get('title') or 'Reddit Saved Post'
            subreddit = cleaned.get('subreddit') or ''
            author = cleaned.get('author') or ''
            body = cleaned.get('body') or cleaned.get('selftext') or ''

            tags = ['reddit']
            if subreddit:
                tags.append(f"r/{subreddit.lower()}")

            bookmarks.append(
                ParsedBookmark(
                    url=url,
                    title=title,
                    tags=tags,
                    source_platform='reddit',
                    source_author=author,
                    selected_text=body[:2000],
                    extra_metadata={'subreddit': subreddit},
                )
            )
        return bookmarks
