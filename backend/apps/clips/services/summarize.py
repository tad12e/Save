"""
AI-powered summarization using Google Gemini with Schema-Enforced Structured Outputs (Pydantic + responseSchema).

Uses Gemini's native constrained decoding (responseSchema) to mathematically
guarantee that responses conform strictly to the specified JSON schema.
Validates the parsed output via Pydantic models for type safety.
"""

import json
import logging
import re
import urllib.error
import urllib.request
from typing import Any

from django.conf import settings
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


def clean_text(text: str) -> str:
    """
    Clean text before sending to AI or saving to database/Google Sheets.
    Strips raw newlines, tabs, excessive whitespace, and common scraping noise.
    """
    if not text:
        return ''
    # Strip HTML tags if any
    text = re.sub(r'<[^>]+>', ' ', str(text))
    # Remove scraping boilerplate
    text = re.sub(r'(?i)\bshare\s+on\s+(twitter|linkedin|facebook|reddit|pinterest)\b', '', text)
    text = re.sub(r'(?i)\bdate\s+published[:\s]*', '', text)
    text = re.sub(r'(?i)\bexpected\s+start\s+date[:\s]*', '', text)
    # Replace newlines, carriage returns, tabs with a single space
    text = re.sub(r'[\r\n\t]+', ' ', text)
    # Collapse multiple consecutive spaces
    text = re.sub(r'\s{2,}', ' ', text)
    return text.strip()


class CategoryFields(BaseModel):
    company: str = Field(default="", description="For jobs/opportunities: Company / Employer name")
    location: str = Field(default="", description="Location (Remote, Hybrid, San Francisco, etc.)")
    salary: str = Field(default="", description="Salary or compensation / price")
    requirements_summary: str = Field(default="", description="Key qualifications or stack")
    author: str = Field(default="", description="Author name or publication outlet")
    reading_time: str = Field(default="", description="Estimated read time e.g. 5 min read")
    key_takeaways: str = Field(default="", description="Concise takeaway sentence")
    sponsor: str = Field(default="", description="Sponsoring organization/university")
    award_amount: str = Field(default="", description="Funding or price amount")
    eligibility: str = Field(default="", description="Eligibility criteria")
    organizer: str = Field(default="", description="Organizer / Host name for events")
    date_time: str = Field(default="", description="Date & Time text")
    category_domain: str = Field(default="", description="Domain or industry")
    pricing_model: str = Field(default="", description="Pricing model e.g. Free, Open-Source, $15/mo")
    features_summary: str = Field(default="", description="Core feature or capability highlight")


class ClipAnalysisResponse(BaseModel):
    title: str = Field(description="Clean, concise title without boilerplate (max 120 chars)")
    summary: str = Field(description="1-2 clean single-line sentences without newlines (max 350 chars)")
    category_name: str = Field(description="Capitalized category tab name (e.g. 'Jobs', 'Articles', 'Scholarships', 'Recipes', 'Real Estate', 'Podcasts', 'Tools')")
    content_type: str = Field(description="lowercase slug e.g. job, scholarship, article, event, tool, real_estate, recipe, podcast, webpage")
    tags: list[str] = Field(default_factory=list, description="3-6 lowercase specific tags")
    deadline_date: str = Field(default="", description="YYYY-MM-DD or empty string")
    music_embed_url: str = Field(default="", description="Direct audio URL if applicable")
    dynamic_headers: list[str] = Field(default_factory=list, description="List of 6-9 column names for the spreadsheet tab")
    dynamic_row: dict[str, str] = Field(default_factory=dict, description="Mapping of column names to extracted values")
    category_fields: CategoryFields = Field(default_factory=CategoryFields)


