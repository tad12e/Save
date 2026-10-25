import html
import json
import logging
import re
import urllib.error
import urllib.request
from urllib.parse import urlparse

from .url import is_safe_public_url

logger = logging.getLogger(__name__)

CONTENT_TYPE_KEYWORDS = {
    'book': ['book', 'isbn', 'hardcover', 'paperback', 'goodreads', 'reading list', 'novel', 'author', 'audiobook', 'chapter', 'nonfiction', 'fiction', 'bestseller'],
    'job': ['apply now', 'job description', 'we are hiring', 'open positions', 'salary', 'hiring', 'intern', 'internship', 'eligible batch', 'apply here', 'full time', 'part time', 'remote role', 'engineering intern', 'developer intern', 'sde intern', 'junior developer', 'careers', 'apply at'],
    'scholarship': ['scholarship', 'grant', 'funding', 'call for applications', 'fellowship'],
    'event': ['register now', 'eventbrite', 'meetup', 'limited spots', 'early bird', 'hackathon', 'webinar', 'conference'],
    'course': ['enroll', 'bootcamp', 'certification', 'cohort', 'free course', 'tutorial'],
    'article': ['blog', 'article', 'news', 'published'],
}


def _fetch_page_text(url: str) -> tuple[str, str, str]:
    if not is_safe_public_url(url):
        logger.warning("SSRF protection: Aborted request to restricted or private destination: %s", url)
        return '', '', ''

    request = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=6) as response:
            raw_html = response.read().decode('utf-8', errors='replace')
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, Exception):
        return '', '', ''

    title_match = re.search(r'<title[^>]*>(.*?)</title>', raw_html, re.IGNORECASE | re.DOTALL)
    title = html.unescape(re.sub(r'\s+', ' ', title_match.group(1)).strip()) if title_match else ''

    cleaned_html = raw_html
    for tag in ('script', 'style', 'noscript'):
        cleaned_html = re.sub(rf'<{tag}[^>]*>.*?</{tag}>', ' ', cleaned_html, flags=re.IGNORECASE | re.DOTALL)

    text = re.sub(r'<[^>]+>', ' ', cleaned_html)
    text = html.unescape(re.sub(r'\s+', ' ', text)).strip()
    return title, text[:8000], raw_html


def _detect_content_type(text: str = '', url: str = '') -> str:
    # Handle swapped or single-argument invocations gracefully
    if (text.startswith('http://') or text.startswith('https://')) and not (url.startswith('http://') or url.startswith('https://')):
        url, text = text, url
    url_lower = (url or '').lower()
    parsed = urlparse(url_lower)
    domain = parsed.netloc.replace('www.', '')
    path = parsed.path

    # 1. Deterministic Video platforms & Reel paths
    if any(vd in domain for vd in ('youtube.com', 'youtu.be', 'tiktok.com', 'vimeo.com', 'dailymotion.com')):
        return 'video'
    if 'instagram.com' in domain and any(p in path for p in ('/reel/', '/reels/', '/tv/')):
        return 'video'

    # 2. Audio & Podcasts
    if any(ad in domain for ad in ('spotify.com', 'soundcloud.com', 'bandcamp.com', 'anchor.fm')):
        return 'podcast' if '/episode/' in path or '/show/' in path else 'music'
    if 'podcasts.apple.com' in domain:
        return 'podcast'

    # 3. Code & Repositories
    if domain in ('github.com', 'gitlab.com', 'bitbucket.org', 'huggingface.co'):
        return 'project' if re.search(r'^/[^/]+/[^/]+', path) else 'programming'

    # 4. Jobs & Careers
    if any(jd in domain for jd in ('greenhouse.io', 'lever.co', 'workday.com', 'ashbyhq.com', 'smartrecruiters.com', 'wellfound.com', 'grants.gov')):
        return 'job'
    if any(jp in path for jp in ('/careers', '/jobs', '/internships', '/open-positions', '/apply')):
        return 'job'

    # 5. Events
    if any(ed in domain for ed in ('eventbrite.com', 'lu.ma', 'luma.com', 'meetup.com', 'partiful.com', 'hopin.com')):
        return 'event'

    # 6. Books & Reading
    if any(bd in domain for bd in ('goodreads.com', 'openlibrary.org', 'books.google.', 'storytel.com', 'audible.com', 'bookshop.org', 'barnesandnoble.com')):
        return 'book'
    if '/book/' in path or '/books/' in path:
        return 'book'

    # 7. E-commerce / Deals
    if any(cd in domain for cd in ('amazon.', 'gumroad.com', 'etsy.com', 'ebay.com', 'aliexpress.com')):
        return 'deal'
    if any(cp in path for cp in ('/product/', '/products/', '/pricing/', '/cart', '/checkout')):
        return 'deal'

    # 7. Articles / News
    if any(nd in domain for nd in ('substack.com', 'medium.com', 'arxiv.org', 'biorxiv.org', 'dev.to', 'hashnode.dev')):
        return 'article'

    # 8. Social Posts
    if domain in ('x.com', 'twitter.com', 'threads.net', 'bsky.app'):
        return 'post'
    if 'instagram.com' in domain:
        return 'post'
    if 'reddit.com' in domain and '/comments/' in path:
        return 'post'

    # 9. Fallback: text keyword heuristic
    haystack = f'{text} {url}'.lower()
    best_type = 'webpage'
    best_score = 0

    for content_type, keywords in CONTENT_TYPE_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in haystack)
        if score > best_score:
            best_score = score
            best_type = content_type

    return best_type if best_score >= 1 else 'webpage'


