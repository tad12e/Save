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
    ('web', 'https://www.amazon.com/dp/B08N5WRWNW', 'commerce'),
    ('web', 'https://smile.amazon.co.uk/item/123', 'commerce'),
    ('deal', 'https://somestore.com/shoes', 'commerce'),
    ('web', 'https://www.goodreads.com/book/show/123', 'book'),
    ('book', 'https://someblog.com/my-read', 'book'),
    ('web', 'https://arxiv.org/abs/2301.12345', 'paper'),
    ('paper', 'https://university.edu/paper', 'paper'),
    ('web', 'https://boards.greenhouse.io/stripe/jobs/123', 'job'),
    ('job', 'https://company.com/apply', 'job'),
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

    def test_commerce_normalization(self):
        meta = normalize_platform_meta('commerce', {
            'title': 'Kindle Paperwhite 16GB',
            'brand': 'Amazon',
            'price': '$139.99',
            'curr': 'USD',
            'rating': '4.7 out of 5',
            'reviews': '12,450',
            'thumb': 'https://m.media-amazon.com/images/I/71.jpg',
            'availability': 'In Stock',
        })
        self.assertEqual(meta['v'], 1)
        self.assertEqual(meta['skin'], 'commerce')
        self.assertEqual(meta['title'], 'Kindle Paperwhite 16GB')
        self.assertEqual(meta['brand'], 'Amazon')
        self.assertEqual(meta['price'], 139.99)
        self.assertEqual(meta['curr'], 'USD')
        self.assertEqual(meta['rating'], 4.7)
        self.assertEqual(meta['reviews'], 12450)
        self.assertEqual(meta['availability'], 'In Stock')
        self.assertLessEqual(_size(meta), PLATFORM_META_BYTE_BUDGET)

    def test_book_normalization(self):
        meta = normalize_platform_meta('book', {
            'title': 'Designing Data-Intensive Applications',
            'author': 'Martin Kleppmann',
            'rating': '4.82',
            'pages': '616',
            'isbn': '9781449373320',
            'price': '34.50',
            'curr': 'USD',
            'cover': 'https://images.gr-assets.com/books/123.jpg',
        })
        self.assertEqual(meta['skin'], 'book')
        self.assertEqual(meta['author'], 'Martin Kleppmann')
        self.assertEqual(meta['rating'], 4.82)
        self.assertEqual(meta['pages'], 616)
        self.assertEqual(meta['isbn'], '9781449373320')
        self.assertEqual(meta['price'], 34.5)

    def test_paper_normalization(self):
        meta = normalize_platform_meta('paper', {
            'paper_id': '2301.12345',
            'title': 'Attention Is All You Need',
            'authors': ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Extra Author'],
            'published_year': '2017',
            'citations': '105,432',
            'pdf_url': 'https://arxiv.org/pdf/2301.12345.pdf',
            'doi': '10.48550/arXiv.2301.12345',
        })
        self.assertEqual(meta['skin'], 'paper')
        self.assertEqual(meta['paper_id'], '2301.12345')
        self.assertEqual(len(meta['authors']), 4)  # limited to 4
        self.assertEqual(meta['published_year'], 2017)
        self.assertEqual(meta['citations'], 105432)
        self.assertEqual(meta['pdf_url'], 'https://arxiv.org/pdf/2301.12345.pdf')

    def test_job_normalization(self):
        meta = normalize_platform_meta('job', {
            'company': 'Stripe',
            'role': 'Staff Software Engineer, Platform Infrastructure',
            'location': 'Remote, US',
            'salary': '$240,000 - $310,000',
            'apply_url': 'https://stripe.com/jobs/apply/123',
        })
        self.assertEqual(meta['skin'], 'job')
        self.assertEqual(meta['company'], 'Stripe')
        self.assertEqual(meta['role'], 'Staff Software Engineer, Platform Infrastructure')
        self.assertEqual(meta['location'], 'Remote, US')
        self.assertEqual(meta['salary'], '$240,000 - $310,000')


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
