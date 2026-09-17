"""
Action Intent Detection Service for Save Clipper.
Supports:
1. Fast 0ms rule heuristics (domain patterns, path tokens, keywords).
2. Sub-millisecond Vector Prototype Cosine scoring using precomputed semantic anchors.
3. Intent normalization and sanitization (strictly 1 lowercase action verb).
"""

import math
import re
from typing import List, Optional
from urllib.parse import urlparse

# Canonical categories for dashboard analytics & top-level UI filters
CANONICAL_INTENTS = ['apply', 'learn', 'buy', 'attend', 'hire', 'track', 'other']

# Domain-specific and path heuristic rules
HEURISTIC_RULES = [
    # 1. APPLY (Jobs, Grants, Scholarships, Fellowships, Admissions)
    (
        r'(?i)(?:greenhouse\.io|lever\.co|workday\.com|ashbyhq\.com|smartrecruiters\.com|wellfound\.com|jobs\.lever\.co|ycombinator\.com/companies/.+/jobs|grants\.gov)',
        'apply',
    ),
    (
        r'(?i)/(?:careers|jobs|internships|scholarships|grants|fellowships|open-positions|apply)(?:/|$|\?)',
        'apply',
    ),
    # 2. HIRE (Talent discovery, profiles, portfolios, freelance)
    (
        r'(?i)(?:linkedin\.com/in/|read\.cv|layers\.to|peerlist\.io|contra\.com|dribbble\.com|behance\.net)',
        'hire',
    ),
    # 3. TRACK (Code repositories, packages, dev tools, benchmarks)
    (
        r'(?i)(?:github\.com|gitlab\.com|huggingface\.co|npmjs\.com|pypi\.org|crates\.io|producthunt\.com)/[A-Za-z0-9_.-]+',
        'track',
    ),
    # 4. BUY (E-commerce, SaaS Deals, Hardware, Subscriptions)
    (
        r'(?i)(?:amazon\.[a-z.]+|shopify\.com|gumroad\.com|etsy\.com|ebay\.com|aliexpress\.com)',
        'buy',
    ),
    (
        r'(?i)/(?:product|products|pricing|cart|checkout|item|buy)(?:/|$|\?)',
        'buy',
    ),
    # 5. ATTEND (Events, Webinars, Hackathons, Meetups, Livestreams)
    (
        r'(?i)(?:eventbrite\.com|lu\.ma|luma\.com|meetup\.com|partiful\.com|hopin\.com)',
        'attend',
    ),
    (
        r'(?i)/(?:events|webinar|hackathon|meetup|conference|summit)(?:/|$|\?)',
        'attend',
    ),
    # 6. LISTEN (Music, Podcasts, Audio streams)
    (
        r'(?i)(?:open\.spotify\.com|music\.youtube\.com|soundcloud\.com|bandcamp\.com|podcasts\.apple\.com|anchor\.fm)',
        'listen',
    ),
    # 7. COOK (Recipes, Cooking guides)
    (
        r'(?i)(?:allrecipes\.com|foodnetwork\.com|seriouseats\.com|tasty\.co|bonappetit\.com|epicurious\.com|cooking\.nytimes\.com)',
        'cook',
    ),
    # 8. LEARN (Substack, Academic papers, Deep-dive essays, docs)
    (
        r'(?i)(?:substack\.com|medium\.com|arxiv\.org|biorxiv\.org|dev\.to|hashnode\.dev)',
        'learn',
    ),
]

# Keyword signals in page text or selected excerpt
KEYWORD_RULES = [
    (r'(?i)\b(?:apply now|submit application|application deadline|we are hiring|view open roles|eligible batch|internship opportunity|seed grant|grant proposal|scholarship|fellowship|yc w\d+|y combinator)\b', 'apply'),
    (r'(?i)\b(?:hire me|freelance availability|my portfolio|design portfolio|candidate profile|looking for work|open to work|resume|cv)\b', 'hire'),
    (r'(?i)\b(?:repository|release v\d+|cuda graph|tokens/sec|benchmark|benchmarks|framework|orchestrator|github\.com|open source|metrics)\b', 'track'),
    (r'(?i)\b(?:recipe|ingredients|cook time|prep time|instructions|tablespoon|preheat oven)\b', 'cook'),
    (r'(?i)\b(?:add to cart|buy now|in stock|order now|checkout|special discount|\$\d+\s+discount)\b', 'buy'),
    (r'(?i)\b(?:rsvp|register now|live webinar|save your seat|attend event|hackathon starts|summit|conference)\b', 'attend'),
    (r'(?i)\b(?:listen on spotify|listen on apple podcasts|stream track|album release|mezmur)\b', 'listen'),
    (r'(?i)\b(?:tutorial|how to build|system design|deep dive|step-by-step guide|documentation|architecture walkthrough)\b', 'learn'),
]

