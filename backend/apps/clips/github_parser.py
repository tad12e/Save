"""
GitHub README Parser and Resource Scraper for Save / Clipper.
Extracts individual tools and curated resources from awesome-lists and resource repositories.
"""

import json
import logging
import re
import urllib.error
import urllib.request
from urllib.parse import urlparse

from apps.clips.services.summarize import clean_text

logger = logging.getLogger(__name__)

# Section titles that should not be parsed as resource categories
IGNORED_SECTIONS = {
    'table of contents',
    'contents',
    'contributing',
    'contributors',
    'license',
    'acknowledgements',
    'acknowledgments',
    'sponsors',
    'backers',
    'badges',
    'footnotes',
    'related lists',
    'see also',
    'disclaimer',
    'author',
    'authors',
    'maintainers',
}

# Domains / URLs to ignore during resource extraction
IGNORED_DOMAINS = {
    'shields.io',
    'travis-ci.org',
    'travis-ci.com',
    'badge.fury.io',
    'codecov.io',
    'choosealicense.com',
    'creativecommons.org',
    'gnu.org',
    'opensource.org',
    'buymeacoffee.com',
    'patreon.com',
    'paypal.me',
    'paypal.com',
    'twitter.com',
    'x.com',
    'linkedin.com',
}

SECTION_CONTENT_TYPE_MAP = {
    'hosting': 'tool',
    'paas': 'tool',
    'iaas': 'tool',
    'cdn': 'tool',
    'dns': 'tool',
    'ssl': 'tool',
    'domain': 'tool',
    'database': 'tool',
    'cache': 'tool',
    'storage': 'tool',
    'media': 'tool',
    'email': 'tool',
    'messaging': 'tool',
    'sms': 'tool',
    'chat': 'tool',
    'ci/cd': 'tool',
    'ci': 'tool',
    'cd': 'tool',
    'testing': 'tool',
    'build': 'tool',
    'monitoring': 'tool',
    'analytics': 'tool',
    'logging': 'tool',
    'observability': 'tool',
    'security': 'tool',
    'auth': 'tool',
    'authentication': 'tool',
    'design': 'tool',
    'ui': 'tool',
    'icons': 'tool',
    'fonts': 'tool',
    'api': 'tool',
    'dev tools': 'tool',
    'ide': 'tool',
    'ai': 'tool',
    'machine learning': 'tool',
    'course': 'course',
    'tutorial': 'course',
    'book': 'article',
    'articles': 'article',
    'jobs': 'job',
}


def fetch_readme(owner: str, repo: str, branch: str | None = None) -> str:
    """
    Fetches raw README.md content from GitHub repository.
    Tries main branch first, then master branch as fallback.
    """
    branches_to_try = [branch] if branch else []
    for b in ['main', 'master']:
        if b not in branches_to_try:
            branches_to_try.append(b)

    filenames_to_try = ['README.md', 'readme.md', 'README.MD', 'README.rst', 'README.txt', 'README']

    headers = {'User-Agent': 'SaveClipperBot/1.0 (+https://save.app)'}

    for b in branches_to_try:
        for fname in filenames_to_try:
            raw_url = f'https://raw.githubusercontent.com/{owner}/{repo}/{b}/{fname}'
            try:
                req = urllib.request.Request(raw_url, headers=headers)
                with urllib.request.urlopen(req, timeout=12) as response:
                    content = response.read().decode('utf-8', errors='replace')
                    if content and len(content) > 50:
                        logger.info('Fetched README for %s/%s from branch %s (%s)', owner, repo, b, fname)
                        return content
            except Exception as exc:
                logger.debug('Failed fetching from %s: %s', raw_url, exc)

    return ''


def fetch_repo_metadata(owner: str, repo: str) -> dict:
    """
    Fetches GitHub repository metadata (stars, description, language, license) via GitHub API.
    """
    api_url = f'https://api.github.com/repos/{owner}/{repo}'
    headers = {
        'User-Agent': 'SaveClipperBot/1.0 (+https://save.app)',
        'Accept': 'application/vnd.github.v3+json',
    }

    try:
        req = urllib.request.Request(api_url, headers=headers)
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode('utf-8', errors='replace'))
            return {
                'name': data.get('name', repo),
                'full_name': data.get('full_name', f'{owner}/{repo}'),
                'description': data.get('description') or '',
                'stars': data.get('stargazers_count', 0),
                'forks': data.get('forks_count', 0),
                'language': data.get('language') or 'Markdown',
                'license': (data.get('license') or {}).get('name') or (data.get('license') or {}).get('spdx_id') or 'Unspecified',
                'topics': data.get('topics') or [],
                'url': data.get('html_url', f'https://github.com/{owner}/{repo}'),
            }
    except Exception as exc:
        logger.warning('GitHub API fetch failed for %s/%s: %s', owner, repo, exc)
        return {
            'name': repo,
            'full_name': f'{owner}/{repo}',
            'description': f'GitHub repository {owner}/{repo}',
            'stars': 0,
            'forks': 0,
            'language': 'Code',
            'license': 'Open Source',
            'topics': ['github', 'repository'],
            'url': f'https://github.com/{owner}/{repo}',
        }