def _build_tags(content_type: str, url: str, text: str) -> list[str]:
    tags = {content_type}
    host = urlparse(url).netloc.replace('www.', '')
    if host:
        tags.add(host.split('.')[0])

    for keyword in ('remote', 'internship', 'startup', 'research', 'course', 'intern', 'hiring', 'engineering'):
        if keyword in text.lower():
            tags.add(keyword)

    return sorted(tags)[:6]


def _build_summary(selected_text: str, page_text: str, title: str) -> str:
    if selected_text.strip():
        summary = selected_text.strip()
        if len(summary) > 400:
            summary = f'{summary[:397]}...'
        return summary

    if page_text:
        from apps.clips.services.sanitizer import clean_clip_summary
        cleaned_text = clean_clip_summary(page_text, title)
        sentences = re.split(r'(?<=[.!?])\s+', cleaned_text)
        summary = ' '.join(sentence.strip() for sentence in sentences[:2] if sentence.strip())
        if summary:
            if len(summary) > 400:
                summary = f'{summary[:397]}...'
            return summary

    return title or 'Saved webpage clip.'


def extract_clip_metadata(clip) -> dict:
    page_title, page_text, raw_html = _fetch_page_text(clip.url)
    selected_text = (clip.selected_text or '').strip()

    from apps.clips.services.source_detector import (
        detect_embedded_resources,
        detect_source_platform,
        extract_external_job_url,
    )
    platform, author, post_url = detect_source_platform(clip.url)
    embedded_resources = detect_embedded_resources(f'{selected_text} {page_text}')
    extracted_job_url = extract_external_job_url(f'{selected_text} {page_text}', source_url=clip.url)

    # --- Try AI-powered summarization first ---
    metadata = None
    try:
        goal_prompt = ''
        if getattr(clip, 'custom_page', None) and clip.custom_page.ai_goal_prompt:
            goal_prompt = clip.custom_page.ai_goal_prompt

        ai_result = ai_summarize(
            url=clip.url,
            page_text=page_text,
            selected_text=selected_text,
            ai_goal_prompt=goal_prompt,
        )
        if ai_result:
            logger.info('Using AI summary for clip URL: %s', clip.url)
            metadata = ai_result
    except Exception as exc:
        logger.warning('AI summarization import/call failed, falling back to regex: %s', exc)

    from apps.clips.services.sanitizer import clean_clip_title
    from apps.clips.services.summarize import clean_text

    # --- Fallback: regex-based extraction ---
    if not metadata:
        logger.info('Using regex fallback for clip URL: %s', clip.url)
        title = clean_clip_title(clean_text(page_title or urlparse(clip.url).netloc or 'Saved clip'), clip.url)
        summary = clean_text(_build_summary(selected_text, page_text, title))
        if platform == 'x_twitter':
            from apps.clips.services.sanitizer import clean_tweet_text
            summary = clean_tweet_text(summary, author_name=author, handle=author)
            if not summary and author:
                summary = f"Post by {author} on X"
        elif platform == 'reddit':
            resolved_reddit_url = clip.url
            if '/s/' in clip.url:
                try:
                    req = urllib.request.Request(
                        clip.url,
                        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'}
                    )
                    with urllib.request.urlopen(req, timeout=3.0) as resp:
                        resolved = resp.geturl()
                        if resolved and '/comments/' in resolved:
                            resolved_reddit_url = resolved
                except Exception as exc:
                    logger.debug("Reddit redirect resolution failed for %s: %s", clip.url, exc)

            slug_match = re.search(r'/comments/[a-zA-Z0-9]+(?:/([a-zA-Z0-9_\-]+))?', resolved_reddit_url)
            if slug_match and slug_match.group(1):
                slug_title = slug_match.group(1).replace('-', ' ').replace('_', ' ').strip().title()
                if slug_title:
                    title = slug_title

            post_match = re.search(r'/r/([^/]+)/comments/([a-zA-Z0-9]+)', resolved_reddit_url)
            if post_match:
                sub, post_id = post_match.group(1), post_match.group(2)
                try:
                    req = urllib.request.Request(
                        f'https://www.reddit.com/r/{sub}/comments/{post_id}.json',
                        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', 'Accept': 'application/json'}
                    )
                    with urllib.request.urlopen(req, timeout=3.0) as resp:
                        res_data = json.loads(resp.read().decode('utf-8', errors='replace'))
                        if isinstance(res_data, list) and len(res_data) > 0:
                            post_info = res_data[0]['data']['children'][0]['data']
                            if post_info.get('title'):
                                title = post_info['title'].strip()
                            if post_info.get('selftext') and not selected_text:
                                summary = post_info['selftext'].strip()
                except Exception as exc:
                    logger.debug("Reddit post JSON metadata fetch failed for r/%s/%s: %s", sub, post_id, exc)
            title = re.sub(r'\s*[:\-–—|]\s*(r/[a-zA-Z0-9_]+|Reddit|reddit\.com)$', '', title, flags=re.IGNORECASE).strip()
        if title.lower() in ('x.com', 'twitter.com', 't.co') or not title or title.startswith('http'):
            if summary and summary != title and summary != 'Saved webpage clip.':
                title = summary[:65] + ('...' if len(summary) > 65 else '')
        content_type = _detect_content_type(f'{selected_text} {page_text}', clip.url)
        tags = _build_tags(content_type, clip.url, f'{selected_text} {page_text}')
        metadata = {
            'title': title[:512],
            'summary': summary,
            'content_type': content_type,
            'tags': tags,
            'category_fields': {},
        }
    elif 'category_fields' not in metadata:
        metadata['category_fields'] = {}

    # Attach detected source platform & embedded resource metadata
    metadata['source_platform'] = platform
    metadata['source_author'] = author
    metadata['source_post_url'] = post_url
    metadata['embedded_resources'] = embedded_resources
    metadata['raw_content'] = page_text or selected_text

    if extracted_job_url:
        metadata['extracted_resource_url'] = extracted_job_url
        metadata['category_fields']['job_url'] = extracted_job_url
        metadata['category_fields']['apply_url'] = extracted_job_url
        if metadata.get('content_type') == 'webpage':
            metadata['content_type'] = 'job'
    elif embedded_resources:
        metadata['is_resource_hub'] = True
        metadata['extracted_resource_url'] = embedded_resources[0]['url']
    else:
        metadata['is_resource_hub'] = False
        metadata['extracted_resource_url'] = ''

    # Resolve action intent if not already extracted by AI
    from apps.clips.services.intent_detector import IntentDetector, clean_action_intent
    if not metadata.get('intent'):
        detected = IntentDetector.detect_heuristic_intent(
            url=clip.url,
            text=f'{selected_text} {page_text}',
            content_type=metadata.get('content_type', ''),
        )
        metadata['intent'] = clean_action_intent(detected or 'other')
    else:
        metadata['intent'] = clean_action_intent(metadata['intent'])

    # Platform-specific lightweight metadata enrichment (Part 2)
    from apps.clips.services.platform_enrich import enrich_platform_meta
    try:
        platform_meta = enrich_platform_meta(
            url=clip.url,
            source_platform=platform,
            html_text=raw_html,
            text=page_text or selected_text,
        )
        metadata['platform_meta'] = platform_meta
    except Exception as enrich_exc:
        logger.warning('Platform enrichment failed for %s: %s', clip.url, enrich_exc)

    return metadata

