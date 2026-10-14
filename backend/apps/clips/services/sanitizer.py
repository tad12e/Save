"""
Sanitization Guard for Clip Titles, Summaries, and Platform Text.
Filters cookie banners, login/auth walls, generic error titles, and repetitive boilerplate.
"""

import logging
import re
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Common boilerplate phrases found in scraped web content (case-insensitive)
BOILERPLATE_PATTERNS = [
    # Auth walls & sign-in prompts
    r'(?i)\b(article\s+|post\s+)?log\s*in\s+(or\s+)?sign\s*up(\s+(article\s+|post\s+)?log\s*in\s+(or\s+)?sign\s*up)*\b',
    r'(?i)\bsee\s+what[\'’]?s\s+happening\s+and\s+join\s+the\s+conversation\b',
    r'(?i)\bjoin\s+or\s+log\s*in\s+to\s+linkedin\b',
    r'(?i)\bsign\s+in\s+to\s+see\s+(more|this)\b',
    r'(?i)\bnew\s+to\s+(x|twitter)\?\s*sign\s+up\b',
    r'(?i)\balready\s+have\s+an\s+account\?\s*log\s*in\b',
    r'(?i)\bdon[\'’]?t\s+have\s+an\s+account\?\s*sign\s*up\b',
    r'(?i)\bfor\s+(x|twitter)\s+continue\s+with\s+(phone|apple|google)\b.*',
    r'(?i)\bcontinue\s+with\s+(phone|apple|google)\b.*',
    r'(?i)\bby\s+signing\s+up,?\s+you\s+agree\s+to\s+the\s+terms\b.*',
    r'(?i)\bpeople\s+on\s+(x|twitter)\s+are\s+the\s+first\s+to\s+know\b.*',
    # Cookie & consent notices
    r'(?i)\b(we\s+use|this\s+site\s+uses)\s+cookies(\s+to\s+improve\s+your\s+experience)?\b.*?(accept|agree|got\s+it|manage\s+settings)',
    r'(?i)\bby\s+clicking\s+(accept|agree|allow|continue)[,\s].*?(cookies|privacy\s+policy)\b',
    r'(?i)\bcookie\s+(preferences|policy|notice|settings)\b',
    r'(?i)\bwe\s+and\s+our\s+partners\s+store\s+and/or\s+access\s+information\s+on\s+a\s+device\b.*',
    # YouTube footer / boilerplate
    r'(?i)\bover\s+pers\s+auteursrecht\s+contact\s+creators\s+adverteren\s+ontwikkelaars.*',
    r'(?i)\babout\s+press\s+copyright\s+contact\s+us\s+creators\s+advertise\s+developers\s+terms.*',
    r'(?i)\bzo\s+werkt\s+youtube\b',
    r'(?i)\bhow\s+youtube\s+works\b',
    r'(?i)\btest\s+new\s+features\b',
    # Reddit boilerplate
    r'(?i)\bview\s+comments\s+on\s+reddit\b',
    r'(?i)\bjump\s+to\s+content\b',
    r'(?i)\breddit\s+and\s+its\s+partners\s+use\s+cookies\b.*',
    # Instagram footer & login boilerplate
    r'(?i)\b(?:instagram\s+)?meta\s+about\s+blog\s+jobs\s+help\s+api\s+privacy\s+terms\b.*',
    r'(?i)\bpopular\s+instagram\s+lite\s+threads\b.*',
    r'(?i)\blog\s*in\s+to\s+see\s+(?:photos|videos|posts)\b.*',
    r'(?i)\bsee\s+more\s+from\s+@[a-zA-Z0-9_.]+\s+on\s+instagram\b.*',
    r'(?i)\binstagram\s+instagram\s+meta\b.*',
]

GENERIC_TITLES = {
    'log in', 'sign in', 'sign up', 'register',
    'x.com', 'twitter.com', 't.co', 'reddit', 'reddit.com',
    'youtube', 'youtube.com', 'instagram', 'instagram.com',
    'login • instagram', 'instagram photo', 'instagram video', 'reel', 'reels',
    'linkedin', 'linkedin.com', 'github', 'github.com',
    'home', 'feed', '403 forbidden', '404 not found', 'access denied',
    'attention required! | cloudflare', 'just a moment...', 'security check',
}