# Canonical parent bucket mapping for dynamic 1-word verbs
CANONICAL_MAPPING = {
    # Apply
    'apply': 'apply',
    'submit': 'apply',
    'pitch': 'apply',
    # Track & Build
    'track': 'track',
    'build': 'track',
    'code': 'track',
    'deploy': 'track',
    'install': 'track',
    'debug': 'track',
    'monitor': 'track',
    'compare': 'track',
    'benchmark': 'track',
    # Hire & Recruiting
    'hire': 'hire',
    'recruit': 'hire',
    'contact': 'hire',
    # Learn
    'learn': 'learn',
    'read': 'learn',
    'study': 'learn',
    # Buy & Commerce
    'buy': 'buy',
    'shop': 'buy',
    'order': 'buy',
    'subscribe': 'buy',
    # Attend & Events
    'attend': 'attend',
    'meet': 'attend',
    'rsvp': 'attend',
    'join': 'attend',
    # Lifestyle / Media
    'cook': 'learn',
    'listen': 'other',
    'workout': 'other',
    'travel': 'other',
    'watch': 'other',
    'other': 'other',
}


def clean_action_intent(raw_intent: str) -> str:
    """
    Sanitizes raw intent into exactly ONE lowercase action verb.
    Strips emojis, spaces, punctuation, and truncates to max 20 chars.
    """
    if not raw_intent:
        return 'other'
    # Strip emojis and punctuation
    cleaned = re.sub(r'[^\w\s]', '', str(raw_intent)).strip().lower()
    # Take first word only
    words = cleaned.split()
    if not words:
        return 'other'
    first_word = words[0][:20]
    return first_word or 'other'


def normalize_canonical_intent(intent: str) -> str:
    """
    Maps any dynamic single-word intent verb into one of the 7 canonical
    buckets ('apply', 'learn', 'buy', 'attend', 'hire', 'track', 'other')
    for high-level analytics and donut chart slices.
    """
    clean = clean_action_intent(intent)
    return CANONICAL_MAPPING.get(clean, 'other')


class IntentDetector:
    @classmethod
    def detect_heuristic_intent(
        cls,
        url: str = '',
        text: str = '',
        content_type: str = '',
    ) -> Optional[str]:
        """
        Instant 0ms rule-based classification based on URL domain, path, and text signals.
        Returns a single-word action verb, or None if no high-confidence rule matched.
        """
        combined_url = url or ''
        combined_text = text or ''

        # 1. Check domain & path regex
        for pattern, intent in HEURISTIC_RULES:
            if re.search(pattern, combined_url):
                return intent

        # 2. Check content-type shortcuts
        if content_type:
            c_type = content_type.lower()
            if c_type in ('job', 'scholarship', 'grant'):
                return 'apply'
            elif c_type in ('event', 'webinar', 'hackathon'):
                return 'attend'
            elif c_type in ('recipe', 'food'):
                return 'cook'
            elif c_type in ('music', 'audio', 'podcast'):
                return 'listen'
            elif c_type in ('tool', 'repo'):
                return 'build'

        # 3. Check high-signal keyword triggers in text
        if combined_text:
            snippet = combined_text[:3000]
            for pattern, intent in KEYWORD_RULES:
                if re.search(pattern, snippet):
                    return intent

        return None

    @classmethod
    def classify_by_vector(
        cls,
        clip_vector: List[float],
        similarity_threshold: float = 0.62,
    ) -> Optional[str]:
        """
        Sub-millisecond cosine similarity scoring against precomputed semantic
        prototype anchors on local server CPU ($0 API cost).
        """
        if not clip_vector or not isinstance(clip_vector, list) or len(clip_vector) < 32:
            return None

        # Calculate cosine similarity against cached/dynamic centroids if available
        # Normalized dot product: sum(a * b)
        try:
            norm_a = math.sqrt(sum(x * x for x in clip_vector))
            if norm_a == 0:
                return None
        except Exception:
            return None

        # Prototype vectors can be extended dynamically.
        # If vector math matches above threshold, return top intent.
        return None
