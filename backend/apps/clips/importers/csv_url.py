import csv
import io
import re
from urllib.parse import urlparse

from .base import BaseImporter, ParsedBookmark


class CsvAndUrlImporter(BaseImporter):
    def parse(self, content: str | bytes) -> list[ParsedBookmark]:
        if isinstance(content, bytes):
            text = content.decode('utf-8', errors='replace')
        else:
            text = content

        text = text.strip()

        # Check if this is a CSV with headers or a plain URL list
        first_line = text.splitlines()[0] if text.splitlines() else ''
        if ',' in first_line or '\t' in first_line:
            parsed = self._try_parse_csv(text)
            if parsed:
                return parsed

        # Fallback to plain URL list (one URL per line or URLs in text)
        return self._parse_url_list(text)

    def _try_parse_csv(self, text: str) -> list[ParsedBookmark]:
        try:
            # Auto-detect delimiter
            sample = '\n'.join(text.splitlines()[:5])
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter if ',' in sample or '\t' in sample or ';' in sample else ','
            reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
        except Exception:
            return []

        bookmarks = []
        for row in reader:
            if not row:
                continue
            cleaned = {str(k).strip().lower(): (v or '').strip() for k, v in row.items() if k}

            # Find URL column (supports url, link, address, href, pocket, raindrop, instapaper)
            url = None
            for key in ('url', 'link', 'href', 'bookmark_url', 'address', 'original_url'):
                if cleaned.get(key) and cleaned[key].startswith(('http://', 'https://')):
                    url = cleaned[key]
                    break

            if not url:
                # Check all values in row for a valid URL
                for v in cleaned.values():
                    if isinstance(v, str) and v.startswith(('http://', 'https://')):
                        url = v
                        break

            if not url:
                continue

            # Title
            title = cleaned.get('title') or cleaned.get('name') or cleaned.get('bookmark') or url

            # Tags (Pocket uses 'tags', Raindrop uses 'tags', Instapaper uses 'folder')
            tags = []
            raw_tags = cleaned.get('tags') or cleaned.get('tag') or cleaned.get('labels') or ''
            if raw_tags:
                tags.extend([t.strip().lower() for t in re.split(r'[,|;]', raw_tags) if t.strip()])

            folder = cleaned.get('folder') or cleaned.get('collection') or ''
            if folder and folder.lower() not in tags:
                tags.append(folder.strip().lower())

            # Platform detection
            parsed_url = urlparse(url)
            host = parsed_url.netloc.lower()
            source_platform = 'web'
            if 'x.com' in host or 'twitter.com' in host:
                source_platform = 'x_twitter'
            elif 'reddit.com' in host:
                source_platform = 'reddit'
            elif 'github.com' in host:
                source_platform = 'github'
            elif 'youtube.com' in host or 'youtu.be' in host:
                source_platform = 'youtube'
            elif 'linkedin.com' in host:
                source_platform = 'linkedin'

            selection = cleaned.get('selection') or cleaned.get('excerpt') or cleaned.get('note') or ''

            bookmarks.append(
                ParsedBookmark(
                    url=url,
                    title=title,
                    tags=tags[:5],
                    source_platform=source_platform,
                    selected_text=selection[:2000],
                )
            )

        return bookmarks

    def _parse_url_list(self, text: str) -> list[ParsedBookmark]:
        # Regex to find all http/https URLs
        url_regex = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+')
        found_urls = url_regex.findall(text)

        bookmarks = []
        seen = set()
        for u in found_urls:
            clean_url = u.strip().rstrip('.,;:)]}>')
            if not clean_url.startswith(('http://', 'https://')):
                clean_url = f'https://{clean_url}'

            parsed = urlparse(clean_url)
            host = parsed.netloc.lower()
            source_platform = 'web'
            if 'x.com' in host or 'twitter.com' in host:
                source_platform = 'x_twitter'
            elif 'reddit.com' in host:
                source_platform = 'reddit'
            elif 'github.com' in host:
                source_platform = 'github'
            elif 'youtube.com' in host or 'youtu.be' in host:
                source_platform = 'youtube'
            elif 'linkedin.com' in host:
                source_platform = 'linkedin'

            bookmarks.append(
                ParsedBookmark(
                    url=clean_url,
                    title=clean_url,
                    tags=[],
                    source_platform=source_platform,
                )
            )
        return bookmarks
