import logging
import re
from urllib.parse import parse_qs, urlparse

logger = logging.getLogger(__name__)


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
        activity_match = re.search(r'activity[:-](\d+)', url)
        if activity_match:
            canonical_url = f'https://www.linkedin.com/feed/update/urn:li:activity:{activity_match.group(1)}/'
            author_match = re.search(r'/in/([^/?]+)', path)
            author = author_match.group(1) if author_match else ''
            return 'linkedin', author, canonical_url
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
        post_match = re.search(r'/r/([^/]+)/comments/([a-zA-Z0-9]+)(?:/([^/?#]+))?', path)
        if post_match:
            slug_part = f"{post_match.group(3)}/" if post_match.group(3) else ''
            canonical_url = f'https://www.reddit.com/r/{post_match.group(1)}/comments/{post_match.group(2)}/{slug_part}'
            return 'reddit', subreddit, canonical_url

        # Check Reddit short share link: /r/<subId>/s/<shareId>
        if '/s/' in path:
            try:
                import urllib.request
                req = urllib.request.Request(
                    url,
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'}
                )
                with urllib.request.urlopen(req, timeout=3.0) as resp:
                    resolved = resp.geturl()
                    if resolved and '/comments/' in resolved:
                        resolved_path = urlparse(resolved).path
                        rmatch = re.search(r'/r/([^/]+)/comments/([a-zA-Z0-9]+)(?:/([^/?#]+))?', resolved_path)
                        if rmatch:
                            sub = f'r/{rmatch.group(1)}'
                            slug_part = f"{rmatch.group(3)}/" if rmatch.group(3) else ''
                            return 'reddit', sub, f'https://www.reddit.com/r/{rmatch.group(1)}/comments/{rmatch.group(2)}/{slug_part}'
            except Exception as exc:
                logger.debug("Source detector: Reddit shortlink redirect resolution failed for %s: %s", url, exc)

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

    # 6. Instagram (instagram.com)
    if 'instagram.com' in domain:
        post_match = re.search(r'/(?:p|reel|reels)/([a-zA-Z0-9-_]+)', path)
        if post_match:
            is_reel = '/reel/' in path or '/reels/' in path
            sub_path = 'reel' if is_reel else 'p'
            canonical_url = f'https://www.instagram.com/{sub_path}/{post_match.group(1)}/'
            author_match = re.search(r'^/([^/]+)', path)
            author = f'@{author_match.group(1)}' if author_match and author_match.group(1) not in ('p', 'reel', 'reels', 'stories', 'explore', 'direct') else ''
            return 'instagram', author, canonical_url
        author_match = re.search(r'^/([^/]+)', path)
        if author_match and author_match.group(1) not in ('p', 'reel', 'reels', 'stories', 'explore', 'direct', 'accounts'):
            return 'instagram', f'@{author_match.group(1)}', url
        return 'instagram', '', url

    # 7. TikTok (tiktok.com)
    if 'tiktok.com' in domain:
        author_match = re.search(r'/@([^/?]+)', path)
        author = f'@{author_match.group(1)}' if author_match else ''
        video_match = re.search(r'/@([^/?]+)/video/(\d+)', path)
        canonical_url = f'https://www.tiktok.com/@{video_match.group(1)}/video/{video_match.group(2)}' if video_match else url
        return 'tiktok', author, canonical_url

    # 8. Spotify (spotify.com)
    if 'spotify.com' in domain:
        author_match = re.search(r'/(?:artist|show)/([^/?]+)', path)
        author = author_match.group(1).replace('-', ' ').title() if author_match else ''
        return 'spotify', author, url

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


def extract_external_job_url(text: str, page_html: str = '', source_url: str = '') -> str | None:
    """
    Extracts an external job/application link or resource link from text, HTML, or social post.
    Filters out social media platform internal links (e.g. x.com, twitter.com, t.co).
    """
    haystack = f'{text} {page_html}'
    
    # 1. Look for explicit http/https URLs
    raw_urls = re.findall(r'https?://[^\s"\'<>]+', haystack)
    
    # 2. Also find domain-like job URLs without protocol (e.g. unisys.wd5.myworkdayjobs.com/External/job/...)
    domain_matches = re.findall(r'(?:[a-zA-Z0-9-]+\.)+(?:myworkdayjobs\.com|greenhouse\.io|lever\.co|ashbyhq\.com|workable\.com|smartrecruiters\.com|bamboohr\.com|jobvite\.com|rippling-ats\.com|notion\.site|applytojob\.com|freshteam\.com|recruitee\.com|join\.com)(?:/[^\s"\'<>]*)?', haystack, re.IGNORECASE)
    for dm in domain_matches:
        full_dm = f'https://{dm}'
        if full_dm not in raw_urls:
            raw_urls.insert(0, full_dm)
            
    # 3. Generic career/job domain pattern with path (e.g. company.com/jobs/... or company.com/careers/...)
    career_matches = re.findall(r'(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:/(?:careers|jobs|intern|apply|job)/[^\s"\'<>]*)', haystack, re.IGNORECASE)
    for cm in career_matches:
        full_cm = f'https://{cm}'
        if full_cm not in raw_urls:
            raw_urls.insert(0, full_cm)

    # 4. Generic standalone domain pattern followed by path (e.g. beautifului.dev, github.com/...)
    generic_matches = re.findall(r'(?:[a-zA-Z0-9-]+\.)+(?:com|org|io|dev|ai|app|net|co|in|tech|info)(?:/[^\s"\'<>]*)?', haystack, re.IGNORECASE)
    for gm in generic_matches:
        full_gm = f'https://{gm}'
        if full_gm not in raw_urls:
            raw_urls.append(full_gm)

    # Filter out social feed domains and clean trailing punctuation
    clean_urls = []
    social_domains = ('x.com', 'twitter.com', 't.co', 'linkedin.com/feed', 'instagram.com', 'tiktok.com', 'reddit.com', 'facebook.com', 'youtube.com', 'youtu.be')
    
    for url in raw_urls:
        url = url.rstrip('.,);:\'">')
        # Check if internal social link
        is_social = any(d in url.lower() for d in social_domains)
        if not is_social and len(url) > 8:
            clean_urls.append(url)
            
    return clean_urls[0] if clean_urls else None

