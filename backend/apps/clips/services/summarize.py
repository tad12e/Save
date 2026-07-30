"""
AI-powered summarization using Google Gemini.

Calls the Gemini REST API directly (no SDK dependency) to generate
a structured summary of a saved clip's page content.

Falls back gracefully if:
  - GEMINI_API_KEY is not configured
  - The API call fails or times out
"""

import json
import logging
import urllib.error
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)

# The prompt template instructs Gemini to return structured JSON.
_SYSTEM_PROMPT = """\
You are a concise content analyst for a web clipper app called "Save".
The user has saved a webpage. Analyse the provided page content and any
highlighted text they selected, then return a JSON object with these fields:

{
  "title": "A clean, descriptive title (max 120 chars). Prefer the actual page title if it is good; otherwise rewrite it.",
  "summary": "A 2-3 sentence summary capturing the key value of this page. Be specific, not generic. Max 400 chars.",
  "content_type": "One of: job, scholarship, article, event, course, tool, video, social_post, webpage",
  "tags": ["up to 6 lowercase tags relevant to the content"]
}

Rules:
- Return ONLY the raw JSON object. No markdown fences, no extra text.
- If selected_text is provided, weight your summary towards that content.
- Tags should be specific and useful for filtering (e.g. "remote", "python", "startup", "ai", "design").
"""


def ai_summarize(url: str, page_text: str, selected_text: str = '') -> dict | None:
    """
    Call Google Gemini to summarize a clip.

    Returns a dict with keys: title, summary, content_type, tags
    Returns None if the API key is missing or the call fails.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    model = getattr(settings, 'GEMINI_MODEL', 'gemini-2.0-flash')

    if not api_key:
        logger.info('GEMINI_API_KEY not configured — skipping AI summarization.')
        return None

    # Build the user message with the page content
    user_content = f'URL: {url}\n\n'
    if selected_text:
        user_content += f'--- SELECTED TEXT ---\n{selected_text[:2000]}\n\n'
    user_content += f'--- PAGE CONTENT ---\n{page_text[:6000]}'

    payload = {
        'contents': [
            {
                'role': 'user',
                'parts': [
                    {'text': f'{_SYSTEM_PROMPT}\n\n{user_content}'},
                ],
            },
        ],
        'generationConfig': {
            'temperature': 0.3,
            'maxOutputTokens': 512,
            'responseMimeType': 'application/json',
        },
    }

    api_url = (
        f'https://generativelanguage.googleapis.com/v1beta/models/{model}'
        f':generateContent?key={api_key}'
    )

    request = urllib.request.Request(
        api_url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )

    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            data = json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode() if exc.fp else str(exc)
        logger.error('Gemini API HTTP error: %s', body[:500])
        return None
    except (urllib.error.URLError, TimeoutError) as exc:
        logger.error('Gemini API request failed: %s', exc)
        return None

    # Parse the response — Gemini returns candidates[0].content.parts[0].text
    try:
        text = data['candidates'][0]['content']['parts'][0]['text']
        result = json.loads(text)
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        logger.error('Failed to parse Gemini response: %s — raw: %s', exc, str(data)[:500])
        return None

    # Validate the expected keys exist
    if not all(k in result for k in ('title', 'summary', 'content_type', 'tags')):
        logger.error('Gemini response missing expected keys: %s', result.keys())
        return None

    # Enforce constraints
    result['title'] = str(result['title'])[:512]
    result['summary'] = str(result['summary'])[:500]
    result['content_type'] = str(result['content_type']).lower()
    if isinstance(result['tags'], list):
        result['tags'] = [str(t).lower() for t in result['tags'][:6]]
    else:
        result['tags'] = []

    logger.info('Gemini summarization succeeded: title=%r, type=%s', result['title'], result['content_type'])
    return result
