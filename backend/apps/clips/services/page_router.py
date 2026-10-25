import logging
import re
from typing import Optional
from urllib.parse import urlparse

from apps.clips.models import CustomPage, Clip

logger = logging.getLogger(__name__)

BOOK_DOMAINS = (
    'goodreads.com',
    'openlibrary.org',
    'books.google.',
    'storytel.com',
    'audible.com',
    'bookshop.org',
    'barnesandnoble.com',
    'penguinrandomhouse.com',
    'harpercollins.com',
    'simonandschuster.com',
)

BOOK_KEYWORDS = {
    'isbn',
    'hardcover',
    'paperback',
    'goodreads',
    'audiobook',
    'reading list',
    'book review',
    'nonfiction',
    'fiction',
    'bestseller',
    'novel',
    'memoir',
    'author',
}


def is_book_content(
    content_type: str = '',
    url: str = '',
    text: str = '',
    intent: str = '',
    tags: Optional[list[str]] = None,
) -> bool:
    """
    Determines if content is book or reading related.
    """
    if content_type in ('book', 'reading'):
        return True
    if intent in ('read', 'buy_book'):
        return True

    url_lower = (url or '').lower()
    parsed = urlparse(url_lower)
    domain = parsed.netloc.replace('www.', '')
    path = parsed.path

    if any(bd in domain for bd in BOOK_DOMAINS):
        return True

    if '/book/' in path or '/books/' in path or '/title/' in path:
        return True

    tags_lower = [str(t).lower() for t in (tags or [])]
    if any(t in ('book', 'books', 'reading', 'novel', 'literature', 'nonfiction') for t in tags_lower):
        return True

    haystack = f"{text[:2000]} {url_lower}".lower()
    matches = sum(1 for kw in BOOK_KEYWORDS if kw in haystack)
    return matches >= 2


def find_matching_custom_page(
    user,
    content_type: str = '',
    url: str = '',
    text: str = '',
    intent: str = '',
    tags: Optional[list[str]] = None,
) -> Optional[CustomPage]:
    """
    Finds a user's CustomPage workspace that best matches the clip's metadata.
    For example, if the user created a "Books" page and a new clip is a book,
    it automatically routes into that page.
    """
    if not user or not user.is_authenticated:
        return None

    pages = list(CustomPage.objects.filter(user=user))
    if not pages:
        return None

    tags_lower = [str(t).strip().lower() for t in (tags or [])]
    content_type_lower = (content_type or '').strip().lower()
    intent_lower = (intent or '').strip().lower()
    url_lower = (url or '').lower()
    text_sample = (text or '')[:1000].lower()

    # 0. Check for specific Author Sub-Page match (e.g. Books > Walter Isaacson)
    for page in pages:
        if page.parent_id:
            page_name_clean = page.name.lower().strip()
            if len(page_name_clean) >= 3 and (
                page_name_clean in text_sample or 
                page_name_clean in url_lower or 
                any(page_name_clean in t for t in tags_lower)
            ):
                logger.info("Auto-routed clip %s to author/sub-page '%s' (parent: %s)", url, page.name, page.parent_id)
                return page

    # 1. Check for Book / Reading page match
    if is_book_content(content_type_lower, url_lower, text_sample, intent_lower, tags_lower):
        for page in pages:
            # Prefer top-level book page if not already matched to an author sub-page
            if page.parent_id:
                continue
            page_slug = page.slug.lower()
            page_name = page.name.lower()
            if any(term in page_slug or term in page_name for term in ('book', 'reading', 'read', 'library')):
                logger.info("Auto-routed book clip %s to master book space '%s' (%s)", url, page.name, page.id)
                return page

    # 2. General custom page matching by explicit content_types configuration
    for page in pages:
        configured_types = [str(c).lower().strip() for c in (page.content_types or [])]
        # Ignore overly generic defaults when matching
        specific_types = [t for t in configured_types if t not in ('general', 'article', 'webpage')]
        if content_type_lower and content_type_lower in specific_types:
            logger.info("Auto-routed clip %s to page '%s' by content_type %s", url, page.name, content_type_lower)
            return page

    # 3. Match by page name / slug against tags, intent, or keywords
    for page in pages:
        page_slug = page.slug.lower()
        page_name = page.name.lower()

        # Direct tag match
        if page_slug in tags_lower or page_name in tags_lower:
            logger.info("Auto-routed clip %s to page '%s' by tag match", url, page.name)
            return page

        # Intent match (e.g. intent='cook' matches 'Cooking' or 'Recipes')
        if intent_lower and intent_lower != 'other':
            if intent_lower in page_slug or intent_lower in page_name:
                logger.info("Auto-routed clip %s to page '%s' by intent %s", url, page.name, intent_lower)
                return page

    return None


def match_clip_to_page(clip: Clip) -> Optional[CustomPage]:
    """
    Helper to match an existing Clip model instance to an appropriate CustomPage.
    """
    if clip.custom_page_id:
        return clip.custom_page

    return find_matching_custom_page(
        user=clip.user,
        content_type=clip.content_type or '',
        url=clip.url or '',
        text=f"{clip.title or ''} {clip.summary or ''} {clip.selected_text or ''}",
        intent=clip.intent or '',
        tags=clip.tags or [],
    )
