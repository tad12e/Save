import json
import logging
import re
import urllib.error
import urllib.request
from datetime import datetime, date, timedelta
from typing import Any, Dict, Optional, Union
from django.conf import settings
from django.utils import timezone
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# =============================================================================
# 1. PYDANTIC STRUCTURED OUTPUT SCHEMA
# =============================================================================
class DeadlineExtractionResult(BaseModel):
    """
    Validated Pydantic model representing extracted deadline intelligence.
    """
    has_deadline: bool = Field(default=False, description="True if a valid deadline/expiration date was found")
    deadline_date: Optional[str] = Field(default=None, description="ISO format date YYYY-MM-DD")
    days_remaining: Optional[int] = Field(default=None, description="Days remaining until the deadline from today")
    urgency_level: str = Field(default="normal", description="urgent (<= 3 days), moderate (<= 7 days), or normal")
    opportunity_type: str = Field(default="job", description="job, scholarship, event, course, grant, or other")
    raw_date_snippet: str = Field(default="", description="The exact date/deadline phrase found in text")
    confidence_score: float = Field(default=0.0, description="Confidence between 0.0 and 1.0")
    source: str = Field(default="gemini_llm", description="user_manual | gemini_llm | heuristic_fallback")


# Gemini native JSON Schema enforcing the Pydantic structure
_GEMINI_DEADLINE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "has_deadline": {
            "type": "BOOLEAN",
            "description": "True if an application deadline, expiration date, submission cut-off, or event date is present."
        },
        "deadline_date": {
            "type": "STRING",
            "description": "The exact deadline in ISO format YYYY-MM-DD. If year is missing, assume current/upcoming year. Empty string if no deadline."
        },
        "urgency_level": {
            "type": "STRING",
            "enum": ["urgent", "moderate", "normal"],
            "description": "urgent if <= 3 days, moderate if <= 7 days, otherwise normal"
        },
        "opportunity_type": {
            "type": "STRING",
            "enum": ["job", "scholarship", "event", "grant", "course", "deal", "other"],
            "description": "Categorization of the opportunity"
        },
        "raw_date_snippet": {
            "type": "STRING",
            "description": "Short excerpt where the date was mentioned, e.g., 'Apply before Oct 15, 2026' or 'Closes in 3 days'"
        },
        "confidence_score": {
            "type": "NUMBER",
            "description": "Confidence score from 0.0 to 1.0"
        }
    },
    "required": ["has_deadline", "deadline_date", "opportunity_type"]
}


