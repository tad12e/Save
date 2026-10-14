"""Part 1 contract tests — run with: python manage.py test apps.clips.test_platform_meta"""
import json

from django.test import SimpleTestCase

from .platform_meta import (
    PLATFORM_META_BYTE_BUDGET,
    get_platform_meta,
    normalize_platform_meta,
    resolve_skin,
)

# Shared parity table — the TS and Dart resolveSkin() must produce the same results.
SKIN_CASES = [
    ('x_twitter', 'https://example.com', 'x'),
    ('web', 'https://x.com/jack/status/20', 'x'),
    ('web', 'https://mobile.twitter.com/jack', 'x'),
    ('web', 'https://youtu.be/dQw4w9WgXcQ', 'youtube'),
    ('web', 'https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube'),
    ('web', 'https://old.reddit.com/r/python', 'reddit'),
    ('web', 'https://github.com/django/django', 'github'),
    ('web', 'https://www.linkedin.com/posts/abc', 'linkedin'),
    ('instagram', '', 'instagram'),
    ('web', 'https://open.spotify.com/track/123', 'spotify'),
    ('tiktok', 'https://tiktok.com/@a/video/1', 'generic'),
    ('web', 'https://notx.com/article', 'generic'),
    ('web', 'not a url', 'generic'),
    (None, None, 'generic'),
]


def _size(payload):
    return len(json.dumps(payload, separators=(',', ':'), ensure_ascii=False).encode('utf-8'))


class ResolveSkinTests(SimpleTestCase):
    def test_parity_table(self):
        for source, url, expected in SKIN_CASES:
            with self.subTest(source=source, url=url):
                self.assertEqual(resolve_skin(source, url), expected)


class NormalizeTests(SimpleTestCase):
    def test_whitelists_and_coerces(self):
        meta = normalize_platform_meta('github', {
            'owner': 'django', 'repo': 'django', 'stars': '81,234', 'forks': -5,
            'language': 'Python', 'evil': '<script>', 'topics': ['web', 'python', 'orm', 'extra'],
        })
        self.assertEqual(meta['v'], 1)
        self.assertEqual(meta['skin'], 'github')
        self.assertEqual(meta['stars'], 81234)
        self.assertNotIn('forks', meta)  # negative rejected
        self.assertNotIn('evil', meta)   # unknown key dropped
        self.assertEqual(meta['topics'], ['web', 'python', 'orm'])

    def test_rejects_non_https_and_upgrades_http(self):
        meta = normalize_platform_meta('x', {
            'avatar': 'javascript:alert(1)', 'media': ['http://pbs.twimg.com/a.jpg', 'ftp://x'],
        })
        self.assertNotIn('avatar', meta)
        self.assertEqual(meta['media'], ['https://pbs.twimg.com/a.jpg'])

    def test_unknown_skin_becomes_generic(self):
        self.assertEqual(normalize_platform_meta('myspace', {})['skin'], 'generic')

    def test_byte_budget_enforced(self):
        long_url = 'https://pbs.twimg.com/media/' + 'a' * 120 + '.jpg'
        meta = normalize_platform_meta('x', {
            'handle': 'h' * 32, 'name': 'N' * 50, 'avatar': long_url,
            'media': [long_url] * 4, 'likes': 10 ** 9, 'reposts': 10 ** 9,
            'replies': 10 ** 9, 'views': 10 ** 9, 'posted_at': '2026-10-05T12:00:00Z',
        })
        self.assertLessEqual(_size(meta), PLATFORM_META_BYTE_BUDGET)
        self.assertEqual(meta['skin'], 'x')
        self.assertIn('handle', meta)  # highest-priority field survives

    def test_spotify_kind_validated(self):
        self.assertNotIn('kind', normalize_platform_meta('spotify', {'kind': 'mixtape'}))
        self.assertEqual(normalize_platform_meta('spotify', {'kind': 'track'})['kind'], 'track')


class ReadPathTests(SimpleTestCase):
    def test_missing_meta_returns_minimal_envelope(self):
        self.assertEqual(
            get_platform_meta({}, 'web', 'https://github.com/a/b'),
            {'v': 1, 'skin': 'github'},
        )

    def test_corrupt_meta_falls_back(self):
        self.assertEqual(
            get_platform_meta({'platform_meta': 'oops'}, 'youtube', '')['skin'],
            'youtube',
        )
