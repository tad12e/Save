from .base import BaseImporter, ParsedBookmark
from .csv_url import CsvAndUrlImporter
from .html_bookmarks import HTMLBookmarkImporter
from .reddit import RedditImporter
from .twitter import TwitterImporter


def get_importer(source_platform: str = "", filename: str = "", content: str | bytes = "") -> BaseImporter:
    """
    Returns the appropriate importer based on explicit source_platform,
    filename extension/name, or content inspection.
    """
    sp = (source_platform or '').lower()
    fn = (filename or '').lower()
    sample = content[:500] if isinstance(content, str) else content[:500].decode('utf-8', errors='replace') if content else ''

    if sp == 'browser' or fn.endswith(('.html', '.htm')) or 'NETSCAPE-Bookmark-file-1' in sample or '<!doctype netscape' in sample.lower():
        return HTMLBookmarkImporter()

    if sp in ('twitter', 'x', 'x_twitter') or 'window.YTD.bookmarks' in sample:
        return TwitterImporter()

    if sp == 'reddit' or 'saved_posts' in fn:
        return RedditImporter()

    if fn.endswith('.json'):
        # Could be twitter or reddit or generic json
        if 'tweet' in sample or 'window.YTD' in sample:
            return TwitterImporter()
        if 'reddit' in sample or 'subreddit' in sample:
            return RedditImporter()

    return CsvAndUrlImporter()


__all__ = [
    'BaseImporter',
    'ParsedBookmark',
    'HTMLBookmarkImporter',
    'TwitterImporter',
    'RedditImporter',
    'CsvAndUrlImporter',
    'get_importer',
]
