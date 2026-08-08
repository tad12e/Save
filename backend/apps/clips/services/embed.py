"""
Embedding generation using Google Gemini REST API.

Generates 768-dimensional text embeddings using Gemini's text-embedding-004.
Falls back gracefully if:
  - GEMINI_API_KEY is missing or invalid
  - API request fails or times out
"""

import json
import logging
import urllib.error
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)


def generate_embedding(text: str) -> list[float] | None:
    """
    Generate a 768-dim float vector for input text using Gemini API.

    Returns list[float] on success, None on failure or missing API key.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    model = getattr(settings, 'GEMINI_EMBEDDING_MODEL', 'text-embedding-004')

    if not api_key or api_key == 'your-gemini-api-key-here':
        logger.info('GEMINI_API_KEY not configured — skipping embedding generation.')
        return None

    cleaned_text = (text or '').strip()
    if not cleaned_text:
        return None

    # Gemini embedContent API payload
    payload = {
        'model': f'models/{model}',
        'content': {
            'parts': [
                {'text': cleaned_text[:4000]}
            ]
        }
    }

    api_url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent?key={api_key}'

    request = urllib.request.Request(
        api_url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode() if exc.fp else str(exc)
        logger.error('Gemini Embedding API HTTP error: %s', body[:500])
        return None
    except (urllib.error.URLError, TimeoutError) as exc:
        logger.error('Gemini Embedding API request failed: %s', exc)
        return None

    try:
        values = data['embedding']['values']
        if isinstance(values, list) and len(values) > 0:
            logger.info('Generated embedding of length %d', len(values))
            return values
    except (KeyError, TypeError) as exc:
        logger.error('Failed to parse Gemini embedding response: %s', exc)

    return None