def clean_boilerplate(text: str) -> str:
    """Removes known cookie consent, auth wall, and navigational boilerplate."""
    if not text:
        return ''
    cleaned = text
    for pattern in BOILERPLATE_PATTERNS:
        cleaned = re.sub(pattern, ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


def is_generic_or_auth_title(title: str) -> bool:
    norm = title.lower().strip()
    if not norm or norm in GENERIC_TITLES or norm.startswith(('http://', 'https://')):
        return True
    auth_patterns = [
        r'(?i)^log\s*in(\s+to|\s*[/|•–—]|\s*$)',
        r'(?i)^sign\s*(in|up)(\s+to|\s*[/|•–—]|\s*$)',
        r'(?i)^join\s+(x|twitter|linkedin|reddit)\b',
        r'(?i)^reddit\.com:\s*[a-zA-Z0-9_\-]+$',
    ]
    return any(re.search(pat, norm) for pat in auth_patterns)


def clean_clip_title(title: str, url: str = '') -> str:
    """Sanitizes clip title, replacing generic auth or error titles with domain or path context."""
    if not title:
        title = ''
    title = clean_boilerplate(title)

    # Clean Reddit trailing suffix from title: "NUS IRIS JAN 2027 Acceptance : r/REU"
    title = re.sub(r'\s*[:\-–—|]\s*(r/[a-zA-Z0-9_]+|Reddit|reddit\.com)$', '', title, flags=re.IGNORECASE).strip()

    if is_generic_or_auth_title(title):
        if url:
            try:
                parsed = urlparse(url)
                domain = parsed.netloc.lower().replace('www.', '')
                path = parsed.path.strip('/')

                # Check for Reddit post slug: /r/<subId>/comments/<postId>/<title_slug>
                reddit_match = re.search(r'/r/[^/]+/comments/[a-zA-Z0-9]+(?:/([a-zA-Z0-9_\-]+))?', path)
                if reddit_match and reddit_match.group(1):
                    slug_title = reddit_match.group(1).replace('-', ' ').replace('_', ' ').strip().title()
                    if slug_title:
                        return slug_title

                # Check for Reddit /r/<subId> without comments slug
                if 'reddit.com' in domain:
                    sub_m = re.search(r'/r/([^/]+)', path)
                    if sub_m:
                        return f"r/{sub_m.group(1)} Discussion"
                    return "Reddit Discussion"

                if path and len(path) > 2:
                    last_segment = path.split('/')[-1].replace('-', ' ').replace('_', ' ')
                    return f'{domain}: {last_segment[:60].title()}'
                return domain or 'Saved clip'
            except Exception as exc:
                logger.warning("Failed deriving fallback title from URL %r: %s", raw_url, exc)
        return 'Saved clip'

    # Remove trailing site suffixes e.g. "Post Title - YouTube" or "Post Title | Hacker News"
    title = re.sub(r'\s*[-|•–—]\s*(YouTube|Twitter|X|LinkedIn|Reddit|GitHub|Medium|Substack)$', '', title, flags=re.IGNORECASE).strip()
    return title[:512]


def clean_clip_summary(summary: str, title: str = '') -> str:
    """Strips title duplication, auth walls, and boilerplate from summaries."""
    if not summary:
        return ''
    cleaned = summary.strip()

    # If summary starts with an exact duplicate of title, strip it
    if title and cleaned.lower().startswith(title.lower().strip()):
        cleaned = cleaned[len(title):].strip()
        cleaned = re.sub(r'^[\s\-_:/|"\']+', '', cleaned).strip()

    cleaned = clean_boilerplate(cleaned)

    # Clean double whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


def clean_tweet_text(text: str, author_name: str = '', handle: str = '') -> str:
    """
    Sanitizes scraped tweet bodies:
    - Strips auth-wall prompts ('Continue with phone', etc.)
    - Strips scraper metric number sequences (e.g. '16 68 427 960')
    - Strips leading duplicated author/handle prefixes (e.g. 'Michele Catasta @pirroh ...')
    """
    if not text:
        return ''
    cleaned = text.strip()

    # Reject auth-wall triggers
    auth_wall_triggers = [
        r'(?i)\bfor\s+(x|twitter)\s+continue\s+with\b',
        r'(?i)\bcontinue\s+with\s+(phone|apple|google)\b',
        r'(?i)\bsign\s+in\s+to\s+(x|twitter)\b',
        r'(?i)\bnew\s+to\s+(x|twitter)\?\s*sign\s+up\b',
    ]
    for pat in auth_wall_triggers:
        if re.search(pat, cleaned):
            return ''

    # 1. Strip leading author/handle prefix: e.g. "Michele Catasta @pirroh " or "@pirroh "
    lead_match = re.match(r'^([A-Z\u00C0-\u024F][a-zA-Z0-9_.\s]{1,40}?\s*)?@[a-zA-Z0-9_]+\s*[:\-–—·]?\s*', cleaned)
    if lead_match:
        cleaned = cleaned[lead_match.end():].strip()
    elif author_name:
        escaped_author = re.escape(author_name.strip())
        cleaned = re.sub(rf'^{escaped_author}\s*(?:@\w+)?\s*[:\-–—]?\s*', '', cleaned, flags=re.IGNORECASE)
    if handle:
        escaped_handle = re.escape(handle.lstrip('@').strip())
        cleaned = re.sub(rf'^@?{escaped_handle}\s*[:\-–—]?\s*', '', cleaned, flags=re.IGNORECASE)

    # 2. Strip scraper metric counter sequence without eating preceding content
    if author_name and len(author_name) > 2:
        esc_auth = re.escape(author_name.strip())
        cleaned = re.sub(rf'\b{esc_auth}\s+\d{{1,6}}(?:\s+\d{{1,6}}){{2,5}}\b', '. ', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'(?:[A-Z][a-zA-Z0-9_.\s]{1,25}\s+)?\b\d{1,6}(?:\s+\d{1,6}){2,5}\b', '. ', cleaned)
    cleaned = re.sub(r'\s*\.\s*', '. ', cleaned)

    cleaned = clean_boilerplate(cleaned)
    return cleaned.strip()

