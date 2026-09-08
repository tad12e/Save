import html
import json
import logging
import re
import urllib.error
import urllib.request
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

CONTENT_TYPE_KEYWORDS = {
    'job': ['apply now', 'job description', 'we are hiring', 'open positions', 'salary', 'hiring', 'intern', 'internship', 'eligible batch', 'apply here', 'full time', 'part time', 'remote role', 'engineering intern', 'developer intern', 'sde intern', 'junior developer', 'careers', 'apply at'],
    'scholarship': ['scholarship', 'grant', 'funding', 'call for applications', 'fellowship'],
    'event': ['register now', 'eventbrite', 'meetup', 'limited spots', 'early bird', 'hackathon', 'webinar', 'conference'],
    'course': ['enroll', 'bootcamp', 'certification', 'cohort', 'free course', 'tutorial'],
    'article': ['blog', 'article', 'news', 'published'],
}


def _fetch_page_text(url: str) -> tuple[str, str]:
    request = urllib.request.Request(
        url,
        headers={'User-Agent': 'SaveClipperBot/1.0 (+https://save.app)'},
    )

    try:
        with urllib.request.urlopen(request, timeout=6) as response:
            raw_html = response.read().decode('utf-8', errors='replace')
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, Exception):
        return '', ''

    title_match = re.search(r'<title[^>]*>(.*?)</title>', raw_html, re.IGNORECASE | re.DOTALL)
    title = html.unescape(re.sub(r'\s+', ' ', title_match.group(1)).strip()) if title_match else ''

    for tag in ('script', 'style', 'noscript'):
        raw_html = re.sub(rf'<{tag}[^>]*>.*?</{tag}>', ' ', raw_html, flags=re.IGNORECASE | re.DOTALL)

    text = re.sub(r'<[^>]+>', ' ', raw_html)
    text = html.unescape(re.sub(r'\s+', ' ', text)).strip()
    return title, text[:8000]


def _detect_content_type(text: str, url: str) -> str:
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
        sentences = re.split(r'(?<=[.!?])\s+', page_text)
        summary = ' '.join(sentence.strip() for sentence in sentences[:2] if sentence.strip())
        if summary:
            if len(summary) > 400:
                summary = f'{summary[:397]}...'
            return summary

    return title or 'Saved webpage clip.'


def extract_clip_metadata(clip) -> dict:
    page_title, page_text = _fetch_page_text(clip.url)
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
        from apps.clips.services.summarize import ai_summarize

        ai_result = ai_summarize(
            url=clip.url,
            page_text=page_text,
            selected_text=selected_text,
        )
        if ai_result:
            logger.info('Using AI summary for clip URL: %s', clip.url)
            metadata = ai_result
    except Exception as exc:
        logger.warning('AI summarization import/call failed, falling back to regex: %s', exc)

    from apps.clips.services.summarize import clean_text

    # --- Fallback: regex-based extraction ---
    if not metadata:
        logger.info('Using regex fallback for clip URL: %s', clip.url)
        title = clean_text(page_title or urlparse(clip.url).netloc or 'Saved clip')
        summary = clean_text(_build_summary(selected_text, page_text, title))
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

    return metadata