# Gemini API native responseSchema definition enforcing the Pydantic structure
_GEMINI_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "title": {
            "type": "STRING",
            "description": "Clean, concise title without boilerplate (max 120 chars)"
        },
        "summary": {
            "type": "STRING",
            "description": "1-2 clean single-line sentences without newlines (max 350 chars)"
        },
        "category_name": {
            "type": "STRING",
            "description": "Capitalized category tab name e.g. Jobs, Articles, Scholarships, Recipes, Real Estate, Podcasts, Tools, Research Papers"
        },
        "content_type": {
            "type": "STRING",
            "description": "lowercase slug e.g. job, scholarship, article, event, tool, real_estate, recipe, podcast, webpage"
        },
        "tags": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "3-6 lowercase tags"
        },
        "deadline_date": {
            "type": "STRING",
            "description": "YYYY-MM-DD or empty string"
        },
        "music_embed_url": {
            "type": "STRING",
            "description": "Direct audio URL if Spotify/SoundCloud/YouTube Music, otherwise empty"
        },
        "dynamic_headers": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "List of 6-9 column names for the spreadsheet tab"
        },
        "dynamic_row": {
            "type": "OBJECT",
            "properties": {
                "Title": {"type": "STRING"},
                "URL": {"type": "STRING"},
                "Summary": {"type": "STRING"},
                "Author": {"type": "STRING"},
                "Company": {"type": "STRING"},
                "Location": {"type": "STRING"},
                "Salary": {"type": "STRING"},
                "Price": {"type": "STRING"},
                "Deadline": {"type": "STRING"},
                "Source Platform": {"type": "STRING"},
                "Saved At": {"type": "STRING"}
            },
            "description": "Mapping of column names to extracted values"
        },
        "category_fields": {
            "type": "OBJECT",
            "properties": {
                "company": {"type": "STRING"},
                "location": {"type": "STRING"},
                "salary": {"type": "STRING"},
                "requirements_summary": {"type": "STRING"},
                "author": {"type": "STRING"},
                "reading_time": {"type": "STRING"},
                "key_takeaways": {"type": "STRING"},
                "sponsor": {"type": "STRING"},
                "award_amount": {"type": "STRING"},
                "eligibility": {"type": "STRING"},
                "organizer": {"type": "STRING"},
                "date_time": {"type": "STRING"},
                "category_domain": {"type": "STRING"},
                "pricing_model": {"type": "STRING"},
                "features_summary": {"type": "STRING"}
            }
        }
    },
    "required": [
        "title",
        "summary",
        "category_name",
        "content_type",
        "tags",
        "dynamic_headers",
        "category_fields"
    ]
}

_SYSTEM_INSTRUCTION = """\
You are an expert content analyzer for a web clipper application called "Clipper".
The user has saved a webpage. Analyze the page content and any highlighted text they selected.
Classify the content into an optimal category, generate structured fields, and generate an appropriate spreadsheet column schema.
Ensure all text fields are clean single-line strings without any raw newlines or tabs.
"""


def ai_summarize(url: str, page_text: str, selected_text: str = '') -> dict | None:
    """
    Call Google Gemini using Schema-Enforced Structured Outputs (responseSchema).
    Validates output via Pydantic model and returns a clean dictionary.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    model = getattr(settings, 'GEMINI_MODEL', 'gemini-flash-latest')

    if not api_key:
        logger.info('GEMINI_API_KEY not configured — skipping AI summarization.')
        return None

    # Clean text inputs before sending to Gemini
    clean_page = clean_text(page_text)
    clean_selected = clean_text(selected_text)

    # Build the user message with the page content
    user_content = f'URL: {url}\n\n'
    if clean_selected:
        user_content += f'--- SELECTED TEXT ---\n{clean_selected[:2000]}\n\n'
    user_content += f'--- PAGE CONTENT ---\n{clean_page[:6000]}'

    payload = {
        'contents': [
            {
                'role': 'user',
                'parts': [
                    {'text': f'{_SYSTEM_INSTRUCTION}\n\n{user_content}'},
                ],
            },
        ],
        'generationConfig': {
            'temperature': 0.1,
            'maxOutputTokens': 2048,
            'responseMimeType': 'application/json',
            'responseSchema': _GEMINI_RESPONSE_SCHEMA,
        },
    }

    api_url = (
        f'https://generativelanguage.googleapis.com/v1beta/models/{model}'
        ':generateContent'
    )

    request = urllib.request.Request(
        api_url,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'x-goog-api-key': api_key,
        },
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

    # Parse and validate with Pydantic
    try:
        candidate = data['candidates'][0]
        raw_json_text = candidate.get('content', {}).get('parts', [{}])[0].get('text', '')
        
        # Pydantic Schema Validation
        parsed_model = ClipAnalysisResponse.model_validate_json(raw_json_text)
        result = parsed_model.model_dump()
    except Exception as exc:
        logger.error('Pydantic validation failed for Gemini response: %s — raw: %s', exc, str(data)[:500])
        return None

    # Final text hygiene pass on validated fields
    result['title'] = clean_text(result['title'])[:512]
    result['summary'] = clean_text(result['summary'])[:500]
    result['category_name'] = clean_text(result['category_name'])[:64]
    result['content_type'] = str(result['content_type']).lower().strip()
    result['tags'] = [clean_text(t).lower() for t in result.get('tags', []) if clean_text(t)][:6]

    if result.get('dynamic_headers'):
        result['dynamic_headers'] = [clean_text(h) for h in result['dynamic_headers'] if clean_text(h)]

    if result.get('dynamic_row'):
        result['dynamic_row'] = {clean_text(k): clean_text(str(v)) for k, v in result['dynamic_row'].items() if v}

    if result.get('category_fields'):
        result['category_fields'] = {clean_text(k): clean_text(str(v)) for k, v in result['category_fields'].items()}

    # Normalize deadline_date
    raw_deadline = result.get('deadline_date')
    if raw_deadline and isinstance(raw_deadline, str):
        match = re.search(r'\d{4}-\d{2}-\d{2}', raw_deadline)
        result['deadline_date'] = match.group(0) if match else None
    else:
        result['deadline_date'] = None

    return result
