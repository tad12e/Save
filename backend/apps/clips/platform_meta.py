"""
Platform Metadata Contract (v1) — single source of truth for native bookmark skins.

Stored at:  Clip.extra_metadata["platform_meta"]
Mirrored in:
    web/src/types/clipPlatform.ts       (TypeScript)
    mobile/lib/models/platform_meta.dart (Dart)

Design rules
------------
1. Compact: serialized with no whitespace and capped at PLATFORM_META_BYTE_BUDGET
   (300 bytes). Low-priority fields are dropped first until the payload fits.
2. No body text: tweet/post/caption text is NOT duplicated here — skins read it
   from ``clip.summary`` / ``clip.selected_text``.
3. Derivable data is never stored: e.g. YouTube thumbnails are derived on the
   client from ``video_id`` (https://i.ytimg.com/vi/<id>/hqdefault.jpg).
4. Every field is optional except ``v`` and ``skin``. Clients MUST tolerate
   missing fields and unknown skins (fallback to ``generic``).

Envelope
--------
    {"v": 1, "skin": "<skin>", ...skin fields}

Skins & fields  (int = non-negative integer, ts = ISO-8601 string)
------------------------------------------------------------------
x          name, handle, avatar, verified:bool, media:[url<=4], likes:int,
           reposts:int, replies:int, views:int, posted_at:ts
youtube    video_id, channel, channel_avatar, duration:int(seconds), views:int,
           published_at:ts, is_short:bool
reddit     subreddit, author, upvotes:int, comments:int, flair, thumb, nsfw:bool
github     owner, repo, stars:int, forks:int, language, license, topics:[str<=3]
linkedin   name, headline, avatar, reactions:int, comments:int
instagram  handle, name, avatar, media:[url<=4], likes:int, is_reel:bool
spotify    kind(track|album|playlist|episode|show|artist), artist, album, cover,
           duration:int(seconds)
generic    site, image, author, read_min:int, published_at:ts
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

PLATFORM_META_KEY = 'platform_meta'
PLATFORM_META_VERSION = 1
PLATFORM_META_BYTE_BUDGET = 300

SKIN_X = 'x'
SKIN_YOUTUBE = 'youtube'
SKIN_REDDIT = 'reddit'
SKIN_GITHUB = 'github'
SKIN_LINKEDIN = 'linkedin'
SKIN_INSTAGRAM = 'instagram'
SKIN_SPOTIFY = 'spotify'
SKIN_GENERIC = 'generic'

SKINS = (
    SKIN_X, SKIN_YOUTUBE, SKIN_REDDIT, SKIN_GITHUB,
    SKIN_LINKEDIN, SKIN_INSTAGRAM, SKIN_SPOTIFY, SKIN_GENERIC,
)

SPOTIFY_KINDS = ('track', 'album', 'playlist', 'episode', 'show', 'artist')

# Clip.source_platform -> skin
SOURCE_PLATFORM_TO_SKIN: Dict[str, str] = {
    'x_twitter': SKIN_X,
    'youtube': SKIN_YOUTUBE,
    'reddit': SKIN_REDDIT,
    'github': SKIN_GITHUB,
    'linkedin': SKIN_LINKEDIN,
    'instagram': SKIN_INSTAGRAM,
    'spotify': SKIN_SPOTIFY,
    # tiktok / web fall through to host sniffing, then generic.
}

# Host suffix -> skin (used when source_platform is 'web' or unknown)
HOST_TO_SKIN: Tuple[Tuple[str, str], ...] = (
    ('x.com', SKIN_X),
    ('twitter.com', SKIN_X),
    ('youtube.com', SKIN_YOUTUBE),
    ('youtu.be', SKIN_YOUTUBE),
    ('reddit.com', SKIN_REDDIT),
    ('redd.it', SKIN_REDDIT),
    ('github.com', SKIN_GITHUB),
    ('linkedin.com', SKIN_LINKEDIN),
    ('instagram.com', SKIN_INSTAGRAM),
    ('spotify.com', SKIN_SPOTIFY),
)

# ---------------------------------------------------------------------------
# Field specs: (field, type, max_len_or_items)
# Order inside each list == drop priority REVERSED (last field dropped first).
# ---------------------------------------------------------------------------
_STR, _INT, _BOOL, _URL, _TS, _STR_LIST, _URL_LIST = (
    'str', 'int', 'bool', 'url', 'ts', 'str_list', 'url_list',
)

SKIN_FIELDS: Dict[str, List[Tuple[str, str, int]]] = {
    SKIN_X: [
        ('handle', _STR, 32), ('name', _STR, 50), ('avatar', _URL, 160),
        ('verified', _BOOL, 0), ('media', _URL_LIST, 4), ('posted_at', _TS, 25),
        ('likes', _INT, 0), ('reposts', _INT, 0), ('replies', _INT, 0), ('views', _INT, 0),
    ],
    SKIN_YOUTUBE: [
        ('video_id', _STR, 16), ('channel', _STR, 60), ('duration', _INT, 0),
        ('is_short', _BOOL, 0), ('views', _INT, 0), ('published_at', _TS, 25),
        ('channel_avatar', _URL, 160),
    ],
    SKIN_REDDIT: [
        ('subreddit', _STR, 40), ('author', _STR, 40), ('upvotes', _INT, 0),
        ('comments', _INT, 0), ('nsfw', _BOOL, 0), ('flair', _STR, 30), ('thumb', _URL, 160),
        ('posted_at', _TS, 25),
    ],
    SKIN_GITHUB: [
        ('owner', _STR, 40), ('repo', _STR, 80), ('stars', _INT, 0),
        ('language', _STR, 24), ('forks', _INT, 0), ('license', _STR, 24),
        ('topics', _STR_LIST, 3),
    ],
    SKIN_LINKEDIN: [
        ('name', _STR, 60), ('headline', _STR, 80), ('avatar', _URL, 160),
        ('reactions', _INT, 0), ('comments', _INT, 0),
    ],
    SKIN_INSTAGRAM: [
        ('handle', _STR, 32), ('name', _STR, 50), ('is_reel', _BOOL, 0),
        ('media', _URL_LIST, 4), ('avatar', _URL, 160), ('likes', _INT, 0),
    ],
    SKIN_SPOTIFY: [
        ('kind', _STR, 10), ('artist', _STR, 60), ('cover', _URL, 160),
        ('duration', _INT, 0), ('album', _STR, 60),
    ],
    SKIN_GENERIC: [
        ('site', _STR, 40), ('read_min', _INT, 0), ('image', _URL, 160),
        ('author', _STR, 50), ('published_at', _TS, 25),
    ],
}


# ---------------------------------------------------------------------------
# Skin resolution
# ---------------------------------------------------------------------------
def _host(url: str) -> str:
    try:
        host = (urlparse(url or '').hostname or '').lower()
    except ValueError:
        return ''
    return host[4:] if host.startswith('www.') else host


def resolve_skin(source_platform: Optional[str], url: Optional[str] = '') -> str:
    """Return the skin for a clip. Mirrors resolveSkin() in TS and Dart."""
    skin = SOURCE_PLATFORM_TO_SKIN.get((source_platform or '').lower())
    if skin:
        return skin
    host = _host(url or '')
    if host:
        for suffix, candidate in HOST_TO_SKIN:
            if host == suffix or host.endswith('.' + suffix):
                return candidate
    return SKIN_GENERIC


# ---------------------------------------------------------------------------
# Sanitization
# ---------------------------------------------------------------------------
def _clean_str(value: Any, max_len: int) -> Optional[str]:
    if value is None or isinstance(value, (dict, list)):
        return None
    text = ' '.join(str(value).split())
    if not text:
        return None
    return text[:max_len]


def _clean_url(value: Any, max_len: int) -> Optional[str]:
    text = _clean_str(value, 10_000)
    if not text or len(text) > max_len:
        return None
    if text.startswith('http://'):
        text = 'https://' + text[len('http://'):]
    return text if text.startswith('https://') else None


def _clean_int(value: Any) -> Optional[int]:
    if isinstance(value, bool) or value is None:
        return None
    try:
        number = int(float(str(value).replace(',', '').strip()))
    except (TypeError, ValueError):
        return None
    return number if number >= 0 else None


def _clean_value(kind: str, value: Any, limit: int) -> Any:
    if kind == _STR or kind == _TS:
        return _clean_str(value, limit)
    if kind == _URL:
        return _clean_url(value, limit)
    if kind == _INT:
        return _clean_int(value)
    if kind == _BOOL:
        return True if value is True or str(value).lower() in ('true', '1') else None
    if kind in (_STR_LIST, _URL_LIST):
        if not isinstance(value, (list, tuple)):
            return None
        cleaner = (lambda v: _clean_url(v, 160)) if kind == _URL_LIST else (lambda v: _clean_str(v, 24))
        items = [c for c in (cleaner(v) for v in value) if c][:limit]
        return items or None
    return None


def _size(payload: Dict[str, Any]) -> int:
    return len(json.dumps(payload, separators=(',', ':'), ensure_ascii=False).encode('utf-8'))


def normalize_platform_meta(skin: str, raw: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Whitelist, sanitize, and budget-cap raw scraper output for ``skin``.
    Always returns a valid envelope (at minimum ``{"v":1,"skin":...}``).
    """
    if skin not in SKINS:
        skin = SKIN_GENERIC
    raw = raw or {}
    payload: Dict[str, Any] = {'v': PLATFORM_META_VERSION, 'skin': skin}

    specs = SKIN_FIELDS[skin]
    for field, kind, limit in specs:
        cleaned = _clean_value(kind, raw.get(field), limit)
        if cleaned is not None:
            if field == 'kind' and cleaned not in SPOTIFY_KINDS:
                continue
            payload[field] = cleaned

    if _size(payload) <= PLATFORM_META_BYTE_BUDGET:
        return payload

    # 1) shrink media lists to a single item
    for list_field in ('media', 'topics'):
        if isinstance(payload.get(list_field), list) and len(payload[list_field]) > 1:
            payload[list_field] = payload[list_field][:1]
            if _size(payload) <= PLATFORM_META_BYTE_BUDGET:
                return payload

    # 2) drop fields from lowest priority (end of spec) upward
    for field, _kind, _limit in reversed(specs):
        if field in payload:
            payload.pop(field)
            if _size(payload) <= PLATFORM_META_BYTE_BUDGET:
                break

    logger.debug('platform_meta trimmed to budget for skin=%s', skin)
    return payload


def build_platform_meta(source_platform: str, url: str, raw: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Convenience: resolve skin + normalize in one call (used by scrapers in Part 2)."""
    return normalize_platform_meta(resolve_skin(source_platform, url), raw)


def get_platform_meta(extra_metadata: Optional[Dict[str, Any]], source_platform: str, url: str) -> Dict[str, Any]:
    """
    Read path used by serializers: returns the stored envelope if valid,
    otherwise a minimal envelope with the resolved skin (never raises).
    """
    stored = (extra_metadata or {}).get(PLATFORM_META_KEY)
    skin = resolve_skin(source_platform, url)
    if isinstance(stored, dict) and stored.get('skin') in SKINS:
        return stored
    return {'v': PLATFORM_META_VERSION, 'skin': skin}
