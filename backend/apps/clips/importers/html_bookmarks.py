import html
from html.parser import HTMLParser
import re
from typing import Optional
from urllib.parse import urlparse

from .base import BaseImporter, ParsedBookmark


class NetscapeBookmarkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.bookmarks: list[ParsedBookmark] = []
        self.folder_stack: list[str] = []
        self.current_tag: Optional[str] = None
        self.current_href: Optional[str] = None
        self.current_attrs: dict[str, str] = {}
        self.current_text: list[str] = []
        self.in_folder_title: bool = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, Optional[str]]]):
        tag_lower = tag.lower()
        self.current_tag = tag_lower
        attr_dict = {k.lower(): (v or '') for k, v in attrs}

        if tag_lower == 'h3':
            # Entering folder title
            self.in_folder_title = True
            self.current_text = []
        elif tag_lower == 'a':
            self.current_href = attr_dict.get('href')
            self.current_attrs = attr_dict
            self.current_text = []
        elif tag_lower == 'dl':
            # If we just saw a folder title, it's now the active container
            pass

    def handle_endtag(self, tag: str):
        tag_lower = tag.lower()
        if tag_lower == 'h3' and self.in_folder_title:
            folder_name = ''.join(self.current_text).strip()
            if folder_name and folder_name.lower() not in ('bookmarks bar', 'bookmarks menu', 'other bookmarks', 'mobile bookmarks'):
                self.folder_stack.append(folder_name)
            self.in_folder_title = False
            self.current_text = []
        elif tag_lower == 'dl':
            if self.folder_stack:
                self.folder_stack.pop()
        elif tag_lower == 'a' and self.current_href:
            title = ''.join(self.current_text).strip()
            href = self.current_href.strip()

            # Ignore internal or javascript schemes
            parsed = urlparse(href)
            if parsed.scheme in ('http', 'https'):
                # Extract tags from attributes or folder hierarchy
                tags = []
                if self.current_attrs.get('tags'):
                    tags.extend([t.strip().lower() for t in self.current_attrs['tags'].split(',') if t.strip()])
                for folder in self.folder_stack:
                    clean_folder = re.sub(r'[^\w\s-]', '', folder).strip().lower()
                    if clean_folder and clean_folder not in tags:
                        tags.append(clean_folder)

                # Identify platform
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

                self.bookmarks.append(
                    ParsedBookmark(
                        url=href,
                        title=html.unescape(title) or href,
                        tags=tags[:5],
                        source_platform=source_platform,
                        extra_metadata={'folder_path': ' / '.join(self.folder_stack)},
                    )
                )

            self.current_href = None
            self.current_attrs = {}
            self.current_text = []

    def handle_data(self, data: str):
        if self.current_tag in ('a', 'h3'):
            self.current_text.append(data)


class HTMLBookmarkImporter(BaseImporter):
    def parse(self, content: str | bytes) -> list[ParsedBookmark]:
        if isinstance(content, bytes):
            text = content.decode('utf-8', errors='replace')
        else:
            text = content

        parser = NetscapeBookmarkParser()
        parser.feed(text)
        return parser.bookmarks
