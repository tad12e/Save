"""
Platform Scraper & OEMBED Enricher (Part 2).
Enriches clips with lightweight, platform-native metadata (handles, avatars, durations,
upvotes, stars, thumbnails, reading time) at save time.
All network calls have strict 3.0-second timeouts and graceful fallbacks.
Final payload is normalized and budget-capped (<= 300 bytes) via platform_meta contract.
"""

from __future__ import annotations

import html as html_lib
import json
import logging
import re
import urllib.error
import urllib.request
from typing import Any, Dict, Optional
from urllib.parse import parse_qs, urlparse

from apps.clips.platform_meta import (
    SKIN_BOOK,
    SKIN_COMMERCE,
    SKIN_GENERIC,
    SKIN_GITHUB,
    SKIN_INSTAGRAM,
    SKIN_JOB,
    SKIN_LINKEDIN,
    SKIN_PAPER,
    SKIN_REDDIT,
    SKIN_SPOTIFY,
    SKIN_X,
    SKIN_YOUTUBE,
    build_platform_meta,
    resolve_skin,
)
from apps.clips.services.sanitizer import clean_boilerplate

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 3.0
DEFAULT_USER_AGENT = 'SaveClipperBot/1.0 (+https://save.app)'


# ---------------------------------------------------------------------------
# HTML OpenGraph & Meta Tag Parser
# ---------------------------------------------------------------------------
def parse_og_meta(html_text: str) -> Dict[str, str]:
    """Extracts OpenGraph, Twitter card, and standard meta tags from HTML."""
    if not html_text:
        return {}

    meta: Dict[str, str] = {}
    # Pattern to match <meta (property|name)="key" content="value"> or content before property/name
    pattern = re.compile(
        r'<meta\s+[^>]*(?:name|property|itemprop)=["\']([^"\']+)["\'][^>]*content=["\']([^"\']*)["\']',
        re.IGNORECASE,
    )
    for key, val in pattern.findall(html_text):
        cleaned_key = key.lower().strip()
        cleaned_val = html_lib.unescape(val.strip())
        if cleaned_val and cleaned_key not in meta:
            meta[cleaned_key] = cleaned_val

    # Also match reversed attributes: <meta content="value" (name|property)="key">
    reversed_pattern = re.compile(
        r'<meta\s+[^>]*content=["\']([^"\']*)["\'][^>]*(?:name|property|itemprop)=["\']([^"\']+)["\']',
        re.IGNORECASE,
    )
    for val, key in reversed_pattern.findall(html_text):
        cleaned_key = key.lower().strip()
        cleaned_val = html_lib.unescape(val.strip())
        if cleaned_val and cleaned_key not in meta:
            meta[cleaned_key] = cleaned_val

    return meta


# ---------------------------------------------------------------------------
# Schema.org JSON-LD Parser & Helpers
# ---------------------------------------------------------------------------
def extract_json_ld(html_text: str) -> List[Dict[str, Any]]:
    """Extracts all JSON-LD data structures embedded in <script type="application/ld+json">."""
    if not html_text:
        return []
    results: List[Dict[str, Any]] = []
    pattern = re.compile(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        re.IGNORECASE | re.DOTALL,
    )
    for match in pattern.findall(html_text):
        content = match.strip()
        if not content:
            continue
        try:
            data = json.loads(content)
        except Exception:
            try:
                data = json.loads(html_lib.unescape(content))
            except Exception:
                continue

        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    results.append(item)
        elif isinstance(data, dict):
            graph = data.get('@graph')
            if isinstance(graph, list):
                for item in graph:
                    if isinstance(item, dict):
                        results.append(item)
            else:
                results.append(data)
    return results


def find_json_ld_item(items: List[Dict[str, Any]], target_types: Tuple[str, ...]) -> Optional[Dict[str, Any]]:
    """Finds the first JSON-LD item matching any of the specified target types."""
    lower_targets = {t.lower() for t in target_types}
    for item in items:
        item_type = item.get('@type')
        if not item_type:
            continue
        types = [item_type] if isinstance(item_type, str) else (item_type if isinstance(item_type, list) else [])
        for t in types:
            if isinstance(t, str):
                cleaned_type = t.split('/')[-1].lower()
                if cleaned_type in lower_targets:
                    return item
    return None


def extract_meta_authors(html_text: str) -> List[str]:
    """Extracts all authors from citation_author or author meta tags."""
    if not html_text:
        return []
    pattern = re.compile(
        r'<meta\s+[^>]*(?:name|property)=["\'](?:citation_author|author)["\'][^>]*content=["\']([^"\']+)["\']',
        re.IGNORECASE,
    )
    authors: List[str] = []
    for match in pattern.findall(html_text):
        name = ' '.join(html_lib.unescape(match).split()).strip()
        if name and name not in authors:
            authors.append(name)
    if not authors:
        rev_pattern = re.compile(
            r'<meta\s+[^>]*content=["\']([^"\']+)["\'][^>]*(?:name|property)=["\'](?:citation_author|author)["\']',
            re.IGNORECASE,
        )
        for match in rev_pattern.findall(html_text):
            name = ' '.join(html_lib.unescape(match).split()).strip()
            if name and name not in authors:
                authors.append(name)
    return authors