def classify_resource(
    name: str,
    url: str,
    description: str,
    section: str,
    is_free_list: bool = True,
) -> tuple[str, str]:
    """
    Classifies a resource into content_type and pricing model.
    Returns: (content_type, pricing_model)
    """
    sec_lower = section.lower().strip()
    desc_lower = description.lower()
    name_lower = name.lower()

    # 1. Content Type Classification
    content_type = 'tool'  # Default for list repos
    for key, mapped_type in SECTION_CONTENT_TYPE_MAP.items():
        if key in sec_lower:
            content_type = mapped_type
            break

    # Check for book/course keywords
    if 'tutorial' in desc_lower or 'learn' in desc_lower or 'guide' in desc_lower:
        if content_type == 'webpage':
            content_type = 'course'

    # 2. Pricing Model Classification
    pricing = 'free tier' if is_free_list else 'unknown'

    if any(k in desc_lower for k in ('open source', 'foss', 'gpl', 'mit license', 'apache license', 'bsd')):
        pricing = 'open source'
    elif any(k in desc_lower for k in ('100% free', 'completely free', 'always free', 'free tier', 'free plan', 'free for', 'free credit', 'free account')):
        pricing = 'free tier'
    elif any(k in desc_lower for k in ('limited free', 'free trial', 'freemium', 'trial', 'evaluation')):
        pricing = 'limited free'
    elif any(k in desc_lower for k in ('paid only', 'commercial', 'subscription', 'starts at $', 'pricing')):
        pricing = 'paid'
    elif is_free_list:
        pricing = 'free tier'

    return content_type, pricing


def parse_list_resources(markdown: str, source_url: str, source_repo: str | None = None) -> list[dict]:
    """
    Parses a GitHub list README markdown and extracts all individual resources.

    Extracts for each resource:
      - name: link text e.g. "Cloudflare Pages"
      - url: tool website URL e.g. "https://pages.cloudflare.com"
      - description: description text after separator
      - section: nearest H2 or H3 header above the link
      - source_url: original GitHub repository URL
      - source_repo: owner/repo format e.g. "ripienaar/free-for-dev"
      - position: index number in list
      - content_type: classified content type (e.g. "tool")
      - pricing: pricing model (e.g. "free tier", "open source")
    """
    if not markdown:
        return []

    lines = markdown.splitlines()
    resources: list[dict] = []
    seen_urls: set[str] = set()

    current_h2 = 'General'
    current_h3 = ''
    current_section = 'General'

    # Determine if this repo is a free-for-dev list based on source_url/repo
    is_free_list = 'free' in (source_url.lower() if source_url else '') or 'free' in (source_repo.lower() if source_repo else '')

    position_counter = 1

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # 1. Track Section Headers
        h2_match = re.match(r'^##\s+(.+)$', stripped)
        if h2_match:
            header_text = clean_text(h2_match.group(1).strip('# \t\r\n'))
            # Remove link wrapper if header is a link e.g. ## [Section](url)
            header_text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', header_text).strip()
            current_h2 = header_text
            current_h3 = ''
            current_section = current_h2
            continue

        h3_match = re.match(r'^###\s+(.+)$', stripped)
        if h3_match:
            header_text = clean_text(h3_match.group(1).strip('# \t\r\n'))
            header_text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', header_text).strip()
            current_h3 = header_text
            current_section = f'{current_h2} - {current_h3}' if current_h2 != 'General' else current_h3
            continue

        h4_match = re.match(r'^####\s+(.+)$', stripped)
        if h4_match:
            continue

        # Skip ignored sections like Table of Contents or Contributing
        if any(ignored in current_h2.lower() for ignored in IGNORED_SECTIONS) or any(ignored in current_h3.lower() for ignored in IGNORED_SECTIONS):
            continue

        # 2. Extract Bullet Points with Markdown Links
        # Patterns supported:
        # * [Name](URL) — Description
        # * [Name](URL) - Description
        # * [Name](URL): Description
        # * **[Name](URL)** — Description
        # - [Name](URL) — Description
        # 1. [Name](URL) — Description

        # Match bullet list or numbered list
        bullet_match = re.match(
            r'^(?:[\*\-\+]|\d+\.)\s+(.+)$',
            stripped
        )

        item_text = bullet_match.group(1).strip() if bullet_match else stripped

        # Extract markdown link: [Name](URL)
        link_match = re.search(r'\[([^\]]+)\]\((https?://[^\)\s]+)\)', item_text)
        if not link_match:
            continue

        raw_name = link_match.group(1).strip('*_` ')
        raw_url = link_match.group(2).strip()

        # Clean URL
        parsed_item_url = urlparse(raw_url)
        domain = parsed_item_url.netloc.lower().replace('www.', '')

        # Filter out invalid / ignored links
        if not raw_url.startswith('http://') and not raw_url.startswith('https://'):
            continue
        if raw_url.startswith('#'):
            continue
        if any(ignored in domain for ignored in IGNORED_DOMAINS):
            continue
        if source_url and raw_url.rstrip('/').lower() == source_url.rstrip('/').lower():
            continue
        if 'github.com' in domain:
            path_parts = parsed_item_url.path.strip('/').split('/')
            # Filter internal GitHub actions, pulls, issues, contributors, commits
            if len(path_parts) >= 3 and path_parts[2] in ('pull', 'issues', 'commit', 'actions', 'releases', 'stargazers', 'network', 'graphs'):
                continue
            if len(path_parts) == 1:  # profile link e.g. github.com/username
                continue
            if source_repo and f'{path_parts[0]}/{path_parts[1]}'.lower() == source_repo.lower():
                continue

        # Check for deduplication
        norm_url = raw_url.rstrip('/')
        if norm_url in seen_urls:
            continue
        seen_urls.add(norm_url)

        # Extract Description (the text after the link separator)
        # Find where the link ends in item_text
        link_full = link_match.group(0)
        after_link = item_text[item_text.find(link_full) + len(link_full):].strip()

        # Clean separator characters: '—', '-', '–', ':', '–', '|'
        desc = re.sub(r'^[\s\—\-\:–\|·]+', '', after_link).strip()
        desc = clean_text(desc)

        # If description is empty, check if there was text before the link
        if not desc:
            before_link = item_text[:item_text.find(link_full)].strip()
            desc = clean_text(before_link)

        # Classify content type and pricing
        content_type, pricing = classify_resource(
            name=raw_name,
            url=raw_url,
            description=desc,
            section=current_section,
            is_free_list=is_free_list,
        )

        resources.append({
            'name': raw_name,
            'url': raw_url,
            'description': desc,
            'section': current_section,
            'source_url': source_url,
            'source_repo': source_repo or '',
            'position': position_counter,
            'content_type': content_type,
            'pricing': pricing,
        })
        position_counter += 1

    logger.info('Parsed %d resources from list %s (%s sections)', len(resources), source_repo or source_url, current_h2)
    return resources


