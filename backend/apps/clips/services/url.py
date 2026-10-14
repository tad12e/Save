import hashlib
import ipaddress
import socket
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


def is_safe_public_url(raw_url: str) -> bool:
    """
    Validates that a URL is a public, globally routable HTTP/HTTPS endpoint.
    Prevents SSRF (Server-Side Request Forgery) attacks by blocking:
      - Non-HTTP/HTTPS schemes (e.g. file://, ftp://, gopher://)
      - Loopback addresses (e.g. 127.0.0.1, localhost, ::1)
      - Private RFC 1918 subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
      - Link-local / Cloud metadata subnets (169.254.0.0/16, fe80::/10)
      - Broadcast, reserved, unspecified, and multicast IP ranges
    """
    if not raw_url or not isinstance(raw_url, str):
        return False

    try:
        parsed = urlparse(raw_url.strip())
    except Exception:
        return False

    if parsed.scheme.lower() not in ('http', 'https'):
        return False

    hostname = parsed.hostname
    if not hostname:
        return False

    hostname_lower = hostname.lower()
    if (
        hostname_lower in ('localhost', '127.0.0.1', '::1')
        or hostname_lower.endswith('.local')
        or hostname_lower.endswith('.localhost')
    ):
        return False

    try:
        addr_info = socket.getaddrinfo(hostname, None, proto=socket.IPPROTO_TCP)
        if not addr_info:
            return False

        for family, _, _, _, sockaddr in addr_info:
            ip_str = sockaddr[0]
            ip_obj = ipaddress.ip_address(ip_str)

            if (
                ip_obj.is_loopback
                or ip_obj.is_private
                or ip_obj.is_link_local
                or ip_obj.is_reserved
                or ip_obj.is_multicast
                or ip_obj.is_unspecified
            ):
                return False

            if not ip_obj.is_global:
                return False

        return True
    except (socket.gaierror, ValueError, Exception):
        return False