def _http_get_json(url: str, headers: Optional[Dict[str, str]] = None, timeout: float = DEFAULT_TIMEOUT) -> Optional[Any]:
    """Lightweight HTTP GET helper with strict timeout."""
    req_headers = {'User-Agent': DEFAULT_USER_AGENT, 'Accept': 'application/json'}
    if headers:
        req_headers.update(headers)

    req = urllib.request.Request(url, headers=req_headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode('utf-8', errors='replace')
            return json.loads(raw)
    except Exception as exc:
        logger.debug('HTTP GET JSON failed for %s: %s', url, exc)
        return None


# ---------------------------------------------------------------------------
# Subagent A: Social Scrapers (X / Twitter, Reddit, GitHub)
# ---------------------------------------------------------------------------

def fetch_x_metadata(url: str, og: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Extracts X/Twitter metadata (handle, name, avatar, likes, reposts, media).
    Tries fxtwitter public JSON API first, then falls back to OG tags and URL parsing.
    """
    og = og or {}
    data: Dict[str, Any] = {}

    parsed = urlparse(url)
    match = re.search(r'^/([^/]+)/status/(\d+)', parsed.path)
    author_handle = f'@{match.group(1)}' if match else ''
    status_id = match.group(2) if match else None

    # Try fxtwitter public JSON API if we have author and status_id
    if match and status_id:
        user = match.group(1)
        api_url = f'https://api.fxtwitter.com/{user}/status/{status_id}'
        api_res = _http_get_json(api_url, timeout=DEFAULT_TIMEOUT)
        if isinstance(api_res, dict) and api_res.get('tweet'):
            tweet = api_res['tweet']
            author_obj = tweet.get('author') or {}
            data['handle'] = f"@{author_obj.get('screen_name') or user}"
            data['name'] = author_obj.get('name') or user
            data['avatar'] = author_obj.get('avatar_url')
            data['likes'] = tweet.get('likes')
            data['reposts'] = tweet.get('retweets')
            data['replies'] = tweet.get('replies')
            data['views'] = tweet.get('views')
            data['posted_at'] = tweet.get('created_at')

            media_items = []
            for photo in (tweet.get('media') or {}).get('photos', []):
                if photo.get('url'):
                    media_items.append(photo['url'])
            if media_items:
                data['media'] = media_items[:4]
            return data

    # Fallback to OG tags and URL
    data['handle'] = author_handle or og.get('twitter:creator') or ''
    title = og.get('og:title') or og.get('twitter:title') or ''
    # Often title is e.g. "Name (@handle) on X"
    title_author_match = re.search(r'^([^(@]+)\s*\(@([^)]+)\)', title)
    if title_author_match:
        data['name'] = title_author_match.group(1).strip()
        if not data.get('handle'):
            data['handle'] = f'@{title_author_match.group(2).strip()}'
    elif title:
        data['name'] = title[:50]

    avatar = og.get('twitter:image') or og.get('og:image')
    if avatar:
        data['avatar'] = avatar

    return data


def fetch_reddit_metadata(url: str, og: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Extracts Reddit metadata (subreddit, author, upvotes, comments, flair, thumb, nsfw).
    Tries Reddit .json endpoint first, then falls back to OG tags & URL.
    """
    og = og or {}
    data: Dict[str, Any] = {}

    parsed = urlparse(url)
    sub_match = re.search(r'/r/([^/]+)', parsed.path)
    post_match = re.search(r'/r/([^/]+)/comments/([a-zA-Z0-9]+)', parsed.path)

    # Resolve Reddit short share link (/r/<subId>/s/<shortId>)
    if not post_match and '/s/' in parsed.path:
        try:
            req = urllib.request.Request(
                url,
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'}
            )
            with urllib.request.urlopen(req, timeout=DEFAULT_TIMEOUT) as resp:
                resolved = resp.geturl()
                if resolved and '/comments/' in resolved:
                    parsed = urlparse(resolved)
                    sub_match = re.search(r'/r/([^/]+)', parsed.path)
                    post_match = re.search(r'/r/([^/]+)/comments/([a-zA-Z0-9]+)', parsed.path)
        except Exception as exc:
            logger.debug('Failed to resolve Reddit shortlink %s: %s', url, exc)

    if post_match:
        subreddit = post_match.group(1)
        post_id = post_match.group(2)
        api_url = f'https://www.reddit.com/r/{subreddit}/comments/{post_id}.json'
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json',
        }
        res = _http_get_json(api_url, headers=headers, timeout=DEFAULT_TIMEOUT)
        if isinstance(res, list) and len(res) > 0:
            try:
                post = res[0]['data']['children'][0]['data']
                data['subreddit'] = f"r/{post.get('subreddit') or subreddit}"
                data['author'] = f"u/{post.get('author')}" if post.get('author') else ''
                data['upvotes'] = post.get('score')
                data['comments'] = post.get('num_comments')
                data['nsfw'] = bool(post.get('over_18'))
                if post.get('link_flair_text'):
                    data['flair'] = post['link_flair_text'][:30]
                thumb = post.get('thumbnail')
                if thumb and thumb.startswith('http'):
                    data['thumb'] = thumb
                if post.get('created_utc'):
                    import datetime
                    data['posted_at'] = datetime.datetime.fromtimestamp(post['created_utc'], tz=datetime.timezone.utc).isoformat()
                return data
            except (KeyError, IndexError, TypeError) as exc:
                logger.debug('Reddit JSON parse error: %s', exc)

    # Fallback to URL and OG tags
    if sub_match:
        data['subreddit'] = f'r/{sub_match.group(1)}'
    author = og.get('author') or og.get('twitter:creator')
    if not author:
        author_match = re.search(r'/u(?:ser)?/([^/]+)', parsed.path)
        if author_match:
            author = author_match.group(1)
    if author:
        data['author'] = f'u/{author.replace("u/", "")}'
    thumb = og.get('og:image') or og.get('twitter:image')
    if thumb:
        data['thumb'] = thumb
    published_at = og.get('article:published_time') or og.get('date')
    if published_at:
        data['posted_at'] = published_at[:25]
    return data


def fetch_github_metadata(url: str, og: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Extracts GitHub repo metadata (owner, repo, stars, forks, language, license, topics).
    Uses GitHub API when available.
    """
    og = og or {}
    data: Dict[str, Any] = {}

    parsed = urlparse(url)
    repo_match = re.search(r'^/([^/]+)/([^/?#]+)', parsed.path)
    if not repo_match:
        return data

    owner = repo_match.group(1)
    repo = repo_match.group(2)
    # Ignore reserved paths like settings, features, explore
    if owner in ('settings', 'explore', 'marketplace', 'topics', 'trending', 'features'):
        return data

    data['owner'] = owner
    data['repo'] = repo

    api_url = f'https://api.github.com/repos/{owner}/{repo}'
    res = _http_get_json(api_url, headers={'Accept': 'application/vnd.github.v3+json'}, timeout=DEFAULT_TIMEOUT)
    if isinstance(res, dict) and 'stargazers_count' in res:
        data['stars'] = res.get('stargazers_count', 0)
        data['forks'] = res.get('forks_count', 0)
        data['language'] = res.get('language') or 'Code'
        license_obj = res.get('license') or {}
        data['license'] = license_obj.get('spdx_id') or license_obj.get('name') or 'Open Source'
        topics = res.get('topics') or []
        if topics:
            data['topics'] = [str(t) for t in topics[:3]]
        return data

    # Fallback from OG description/tags
    data['stars'] = 0
    data['forks'] = 0
    data['language'] = 'Code'
    return data


# ---------------------------------------------------------------------------
# Subagent B: Media & Audio Scrapers (YouTube, Spotify, LinkedIn, Instagram, Generic)
# ---------------------------------------------------------------------------

def parse_iso8601_duration(duration_str: str) -> Optional[int]:
    """Parses ISO 8601 duration string (e.g. 'PT3M45S', 'PT1H2M') into seconds."""
    if not duration_str or not duration_str.startswith('PT'):
        return None
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str)
    if not match:
        return None
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds


def extract_youtube_video_id(url: str) -> tuple[Optional[str], bool]:
    """Extracts 11-char YouTube video ID and whether it is a YouTube Short."""
    if not url:
        return None, False
    parsed = urlparse(url)
    domain = parsed.netloc.lower().replace('www.', '')
    path = parsed.path
    is_short = '/shorts/' in path

    if is_short:
        match = re.search(r'/shorts/([a-zA-Z0-9_-]{11})', path)
        if match:
            return match.group(1), True

    if domain == 'youtu.be':
        match = re.search(r'^/([a-zA-Z0-9_-]{11})', path)
        if match:
            return match.group(1), False

    if 'youtube.com' in domain:
        qs = parse_qs(parsed.query)
        if 'v' in qs and qs['v']:
            return qs['v'][0][:16], False
        match = re.search(r'/(?:embed|v)/([a-zA-Z0-9_-]{11})', path)
        if match:
            return match.group(1), False

    return None, is_short


def fetch_youtube_metadata(url: str, og: Optional[Dict[str, str]] = None, html_text: str = '') -> Dict[str, Any]:
    """
    Extracts YouTube metadata (video_id, channel, channel_avatar, duration, is_short, views).
    Uses YouTube oEmbed for channel name and video id.
    """
    og = og or {}
    data: Dict[str, Any] = {}

    video_id, is_short = extract_youtube_video_id(url)
    if video_id:
        data['video_id'] = video_id
    if is_short:
        data['is_short'] = True

    # Try oEmbed for channel and title
    oembed_url = f'https://www.youtube.com/oembed?url={url}&format=json'
    oembed = _http_get_json(oembed_url, timeout=DEFAULT_TIMEOUT)
    if isinstance(oembed, dict):
        if oembed.get('author_name'):
            data['channel'] = oembed['author_name'][:60]

    # Duration parsing from itemprop="duration" or OG
    duration_str = og.get('duration') or og.get('video:duration')
    if duration_str:
        try:
            data['duration'] = int(float(duration_str))
        except (ValueError, TypeError) as exc:
            logger.debug("Failed parsing video duration %r: %s", duration_str, exc)

    if 'duration' not in data and html_text:
        dur_match = re.search(r'itemprop=["\']duration["\']\s+content=["\']([^"\']+)["\']', html_text)
        if dur_match:
            sec = parse_iso8601_duration(dur_match.group(1))
            if sec:
                data['duration'] = sec

    # Published at
    if og.get('article:published_time'):
        data['published_at'] = og['article:published_time']

    return data


def fetch_spotify_metadata(url: str, og: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Extracts Spotify metadata (kind, artist, album, cover, duration).
    Uses Spotify oEmbed and path inspection.
    """
    og = og or {}
    data: Dict[str, Any] = {}

    parsed = urlparse(url)
    # Detect kind from path: /track/..., /album/..., /playlist/..., /episode/..., /show/..., /artist/...
    kind_match = re.search(r'/(track|album|playlist|episode|show|artist)/([a-zA-Z0-9]+)', parsed.path)
    if kind_match:
        data['kind'] = kind_match.group(1)

    # Call Spotify oEmbed
    oembed_url = f'https://open.spotify.com/oembed?url={url}'
    oembed = _http_get_json(oembed_url, timeout=DEFAULT_TIMEOUT)
    if isinstance(oembed, dict):
        if oembed.get('thumbnail_url'):
            data['cover'] = oembed['thumbnail_url']
        title = oembed.get('title')
        if title:
            # Often Spotify titles are e.g. "Song Name" or "Artist - Song Name"
            if ' - ' in title:
                parts = title.split(' - ', 1)
                data['artist'] = parts[0][:60]
            else:
                data['album'] = title[:60]

    # OG tag fallbacks
    if not data.get('cover') and (og.get('og:image') or og.get('twitter:image')):
        data['cover'] = og.get('og:image') or og.get('twitter:image')
    if not data.get('artist') and og.get('music:musician'):
        data['artist'] = og['music:musician'][:60]
    if not data.get('album') and og.get('music:album'):
        data['album'] = og['music:album'][:60]
    if og.get('music:duration'):
        try:
            data['duration'] = int(float(og['music:duration']))
        except (ValueError, TypeError) as exc:
            logger.debug("Failed parsing music duration %r: %s", og.get('music:duration'), exc)

    return data


def fetch_linkedin_metadata(url: str, og: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Extracts LinkedIn metadata (name, headline, avatar) from OG tags and URL."""
    og = og or {}
    data: Dict[str, Any] = {}

    title = og.get('og:title') or og.get('twitter:title') or ''
    title = clean_boilerplate(title)
    if title:
        # e.g. "John Doe on LinkedIn: Some headline" or "John Doe - Software Engineer"
        match = re.search(r'^([^:–|-]+)(?:on\s+LinkedIn)?(?::\s*(.*))?$', title, re.IGNORECASE)
        if match:
            data['name'] = match.group(1).strip()[:60]
            if match.group(2):
                data['headline'] = match.group(2).strip()[:80]
        else:
            data['name'] = title[:60]

    avatar = og.get('og:image') or og.get('twitter:image')
    if avatar and not any(p in avatar.lower() for p in ('static-exp', 'dms/image/default')):
        data['avatar'] = avatar

    return data


def fetch_instagram_metadata(url: str, og: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Extracts Instagram metadata (handle, name, avatar, media, is_reel)."""
    og = og or {}
    data: Dict[str, Any] = {}

    if '/reel/' in url or '/reels/' in url:
        data['is_reel'] = True

    title = og.get('og:title') or ''
    # e.g. "Handle (@handle) on Instagram"
    match = re.search(r'^([^(@]+)\s*\(@([^)]+)\)', title)
    if match:
        data['name'] = match.group(1).strip()[:50]
        data['handle'] = f'@{match.group(2).strip()}'
    else:
        parsed = urlparse(url)
        # Check /username/reel/... or /username/p/...
        user_match = re.search(r'^/([a-zA-Z0-9_.]+)/(?:reel|reels|p)/', parsed.path)
        if user_match and user_match.group(1) not in ('p', 'reel', 'reels', 'stories', 'explore'):
            data['handle'] = f'@{user_match.group(1)}'
            data['name'] = user_match.group(1)
        else:
            handle_match = re.search(r'^/([^/]+)', parsed.path)
            if handle_match and handle_match.group(1) not in ('p', 'reel', 'reels', 'stories', 'explore', 'direct', 'accounts'):
                data['handle'] = f'@{handle_match.group(1)}'

    image = og.get('og:image') or og.get('twitter:image')
    if image:
        data['avatar'] = image
        data['media'] = [image]
    else:
        # Fallback to public oEmbed media preview using shortcode
        shortcode_match = re.search(r'/(?:reel|reels|p)/([a-zA-Z0-9_-]+)', url)
        if shortcode_match:
            shortcode = shortcode_match.group(1)
            data['shortcode'] = shortcode
            data['media'] = [f'https://www.instagram.com/p/{shortcode}/media/?size=l']

    return data


def fetch_generic_metadata(url: str, og: Optional[Dict[str, str]] = None, text: str = '') -> Dict[str, Any]:
    """
    Extracts generic article metadata (site, read_min, image, author, published_at).
    Computes read_min based on word count (wpm = 200).
    """
    og = og or {}
    data: Dict[str, Any] = {}

    site = og.get('og:site_name')
    if not site:
        try:
            site = urlparse(url).netloc.replace('www.', '').split(':')[0]
        except Exception:
            site = ''
    if site:
        data['site'] = site[:40]

    image = og.get('og:image') or og.get('twitter:image')
    if image:
        data['image'] = image

    author = og.get('article:author') or og.get('author') or og.get('twitter:creator')
    if author:
        data['author'] = author[:50]

    published_at = og.get('article:published_time') or og.get('date') or og.get('pubdate')
    if published_at:
        data['published_at'] = published_at[:25]

    # Calculate estimated reading time
    if text:
        word_count = len(text.split())
        if word_count > 40:
            data['read_min'] = max(1, word_count // 200)

    return data


# ---------------------------------------------------------------------------
# Archetype Scrapers: Commerce, Book, Paper, Job
# ---------------------------------------------------------------------------

def fetch_commerce_metadata(url: str, og: Optional[Dict[str, str]] = None, html_text: str = '') -> Dict[str, Any]:
    """
    Extracts e-commerce metadata (title, price, curr, brand, rating, reviews, thumb, availability).
    Supports Schema.org Product, OpenGraph product tags, and Amazon/Shopify fallbacks.
    """
    og = og or {}
    data: Dict[str, Any] = {}
    json_ld_items = extract_json_ld(html_text)
    product_ld = find_json_ld_item(json_ld_items, ('Product', 'IndividualProduct', 'ProductModel'))

    # 1. Product title
    title = ''
    if product_ld and product_ld.get('name'):
        title = str(product_ld['name']).strip()
    if not title:
        title = og.get('og:title') or og.get('twitter:title') or ''
    if title:
        data['title'] = clean_boilerplate(title)[:80]

    # 2. Brand
    brand = ''
    if product_ld:
        brand_val = product_ld.get('brand')
        if isinstance(brand_val, dict):
            brand = brand_val.get('name') or ''
        elif isinstance(brand_val, str):
            brand = brand_val
    if not brand:
        brand = og.get('product:brand') or og.get('og:brand') or og.get('og:site_name') or ''
    if not brand:
        host = (urlparse(url).hostname or '').lower()
        if 'amazon.' in host:
            brand = 'Amazon'
        elif 'ebay.' in host:
            brand = 'eBay'
        elif 'etsy.' in host:
            brand = 'Etsy'
        elif 'walmart.' in host:
            brand = 'Walmart'
        elif 'bestbuy.' in host:
            brand = 'Best Buy'
        elif 'target.' in host:
            brand = 'Target'
        elif host:
            brand = host.replace('www.', '').split('.')[0].capitalize()
    if brand:
        data['brand'] = str(brand).strip()[:40]

    # 3. Offers (Price, Currency, Availability)
    if product_ld and product_ld.get('offers'):
        offers = product_ld['offers']
        offer = offers[0] if isinstance(offers, list) and offers else (offers if isinstance(offers, dict) else {})
        if offer.get('price'):
            data['price'] = offer['price']
        elif offer.get('lowPrice'):
            data['price'] = offer['lowPrice']
        if offer.get('priceCurrency'):
            data['curr'] = str(offer['priceCurrency']).upper()[:3]
        if offer.get('availability'):
            avail = str(offer['availability']).split('/')[-1]
            data['availability'] = 'In Stock' if 'instock' in avail.lower() else ('Out of Stock' if 'outofstock' in avail.lower() else avail[:20])

    # OpenGraph price fallbacks
    if 'price' not in data:
        price_val = og.get('product:price:amount') or og.get('og:price:amount') or og.get('twitter:data1')
        if price_val:
            data['price'] = price_val
    if 'curr' not in data:
        curr_val = og.get('product:price:currency') or og.get('og:price:currency') or og.get('twitter:label1')
        if curr_val and len(curr_val.strip()) == 3 and curr_val.strip().isalpha():
            data['curr'] = curr_val.strip().upper()
    if 'availability' not in data and og.get('product:availability'):
        data['availability'] = og['product:availability'][:20]

    # Amazon HTML regex fallbacks
    if 'amazon.' in (urlparse(url).hostname or ''):
        if 'price' not in data and html_text:
            m_price = re.search(r'class=["\']a-offscreen["\']>\s*\$?([\d,.]+)', html_text)
            if m_price:
                data['price'] = m_price.group(1)
                data['curr'] = data.get('curr') or 'USD'
        if 'curr' not in data:
            data['curr'] = 'USD'

    # 4. Ratings & Reviews
    if product_ld and product_ld.get('aggregateRating'):
        agg = product_ld['aggregateRating']
        if isinstance(agg, dict):
            if agg.get('ratingValue'):
                data['rating'] = agg['ratingValue']
            if agg.get('reviewCount'):
                data['reviews'] = agg['reviewCount']
            elif agg.get('ratingCount'):
                data['reviews'] = agg['ratingCount']

    # Amazon HTML ratings regex fallback
    if 'rating' not in data and html_text:
        m_rating = re.search(r'([0-9.]+)\s+out\s+of\s+5\s+stars', html_text, re.IGNORECASE)
        if m_rating:
            data['rating'] = m_rating.group(1)
    if 'reviews' not in data and html_text:
        m_rev = re.search(r'id=["\']acrCustomerReviewText["\'][^>]*>([0-9,]+)', html_text)
        if m_rev:
            data['reviews'] = m_rev.group(1)

    # 5. Thumbnail / Product image
    thumb = ''
    if product_ld and product_ld.get('image'):
        img = product_ld['image']
        if isinstance(img, str):
            thumb = img
        elif isinstance(img, list) and img:
            thumb = img[0] if isinstance(img[0], str) else (img[0].get('url') if isinstance(img[0], dict) else '')
        elif isinstance(img, dict):
            thumb = img.get('url')
    if not thumb:
        thumb = og.get('og:image') or og.get('twitter:image')
    if thumb:
        data['thumb'] = thumb

    return data


def fetch_book_metadata(url: str, og: Optional[Dict[str, str]] = None, html_text: str = '') -> Dict[str, Any]:
    """
    Extracts book metadata (title, author, cover, rating, price, curr, pages, isbn).
    Supports Schema.org Book, Goodreads, OpenLibrary, and OpenGraph fallbacks.
    """
    og = og or {}
    data: Dict[str, Any] = {}
    json_ld_items = extract_json_ld(html_text)
    book_ld = find_json_ld_item(json_ld_items, ('Book', 'Audiobook'))

    # 1. Title
    title = ''
    if book_ld and book_ld.get('name'):
        title = str(book_ld['name']).strip()
    if not title:
        title = og.get('og:title') or og.get('twitter:title') or ''
    if title:
        data['title'] = clean_boilerplate(title)[:80]

    # 2. Author
    author = ''
    if book_ld and book_ld.get('author'):
        auth_val = book_ld['author']
        if isinstance(auth_val, dict):
            author = auth_val.get('name') or ''
        elif isinstance(auth_val, list) and auth_val:
            names = [a.get('name') if isinstance(a, dict) else str(a) for a in auth_val]
            author = ', '.join(filter(None, names))
        elif isinstance(auth_val, str):
            author = auth_val
    if not author:
        author = og.get('book:author') or og.get('author') or og.get('citation_author') or ''
    if not author and html_text:
        m_auth = re.search(r'class=["\']ContributorLink__name["\'][^>]*>([^<]+)<', html_text)
        if m_auth:
            author = m_auth.group(1).strip()
    if author:
        data['author'] = author[:60]

    # 3. Rating
    if book_ld and book_ld.get('aggregateRating'):
        agg = book_ld['aggregateRating']
        if isinstance(agg, dict) and agg.get('ratingValue'):
            data['rating'] = agg['ratingValue']
    if 'rating' not in data and html_text:
        m_rating = re.search(r'([0-9.]+)\s+rating', html_text, re.IGNORECASE)
        if m_rating:
            data['rating'] = m_rating.group(1)

    # 4. Pages & ISBN
    if book_ld:
        if book_ld.get('numberOfPages'):
            data['pages'] = book_ld['numberOfPages']
        if book_ld.get('isbn'):
            data['isbn'] = str(book_ld['isbn']).replace('-', '').strip()[:20]
    if 'pages' not in data and html_text:
        m_pages = re.search(r'([0-9]+)\s+pages', html_text, re.IGNORECASE)
        if m_pages:
            data['pages'] = m_pages.group(1)
    if 'isbn' not in data:
        isbn = og.get('book:isbn') or og.get('isbn')
        if isbn:
            data['isbn'] = str(isbn).replace('-', '').strip()[:20]

    # 5. Price & Currency
    if book_ld and book_ld.get('offers'):
        offers = book_ld['offers']
        offer = offers[0] if isinstance(offers, list) and offers else (offers if isinstance(offers, dict) else {})
        if offer.get('price'):
            data['price'] = offer['price']
        if offer.get('priceCurrency'):
            data['curr'] = str(offer['priceCurrency']).upper()[:3]
    if 'price' not in data and og.get('product:price:amount'):
        data['price'] = og['product:price:amount']
        if og.get('product:price:currency'):
            data['curr'] = og['product:price:currency'].upper()[:3]

    # 6. Cover image
    cover = ''
    if book_ld and book_ld.get('image'):
        img = book_ld['image']
        cover = img if isinstance(img, str) else (img.get('url') if isinstance(img, dict) else '')
    if not cover:
        cover = og.get('og:image') or og.get('twitter:image')
    if cover:
        data['cover'] = cover

    return data


def fetch_paper_metadata(url: str, og: Optional[Dict[str, str]] = None, html_text: str = '') -> Dict[str, Any]:
    """
    Extracts academic paper metadata (paper_id, title, authors, published_year, pdf_url, citations, doi).
    Specialized for ArXiv, bioRxiv, Google Scholar meta tags (citation_*), and Schema.org ScholarlyArticle.
    """
    og = og or {}
    data: Dict[str, Any] = {}
    json_ld_items = extract_json_ld(html_text)
    paper_ld = find_json_ld_item(json_ld_items, ('ScholarlyArticle', 'MedicalScholarlyArticle', 'TechArticle', 'Article'))

    # 1. ArXiv paper ID & direct PDF link
    m_arxiv = re.search(r'arxiv\.org/(?:abs|pdf)/([0-9]{4}\.[0-9]{4,5}(?:v[0-9]+)?)', url, re.IGNORECASE)
    if m_arxiv:
        arxiv_id = m_arxiv.group(1)
        data['paper_id'] = arxiv_id
        data['pdf_url'] = f'https://arxiv.org/pdf/{arxiv_id}.pdf'

    # 2. Title
    title = og.get('citation_title') or (paper_ld.get('headline') if paper_ld else None) or og.get('og:title') or ''
    if title:
        data['title'] = clean_boilerplate(title)[:100]

    # 3. Authors
    authors = extract_meta_authors(html_text)
    if not authors and paper_ld and paper_ld.get('author'):
        auth_val = paper_ld['author']
        if isinstance(auth_val, list):
            for a in auth_val:
                name = a.get('name') if isinstance(a, dict) else str(a)
                if name:
                    authors.append(name.strip())
        elif isinstance(auth_val, dict) and auth_val.get('name'):
            authors.append(auth_val['name'].strip())
        elif isinstance(auth_val, str):
            authors.append(auth_val.strip())
    if authors:
        data['authors'] = authors[:4]

    # 4. Publication Year
    pub_date = og.get('citation_publication_date') or og.get('citation_date') or og.get('citation_year')
    if not pub_date and paper_ld and paper_ld.get('datePublished'):
        pub_date = str(paper_ld['datePublished'])
    if not pub_date:
        pub_date = og.get('article:published_time')
    if pub_date:
        m_year = re.search(r'(\d{4})', pub_date)
        if m_year:
            data['published_year'] = int(m_year.group(1))

    # 5. PDF URL (if not already resolved via ArXiv)
    if 'pdf_url' not in data:
        pdf = og.get('citation_pdf_url')
        if pdf:
            data['pdf_url'] = pdf

    # 6. DOI
    doi = og.get('citation_doi')
    if not doi and paper_ld and paper_ld.get('identifier'):
        ident = paper_ld['identifier']
        doi = ident.get('value') if isinstance(ident, dict) else str(ident)
    if doi:
        data['doi'] = str(doi).strip()[:50]

    return data


def fetch_job_metadata(url: str, og: Optional[Dict[str, str]] = None, html_text: str = '') -> Dict[str, Any]:
    """
    Extracts job opportunity metadata (company, role, location, salary, deadline, apply_url).
    Specialized for Schema.org JobPosting, Greenhouse, Lever, Ashby, and Wellfound.
    """
    og = og or {}
    data: Dict[str, Any] = {'apply_url': url}
    json_ld_items = extract_json_ld(html_text)
    job_ld = find_json_ld_item(json_ld_items, ('JobPosting',))

    # 1. Role
    role = ''
    if job_ld and job_ld.get('title'):
        role = str(job_ld['title']).strip()
    if not role:
        role = og.get('og:title') or ''
        role = re.sub(r'\s*[-|–]\s*(?:Careers|Jobs|Hiring).*$', '', role, flags=re.IGNORECASE)
    if role:
        data['role'] = clean_boilerplate(role)[:60]

    # 2. Company
    company = ''
    if job_ld and job_ld.get('hiringOrganization'):
        org = job_ld['hiringOrganization']
        company = org.get('name') if isinstance(org, dict) else str(org)
    if not company:
        parsed = urlparse(url)
        host = parsed.hostname or ''
        if 'greenhouse.io' in host or 'lever.co' in host or 'ashbyhq.com' in host:
            parts = [p for p in parsed.path.split('/') if p]
            if parts:
                company = parts[0].replace('-', ' ').title()
    if not company:
        company = og.get('og:site_name') or ''
    if company:
        data['company'] = str(company).strip()[:50]

    # 3. Location
    if job_ld and job_ld.get('jobLocation'):
        loc = job_ld['jobLocation']
        if isinstance(loc, dict) and loc.get('address'):
            addr = loc['address']
            if isinstance(addr, dict):
                city = addr.get('addressLocality') or ''
                region = addr.get('addressRegion') or ''
                loc_str = f'{city}, {region}'.strip(' ,')
                if loc_str:
                    data['location'] = loc_str[:40]
        if 'location' not in data and job_ld.get('jobLocationType') == 'TELECOMMUTE':
            data['location'] = 'Remote'

    # 4. Salary
    if job_ld and job_ld.get('baseSalary'):
        sal = job_ld['baseSalary']
        if isinstance(sal, dict) and sal.get('value'):
            val = sal['value']
            curr = sal.get('currency', '$')
            if isinstance(val, dict):
                min_v = val.get('minValue')
                max_v = val.get('maxValue')
                if min_v and max_v:
                    data['salary'] = f'{curr}{int(min_v):,} - {curr}{int(max_v):,}'[:40]
                elif val.get('value'):
                    data['salary'] = f'{curr}{int(val["value"]):,}'[:40]

    # 5. Deadline
    if job_ld and job_ld.get('validThrough'):
        data['deadline'] = str(job_ld['validThrough'])[:25]

    return data


# ---------------------------------------------------------------------------
# Master Platform Enricher Dispatcher
# ---------------------------------------------------------------------------
def enrich_platform_meta(
    url: str,
    source_platform: Optional[str] = None,
    html_text: str = '',
    text: str = '',
    content_type: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Resolves the skin and extracts enriched platform metadata with full error handling.
    Always returns a valid envelope conforming to the 300-byte budget.
    """
    skin = resolve_skin(source_platform, url, content_type=content_type)
    og = parse_og_meta(html_text)
    raw_data: Dict[str, Any] = {}

    try:
        if skin == SKIN_X:
            raw_data = fetch_x_metadata(url, og)
        elif skin == SKIN_REDDIT:
            raw_data = fetch_reddit_metadata(url, og)
        elif skin == SKIN_GITHUB:
            raw_data = fetch_github_metadata(url, og)
        elif skin == SKIN_YOUTUBE:
            raw_data = fetch_youtube_metadata(url, og, html_text)
        elif skin == SKIN_SPOTIFY:
            raw_data = fetch_spotify_metadata(url, og)
        elif skin == SKIN_LINKEDIN:
            raw_data = fetch_linkedin_metadata(url, og)
        elif skin == SKIN_INSTAGRAM:
            raw_data = fetch_instagram_metadata(url, og)
        elif skin == SKIN_COMMERCE:
            raw_data = fetch_commerce_metadata(url, og, html_text)
        elif skin == SKIN_BOOK:
            raw_data = fetch_book_metadata(url, og, html_text)
        elif skin == SKIN_PAPER:
            raw_data = fetch_paper_metadata(url, og, html_text)
        elif skin == SKIN_JOB:
            raw_data = fetch_job_metadata(url, og, html_text)
        else:
            raw_data = fetch_generic_metadata(url, og, text)
    except Exception as exc:
        logger.warning('Enrichment failed for skin=%s url=%s: %s', skin, url, exc)
        raw_data = {}

    return build_platform_meta(source_platform or '', url, raw_data, content_type=content_type)
