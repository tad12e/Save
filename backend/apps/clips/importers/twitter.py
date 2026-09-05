import json
import re
from typing import Any

from .base import BaseImporter, ParsedBookmark


class TwitterImporter(BaseImporter):
    def parse(self, content: str | bytes) -> list[ParsedBookmark]:
        if isinstance(content, bytes):
            text = content.decode('utf-8', errors='replace')
        else:
            text = content

        text = text.strip()
        # Handle window.YTD.bookmarks.part0 = [ ... ]
        if text.startswith('window.YTD'):
            eq_idx = text.find('=')
            if eq_idx != -1:
                text = text[eq_idx + 1:].strip().rstrip(';')

        try:
            data = json.loads(text)
        except Exception:
            # Fallback regex extraction of tweet URLs
            return self._regex_parse_tweets(text)

        bookmarks = []
        if isinstance(data, list):
            for item in data:
                bookmark = self._extract_tweet_item(item)
                if bookmark:
                    bookmarks.append(bookmark)
        elif isinstance(data, dict):
            # Sometimes wrapped in { "bookmarks": [ ... ] } or { "data": [ ... ] }
            items = data.get('bookmarks') or data.get('data') or data.get('tweets') or [data]
            for item in items:
                bookmark = self._extract_tweet_item(item)
                if bookmark:
                    bookmarks.append(bookmark)

        return bookmarks

    def _extract_tweet_item(self, item: Any) -> ParsedBookmark | None:
        if not isinstance(item, dict):
            return None

        # Unwrap if nested under 'bookmark' or 'tweet'
        if 'bookmark' in item and isinstance(item['bookmark'], dict):
            item = item['bookmark']
        elif 'tweet' in item and isinstance(item['tweet'], dict):
            item = item['tweet']

        tweet_id = str(item.get('tweetId') or item.get('id') or item.get('id_str') or '').strip()
        raw_text = item.get('full_text') or item.get('text') or ''
        created_at = item.get('created_at')

        # Check for explicit URL or build from tweet_id
        url = item.get('url') or item.get('expanded_url')
        author = item.get('author') or item.get('username') or ''

        if not url and tweet_id:
            user_part = author if author else 'i'
            url = f"https://x.com/{user_part}/status/{tweet_id}"

        if not url:
            # Try to find a URL inside the tweet text
            match = re.search(r'https?://[^\s]+', raw_text)
            if match:
                url = match.group(0)

        if not url:
            return None

        title = raw_text[:120].strip() if raw_text else f"X Post {tweet_id or ''}".strip()
        tags = ['x_twitter']

        # Extract hashtags
        hashtags = re.findall(r'#(\w+)', raw_text)
        tags.extend([h.lower() for h in hashtags[:4]])

        return ParsedBookmark(
            url=url,
            title=title,
            tags=list(dict.fromkeys(tags)),
            source_platform='x_twitter',
            source_author=author,
            created_at=str(created_at) if created_at else None,
            selected_text=raw_text,
            extra_metadata={'tweet_id': tweet_id} if tweet_id else {},
        )

    def _regex_parse_tweets(self, text: str) -> list[ParsedBookmark]:
        urls = re.findall(r'https?://(?:twitter\.com|x\.com)/[a-zA-Z0-9_]+/status/\d+', text)
        results = []
        for u in set(urls):
            results.append(
                ParsedBookmark(
                    url=u,
                    title='X / Twitter Bookmark',
                    tags=['x_twitter'],
                    source_platform='x_twitter',
                )
            )
        return results