def extract_resource_from_selection(
    selected_text: str,
    page_url: str,
    section: str = '',
) -> dict | None:
    """
    Parses highlighted text from a GitHub repository page to extract a single resource.
    Returns a resource dictionary or None if no valid URL is found.
    """
    if not selected_text:
        return None

    # 1. Clean the input first (strip leading bullets / digits and whitespace)
    text = selected_text.strip()
    text = re.sub(r'^(?:[\*\-\+]|\d+\.)\s*', '', text).strip()
    if not text:
        return None

    # 2. Try markdown link pattern first
    markdown_pattern = r'\[([^\]]+)\]\((https?://[^\)\s]+)\)'
    match = re.search(markdown_pattern, text)

    if match:
        name = match.group(1).strip('*_` ')
        url = match.group(2).strip()
        after_text = text[match.end():]
    else:
        # 3. If no markdown link, try bare URL
        url_match = re.search(r'(https?://[^\s\)]+)', text)
        if not url_match:
            return None

        url = url_match.group(1).strip('.,;:)]>')
        before_text = text[:url_match.start()].strip()
        after_text = text[url_match.end():].strip()

        # Clean name candidate
        name = re.sub(r'[\*\-\+\[\]\(\)\:\—\–\|]+', ' ', before_text).strip()
        if not name:
            domain = urlparse(url).netloc.replace('www.', '')
            name = domain or 'Resource'

    # 4 & 5. Validate the extracted URL
    if not url.startswith('http://') and not url.startswith('https://'):
        return None

    url_lower = url.lower()
    if 'shields.io' in url_lower or 'img.shields.io' in url_lower:
        return None

    parsed_url = urlparse(url)
    domain = parsed_url.netloc.lower().replace('www.', '')

    # Check for invalid / profile-only internal GitHub URLs
    if 'github.com' in domain:
        path_parts = [p for p in parsed_url.path.strip('/').split('/') if p]
        if len(path_parts) <= 1:
            return None
        if len(path_parts) >= 3 and path_parts[2] in ('settings', 'sponsors', 'login', 'pull', 'issues', 'actions'):
            return None

    # 6. Extract description from after_text
    desc = re.sub(r'^[\s\—\-\:–\|·]+', '', after_text).strip()
    desc = clean_text(desc)[:300]
    if not desc:
        desc = clean_text(selected_text)[:300]

    # 7. Extract source_repo from page_url
    from .github_detector import get_repo_info
    repo_info = get_repo_info(page_url)
    source_repo = repo_info['full_repo'] if repo_info else ''

    # 8. Classify using classify_resource()
    content_type, pricing = classify_resource(
        name=name,
        url=url,
        description=desc,
        section=section,
        is_free_list='free' in page_url.lower(),
    )

    # 9. Return the resource dict
    return {
        'name': name,
        'url': url,
        'description': desc,
        'section': section or 'Selected resource',
        'source_url': page_url,
        'source_repo': source_repo,
        'position': 1,
        'content_type': content_type,
        'pricing': pricing,
        'saved_as': 'single_selection',
    }
