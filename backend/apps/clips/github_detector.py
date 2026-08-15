"""
GitHub List and Repository Detector for Save / Clipper.
Identifies if a given GitHub URL is a curated awesome/resource list or a standard code repository.
"""

import json
import logging
import re
import urllib.error
import urllib.request
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

LIST_TOPICS = {
    'awesome-list',
    'awesome',
    'resources',
    'curated-list',
    'free-for-dev',
    'tools',
    'collection',
    'directory',
    'catalog',
    'cheatsheet',
    'roadmap',
    'learning-resources',
    'developer-tools',
    'free-resources',
    'open-source-tools',
    'awesome-resources',
    'resource-list',
    'curated',
}

LIST_NAME_KEYWORDS = [
    'awesome',
    'free-for',
    'resources',
    'tools',
    'collection',
    'curated',
    'cheatsheet',
    'roadmap',
    'directory',
    'catalog',
    'list',
    'bookmarks',
    'links',
    'refs',
    'references',
    'handbook',
    'guide',
    'compendium',
]


def get_repo_info(url: str) -> dict | None:
    """
    Extracts owner, repo, branch, raw base URL from a GitHub URL.

    Example input: 'https://github.com/ripienaar/free-for-dev'
    Returns: {
        'owner': 'ripienaar',
        'repo': 'free-for-dev',
        'branch': 'main',
        'raw_base_url': 'https://raw.githubusercontent.com/ripienaar/free-for-dev/main',
        'full_repo': 'ripienaar/free-for-dev',
        'canonical_url': 'https://github.com/ripienaar/free-for-dev'
    }
    """
    if not url:
        return None

    parsed = urlparse(url)
    if 'github.com' not in parsed.netloc and 'raw.githubusercontent.com' not in parsed.netloc:
        return None

    path_parts = [p for p in parsed.path.strip('/').split('/') if p]
    if len(path_parts) < 2:
        return None

    owner = path_parts[0]
    repo = path_parts[1].replace('.git', '')

    branch = 'main'
    if len(path_parts) >= 4 and path_parts[2] in ('tree', 'blob'):
        branch = path_parts[3]

    full_repo = f'{owner}/{repo}'
    return {
        'owner': owner,
        'repo': repo,
        'branch': branch,
        'raw_base_url': f'https://raw.githubusercontent.com/{owner}/{repo}/{branch}',
        'full_repo': full_repo,
        'canonical_url': f'https://github.com/{owner}/{repo}',
    }


def check_github_topics(owner: str, repo: str) -> bool:
    """
    Calls the GitHub Topics API (GET https://api.github.com/repos/{owner}/{repo}/topics)
    to check if the repository is tagged with known awesome/resource list topics.
    Zero RAM, non-blocking fallback on any exception.
    """
    url = f'https://api.github.com/repos/{owner}/{repo}/topics'
    headers = {
        'User-Agent': 'SaveClipperBot/1.0',
        'Accept': 'application/vnd.github.v3+json',
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as response:
            data = json.loads(response.read().decode('utf-8', errors='replace'))
            topics = data.get('names', [])
            for t in topics:
                if t.lower() in LIST_TOPICS:
                    logger.debug('GitHub topic match for %s/%s: %s', owner, repo, t)
                    return True
    except Exception as exc:
        logger.debug('GitHub topics check failed for %s/%s: %s', owner, repo, exc)

    return False


def check_repo_name(repo: str, description: str) -> bool:
    """
    Checks if repository name or description contains list indicator keywords.
    """
    combined = f'{repo.lower()} {description.lower()}'
    for keyword in LIST_NAME_KEYWORDS:
        if keyword in combined:
            logger.debug('Repo keyword match in (%s): %s', combined[:60], keyword)
            return True
    return False


def check_readme_structure(readme: str) -> tuple[bool, dict]:
    """
    Pure Python structural analysis of README lines.
    Returns (is_list: bool, metrics: dict).
    """
    if not readme:
        return False, {}

    lines = [line.rstrip() for line in readme.splitlines() if line.strip()]
    total_lines = len(lines)
    if total_lines < 20:
        return False, {}

    list_item_regex = re.compile(r'^\s*[\*\-\+]\s+\[.+?\]\(https?://.+?\).{3,}')
    header_regex = re.compile(r'^#{2,4}\s+\w')
    link_regex = re.compile(r'\[.+?\]\(https?://')

    list_items = 0
    headers = 0
    link_lines = 0

    for line in lines:
        if list_item_regex.search(line):
            list_items += 1
        if header_regex.search(line):
            headers += 1
        if link_regex.search(line):
            link_lines += 1

    link_density = link_lines / total_lines if total_lines > 0 else 0.0
    list_item_ratio = list_items / total_lines if total_lines > 0 else 0.0

    metrics = {
        'total_lines': total_lines,
        'list_items': list_items,
        'headers': headers,
        'link_lines': link_lines,
        'link_density': round(link_density, 2),
        'list_item_ratio': round(list_item_ratio, 2),
    }

    # Condition A: list_items >= 8 AND headers >= 3
    # Condition B: list_item_ratio >= 0.25 AND headers >= 2
    # Condition C: link_density >= 0.35 AND list_items >= 5
    is_list = (
        (list_items >= 8 and headers >= 3)
        or (list_item_ratio >= 0.25 and headers >= 2)
        or (link_density >= 0.35 and list_items >= 5)
    )

    if is_list:
        logger.debug('README structural metrics classified as list: %s', metrics)

    return is_list, metrics


def is_github_list_repo(url: str, readme_content: str | None = None) -> tuple[bool, str]:
    """
    3-step pipeline to determine if a GitHub repository is a curated list.
    Returns (is_list: bool, reason: str).
    Reasons: 'github_topics', 'repo_name', 'readme_structure', 'not_a_list', 'not_github', 'readme_fetch_failed'.
    """
    repo_info = get_repo_info(url)
    if not repo_info:
        return False, 'not_github'

    owner = repo_info['owner']
    repo = repo_info['repo']

    # Step 1 — GitHub Topics API
    if check_github_topics(owner, repo):
        return True, 'github_topics'

    # Step 2 — Repo Name & Description Keyword Check
    from .github_parser import fetch_readme, fetch_repo_metadata
    metadata = fetch_repo_metadata(owner, repo)
    description = metadata.get('description', '') or ''
    if check_repo_name(repo, description):
        return True, 'repo_name'

    # Step 3 — README Structural Analysis
    if readme_content is None:
        readme_content = fetch_readme(owner, repo, repo_info.get('branch'))
        if not readme_content:
            return False, 'readme_fetch_failed'

    is_list, _metrics = check_readme_structure(readme_content)
    if is_list:
        return True, 'readme_structure'

    return False, 'not_a_list'
