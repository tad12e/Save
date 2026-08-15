import re
from urllib.parse import parse_qs, urlparse


def detect_source_platform(url: str) -> tuple[str, str, str]:
    """
    Analyzes a URL to detect source platform, author handle, and post canonical URL.
    
    Returns:
        (source_platform, source_author, source_post_url)
    """
    if not url:
        return 'web', '', ''

    parsed = urlparse(url)
    domain = parsed.netloc.lower().replace('www.', '')
    path = parsed.path

    # 1. X / Twitter (x.com or twitter.com)
    if domain in ('x.com', 'twitter.com'):
        # Match pattern: /(username)/status/(tweet_id)
        match = re.search(r'^/([^/]+)/status/(\d+)', path)
        if match:
            author = f'@{match.group(1)}'
            canonical_url = f'https://x.com/{match.group(1)}/status/{match.group(2)}'
            return 'x_twitter', author, canonical_url
        author_match = re.search(r'^/([^/]+)', path)
        if author_match and author_match.group(1) not in ('home', 'explore', 'notifications', 'messages', 'i'):
            return 'x_twitter', f'@{author_match.group(1)}', url
        return 'x_twitter', '', url

    # 2. LinkedIn (linkedin.com)
    if 'linkedin.com' in domain:
        # Match post or profile
        match = re.search(r'/posts/([^/?]+)', path)
        if match:
            return 'linkedin', match.group(1).split('-')[0], url
        user_match = re.search(r'/in/([^/?]+)', path)
        if user_match:
            return 'linkedin', user_match.group(1), url
        return 'linkedin', '', url

    # 3. Reddit (reddit.com)
    if 'reddit.com' in domain:
        sub_match = re.search(r'/r/([^/]+)', path)
        subreddit = f'r/{sub_match.group(1)}' if sub_match else ''
        return 'reddit', subreddit, url

    # 4. YouTube (youtube.com or youtu.be)
    if domain in ('youtube.com', 'm.youtube.com', 'youtu.be'):
        channel_match = re.search(r'/@([^/?]+)', path)
        channel = f'@{channel_match.group(1)}' if channel_match else ''
        return 'youtube', channel, url

    # 5. GitHub (github.com)
    if domain == 'github.com':
        repo_match = re.search(r'^/([^/]+)(?:/([^/]+))?', path)
        if repo_match:
            user_or_repo = f'{repo_match.group(1)}/{repo_match.group(2)}' if repo_match.group(2) else repo_match.group(1)
            return 'github', user_or_repo, url
        return 'github', '', url

    # Default general web
    host_clean = domain.split(':')[0]
    return 'web', host_clean, url


def detect_embedded_resources(text: str, page_html: str = '') -> list[dict]:
    """
    Scans text and HTML for embedded resources like Google Sheets, Notion databases, Airtable, or CSVs.
    
    Returns a list of dicts:
        [{'type': 'google_sheet', 'url': '...'}, ...]
    """
    haystack = f'{text} {page_html}'
    resources = []
    seen = set()

    # Google Sheets URL pattern
    gsheet_matches = re.findall(r'https://docs\.google\.com/spreadsheets/d/([a-zA-Z0-9-_]+)[^\s"\'<>]*', haystack)
    for g_url in gsheet_matches:
        full_url = f'https://docs.google.com/spreadsheets/d/{g_url}/edit'
        if full_url not in seen:
            seen.add(full_url)
            resources.append({
                'type': 'google_sheet',
                'url': full_url,
                'resource_id': g_url,
            })

    # Notion database or page URL
    notion_matches = re.findall(r'https://(?:www\.)?notion\.so/([a-zA-Z0-9-_/]+)', haystack)
    for n_url in notion_matches:
        full_url = f'https://notion.so/{n_url}'
        if full_url not in seen:
            seen.add(full_url)
            resources.append({
                'type': 'notion',
                'url': full_url,
            })

    # Airtable share URL
    airtable_matches = re.findall(r'https://airtable\.com/([a-zA-Z0-9-_/]+)', haystack)
    for a_url in airtable_matches:
        full_url = f'https://airtable.com/{a_url}'
        if full_url not in seen:
            seen.add(full_url)
            resources.append({
                'type': 'airtable',
                'url': full_url,
            })

    return resources
