import hashlib
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

# Query params that are tracking noise — strip them during normalisation.
STRIP_PARAMS = frozenset({
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'ref', 'ref_src', 'ref_url',
})


def normalise_url(raw_url: str) -> str:
    """
    Normalise a URL for deduplication:
      - lowercase scheme + host
      - strip tracking query params
      - remove trailing slash from path
      - re-sort remaining query params for stability
    """
    parsed = urlparse(raw_url)

    scheme = parsed.scheme.lower()
    netloc = parsed.netloc.lower()

    # Remove trailing slash (but keep "/" if path is just "/")
    path = parsed.path.rstrip('/') or '/'

    # Filter out tracking params, sort the rest
    qs = parse_qs(parsed.query, keep_blank_values=True)
    cleaned_qs = {
        k: v for k, v in qs.items()
        if k.lower() not in STRIP_PARAMS
    }
    sorted_query = urlencode(cleaned_qs, doseq=True) if cleaned_qs else ''

    return urlunparse((scheme, netloc, path, '', sorted_query, ''))


def hash_url(normalised_url: str) -> str:
    """SHA-256 hex digest of the normalised URL string."""
    return hashlib.sha256(normalised_url.encode('utf-8')).hexdigest()