# =============================================================================
# 2. AI DEADLINE EXTRACTOR SERVICE (GEMINI 1.5 FLASH + FALLBACK)
# =============================================================================
class AIDeadlineExtractor:
    """
    Intelligent deadline and opportunity extraction service.
    
    Priority Rules:
    1. User Manual Deadline: If the user specified a custom deadline, it is strictly honored (0 LLM cost).
    2. Gemini 1.5 Flash (Free Tier): Calls Gemini with Pydantic JSON schema to parse unstructured text.
    3. Heuristic / Regex Fallback: If Gemini quota is exceeded (HTTP 429), offline, or fails,
       runs a multi-pattern regex date extractor to prevent crashes and ensure zero downtime.
    """

    @classmethod
    def extract(
        cls,
        title: str = "",
        selected_text: str = "",
        url: str = "",
        user_deadline: Optional[Union[str, date, datetime]] = None,
        content_type: str = "job",
    ) -> DeadlineExtractionResult:
        """
        Main extraction entry point.
        """
        today = timezone.localdate()

        # ---------------------------------------------------------------------
        # RULE 1: User-Provided Manual Deadline Priority
        # ---------------------------------------------------------------------
        if user_deadline:
            parsed_user_date = cls._normalize_date(user_deadline)
            if parsed_user_date:
                days_rem = (parsed_user_date - today).days
                urgency = "urgent" if days_rem <= 3 else ("moderate" if days_rem <= 7 else "normal")
                return DeadlineExtractionResult(
                    has_deadline=True,
                    deadline_date=parsed_user_date.isoformat(),
                    days_remaining=days_rem,
                    urgency_level=urgency,
                    opportunity_type=content_type or "custom",
                    raw_date_snippet="User defined manual deadline",
                    confidence_score=1.0,
                    source="user_manual",
                )

        # ---------------------------------------------------------------------
        # RULE 2: Try Gemini 1.5 Flash (Free Tier) with Pydantic Schema
        # ---------------------------------------------------------------------
        combined_text = f"Title: {title}\nURL: {url}\nContent/Snippet: {selected_text}".strip()
        if len(combined_text) < 15:
            # Not enough text to extract a deadline
            return DeadlineExtractionResult(
                has_deadline=False,
                opportunity_type=content_type or "general",
                source="none",
            )

        llm_result = cls._call_gemini_flash(combined_text, content_type, today)
        if llm_result:
            return llm_result

        # ---------------------------------------------------------------------
        # RULE 3: Quota Limit / Crash Fallback (Heuristic Regex Parser)
        # ---------------------------------------------------------------------
        logger.info("[AIDeadlineExtractor] Falling back to Heuristic Regex Parser.")
        return cls._fallback_regex_extractor(combined_text, content_type, today)

    @classmethod
    def _call_gemini_flash(cls, text: str, content_type: str, today: date) -> Optional[DeadlineExtractionResult]:
        """
        Calls Google Gemini 1.5 Flash via REST API with constrained Pydantic responseSchema.
        Handles rate limits (HTTP 429), timeouts, and network failures gracefully.
        """
        api_key = getattr(settings, 'GEMINI_API_KEY', '')
        if not api_key or api_key.startswith('your-gemini-api-key'):
            logger.debug("[AIDeadlineExtractor] GEMINI_API_KEY is not configured.")
            return None

        model_name = getattr(settings, 'GEMINI_MODEL', 'gemini-1.5-flash')
        if 'flash' not in model_name.lower():
            model_name = 'gemini-1.5-flash'

        # Clean text
        clean_prompt = re.sub(r'[\r\n\t]+', ' ', text[:3000]).strip()

        system_instruction = (
            f"Today's date is {today.isoformat()} ({today.strftime('%A, %B %d, %Y')}). "
            "Your task is to inspect the clipped webpage snippet (especially for job openings, scholarships, grant applications, "
            "conferences, hackathons, and event registrations) and identify if an explicit or relative deadline is mentioned. "
            "If a relative date like 'in 3 days', 'next Friday', or 'end of this month' is mentioned, compute the exact YYYY-MM-DD from today. "
            "If no deadline exists (e.g. general documentation, blog post, tools), set has_deadline to false and deadline_date to empty string."
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"System Context:\n{system_instruction}\n\nSnippet to analyze:\n{clean_prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,  # Low temperature for deterministic date extraction
                "topP": 0.8,
                "maxOutputTokens": 400,
                "responseMimeType": "application/json",
                "responseSchema": _GEMINI_DEADLINE_SCHEMA,
            }
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    body = json.loads(response.read().decode("utf-8"))
                    candidates = body.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            raw_json = parts[0].get("text", "{}")
                            data = json.loads(raw_json)

                            d_str = (data.get("deadline_date") or "").strip()
                            parsed_date = cls._normalize_date(d_str) if d_str else None

                            if parsed_date:
                                days_rem = (parsed_date - today).days
                                urgency = "urgent" if days_rem <= 3 else ("moderate" if days_rem <= 7 else "normal")
                                return DeadlineExtractionResult(
                                    has_deadline=True,
                                    deadline_date=parsed_date.isoformat(),
                                    days_remaining=days_rem,
                                    urgency_level=data.get("urgency_level") or urgency,
                                    opportunity_type=data.get("opportunity_type") or content_type or "job",
                                    raw_date_snippet=data.get("raw_date_snippet") or "",
                                    confidence_score=float(data.get("confidence_score") or 0.95),
                                    source="gemini_llm",
                                )
                            elif data.get("has_deadline") is False:
                                return DeadlineExtractionResult(
                                    has_deadline=False,
                                    opportunity_type=data.get("opportunity_type") or content_type or "general",
                                    source="gemini_llm",
                                )
        except urllib.error.HTTPError as http_err:
            if http_err.code == 429:
                logger.warning("[AIDeadlineExtractor] Gemini API Quota Exceeded (HTTP 429). Activating Regex Fallback.")
            else:
                logger.warning(f"[AIDeadlineExtractor] Gemini API HTTP Error ({http_err.code}).")
        except Exception as e:
            logger.warning(f"[AIDeadlineExtractor] Gemini request error: {e}")

        return None

    # =========================================================================
    # 3. HEURISTIC & REGEX PARSER (QUOTA PROTECTION FALLBACK)
    # =========================================================================
    @classmethod
    def _fallback_regex_extractor(cls, text: str, content_type: str, today: date) -> DeadlineExtractionResult:
        """
        Regex & heuristic engine that runs locally with 0 network calls.
        Detects standard dates, 'apply by', 'deadline:', 'due on', and relative offsets.
        """
        lower_text = text.lower()

        # Common deadline trigger phrases
        triggers = [
            r'deadline[:\s]+([a-z0-9\s,\/\.\-]+)',
            r'apply\s+(?:by|before)[:\s]+([a-z0-9\s,\/\.\-]+)',
            r'due\s+(?:date|by|on)[:\s]+([a-z0-9\s,\/\.\-]+)',
            r'closes\s+(?:on|by)[:\s]+([a-z0-9\s,\/\.\-]+)',
            r'expires[:\s]+([a-z0-9\s,\/\.\-]+)',
            r'applications\s+close[:\s]+([a-z0-9\s,\/\.\-]+)',
            r'last\s+date\s+to\s+apply[:\s]+([a-z0-9\s,\/\.\-]+)',
        ]

        # 1. Try Trigger-based extraction
        for pattern in triggers:
            match = re.search(pattern, lower_text, re.IGNORECASE)
            if match:
                snippet = match.group(0)[:60]
                candidate_str = match.group(1)[:30].strip()
                parsed = cls._parse_date_string(candidate_str, today)
                if parsed:
                    days_rem = (parsed - today).days
                    urgency = "urgent" if days_rem <= 3 else ("moderate" if days_rem <= 7 else "normal")
                    return DeadlineExtractionResult(
                        has_deadline=True,
                        deadline_date=parsed.isoformat(),
                        days_remaining=days_rem,
                        urgency_level=urgency,
                        opportunity_type=content_type or "job",
                        raw_date_snippet=snippet,
                        confidence_score=0.80,
                        source="heuristic_fallback",
                    )

        # 2. Try Relative offsets (e.g. "closes in 3 days")
        rel_match = re.search(r'(?:closes|deadline|expires|apply)\s+in\s+(\d{1,2})\s+days', lower_text)
        if rel_match:
            days_count = int(rel_match.group(1))
            parsed = today + timedelta(days=days_count)
            urgency = "urgent" if days_count <= 3 else ("moderate" if days_count <= 7 else "normal")
            return DeadlineExtractionResult(
                has_deadline=True,
                deadline_date=parsed.isoformat(),
                days_remaining=days_count,
                urgency_level=urgency,
                opportunity_type=content_type or "job",
                raw_date_snippet=rel_match.group(0),
                confidence_score=0.85,
                source="heuristic_fallback",
            )

        # 3. Try Standard ISO formats (YYYY-MM-DD)
        iso_match = re.search(r'\b(202[5-9]-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]))\b', text)
        if iso_match:
            parsed = cls._normalize_date(iso_match.group(1))
            if parsed and parsed >= today:
                days_rem = (parsed - today).days
                urgency = "urgent" if days_rem <= 3 else ("moderate" if days_rem <= 7 else "normal")
                return DeadlineExtractionResult(
                    has_deadline=True,
                    deadline_date=parsed.isoformat(),
                    days_remaining=days_rem,
                    urgency_level=urgency,
                    opportunity_type=content_type or "job",
                    raw_date_snippet=iso_match.group(0),
                    confidence_score=0.75,
                    source="heuristic_fallback",
                )

        return DeadlineExtractionResult(
            has_deadline=False,
            opportunity_type=content_type or "general",
            source="heuristic_fallback",
        )

    # =========================================================================
    # 4. DATE PARSING & NORMALIZATION UTILITIES
    # =========================================================================
    @classmethod
    def _normalize_date(cls, value: Any) -> Optional[date]:
        if not value:
            return None
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            clean = value.strip()[:10]
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d", "%d-%m-%Y"):
                try:
                    return datetime.strptime(clean, fmt).date()
                except ValueError:
                    continue
        return None

    @classmethod
    def _parse_date_string(cls, date_str: str, today: date) -> Optional[date]:
        """
        Parses textual dates like 'September 15, 2026' or '15 Oct' or 'Nov 30'.
        """
        clean = re.sub(r'[\,\.\;]+', ' ', date_str).strip()
        
        # Month name map
        month_names = {
            'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
            'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6, 'jul': 7, 'july': 7,
            'aug': 8, 'august': 8, 'sep': 9, 'september': 9, 'oct': 10, 'october': 10,
            'nov': 11, 'november': 11, 'dec': 12, 'december': 12
        }

        tokens = clean.lower().split()
        found_month = None
        found_day = None
        found_year = today.year

        for token in tokens:
            # Check month name
            if token in month_names and not found_month:
                found_month = month_names[token]
                continue
            # Check numeric day / year
            clean_num = re.sub(r'[^\d]', '', token)
            if clean_num.isdigit():
                val = int(clean_num)
                if 1 <= val <= 31 and not found_day:
                    found_day = val
                elif 2025 <= val <= 2030:
                    found_year = val

        if found_month and found_day:
            try:
                candidate = date(found_year, found_month, found_day)
                # If date is in the past, roll to next year if year was omitted
                if candidate < today and found_year == today.year:
                    candidate = date(today.year + 1, found_month, found_day)
                return candidate
            except ValueError:
                pass

        return cls._normalize_date(clean)
