"""
Tests for Platform Enricher & Sanitizer (Part 2).
Verifies Subagent A (Social), Subagent B (Media), Subagent C (Sanitization),
and byte-budget compliance (<= 300 bytes per card).
"""

from unittest.mock import patch

from django.test import SimpleTestCase

from apps.clips.platform_meta import (
    PLATFORM_META_BYTE_BUDGET,
    SKIN_BOOK,
    SKIN_COMMERCE,
    SKIN_GENERIC,
    SKIN_GITHUB,
    SKIN_INSTAGRAM,
    SKIN_JOB,
    SKIN_LINKEDIN,
    SKIN_PAPER,
    SKIN_REDDIT,
    SKIN_SPOTIFY,
    SKIN_X,
    SKIN_YOUTUBE,
)
from apps.clips.services.platform_enrich import (
    enrich_platform_meta,
    extract_json_ld,
    extract_youtube_video_id,
    fetch_book_metadata,
    fetch_commerce_metadata,
    fetch_generic_metadata,
    fetch_github_metadata,
    fetch_instagram_metadata,
    fetch_job_metadata,
    fetch_linkedin_metadata,
    fetch_paper_metadata,
    fetch_reddit_metadata,
    fetch_spotify_metadata,
    fetch_x_metadata,
    fetch_youtube_metadata,
    parse_iso8601_duration,
    parse_og_meta,
)
from apps.clips.services.sanitizer import (
    clean_boilerplate,
    clean_clip_summary,
    clean_clip_title,
)


class SanitizerGuardTests(SimpleTestCase):
    """Subagent C: Sanitization Guard tests."""

    def test_clean_cookie_banners(self):
        dirty = "Great article on React! We use cookies to improve your experience. Please accept all cookies."
        cleaned = clean_boilerplate(dirty)
        self.assertNotIn("Please accept all cookies", cleaned)

    def test_clean_auth_walls(self):
        dirty = "Log in or sign up to view this post. The system architecture uses CQRS."
        cleaned = clean_boilerplate(dirty)
        self.assertNotIn("Log in or sign up", cleaned)
        self.assertIn("The system architecture uses CQRS.", cleaned)

    def test_clean_youtube_boilerplate(self):
        dirty = "Amazing tech review. About press copyright contact us creators advertise developers terms how YouTube works."
        cleaned = clean_boilerplate(dirty)
        self.assertNotIn("how YouTube works", cleaned)
        self.assertIn("Amazing tech review.", cleaned)

    def test_clean_clip_summary_deduplicates_title(self):
        title = "Announcing Flutter 3.24"
        summary = "Announcing Flutter 3.24 - This release brings exciting improvements to Impeller."
        cleaned = clean_clip_summary(summary, title)
        self.assertTrue(cleaned.startswith("This release brings exciting improvements"))

    def test_clean_clip_title_removes_auth_and_suffix(self):
        title = "Log in to X / X"
        cleaned = clean_clip_title(title, "https://x.com/karpathy/status/123")
        self.assertEqual(cleaned, "x.com: 123")

        title2 = "DeepSeek-V3 Technical Report - YouTube"
        cleaned2 = clean_clip_title(title2, "https://youtube.com/watch?v=123")
        self.assertEqual(cleaned2, "DeepSeek-V3 Technical Report")


class SocialScrapersTests(SimpleTestCase):
    """Subagent A: Social Scrapers (X, Reddit, GitHub)."""

    @patch("apps.clips.services.platform_enrich._http_get_json")
    def test_x_twitter_fxtwitter_success(self, mock_get_json):
        mock_get_json.return_value = {
            "tweet": {
                "text": "Hello world",
                "author": {
                    "name": "Andrej Karpathy",
                    "screen_name": "karpathy",
                    "avatar_url": "https://pbs.twimg.com/profile_images/123/avatar.jpg",
                },
                "likes": 4200,
                "retweets": 850,
                "replies": 320,
                "views": 150000,
                "created_at": "2026-10-01T12:00:00Z",
                "media": {
                    "photos": [{"url": "https://pbs.twimg.com/media/pic1.jpg"}],
                },
            }
        }
        res = enrich_platform_meta(
            url="https://x.com/karpathy/status/1800000000000000000",
            source_platform="x_twitter",
        )
        self.assertEqual(res["skin"], SKIN_X)
        self.assertEqual(res["handle"], "@karpathy")
        self.assertEqual(res["name"], "Andrej Karpathy")
        self.assertEqual(res["likes"], 4200)
        self.assertEqual(res["reposts"], 850)
        self.assertLessEqual(len(str(res)), PLATFORM_META_BYTE_BUDGET)

    def test_x_twitter_og_fallback(self):
        html = """
        <html>
        <head>
            <meta property="og:title" content="John Doe (@johndoe) on X">
            <meta property="og:image" content="https://pbs.twimg.com/avatar.jpg">
            <meta name="twitter:creator" content="@johndoe">
        </head>
        </html>
        """
        res = enrich_platform_meta(
            url="https://x.com/johndoe/status/99999",
            source_platform="x_twitter",
            html_text=html,
        )
        self.assertEqual(res["skin"], SKIN_X)
        self.assertEqual(res["handle"], "@johndoe")
        self.assertEqual(res["name"], "John Doe")
        self.assertEqual(res["avatar"], "https://pbs.twimg.com/avatar.jpg")

    @patch("apps.clips.services.platform_enrich._http_get_json")
    def test_reddit_json_success(self, mock_get_json):
        mock_get_json.return_value = [
            {
                "data": {
                    "children": [
                        {
                            "data": {
                                "subreddit": "Python",
                                "author": "guido",
                                "score": 1540,
                                "num_comments": 230,
                                "over_18": False,
                                "link_flair_text": "Discussion",
                                "thumbnail": "https://b.thumbs.redditmedia.com/thumb.jpg",
                            }
                        }
                    ]
                }
            }
        ]
        res = enrich_platform_meta(
            url="https://www.reddit.com/r/Python/comments/abc123/python_release/",
            source_platform="reddit",
        )
        self.assertEqual(res["skin"], SKIN_REDDIT)
        self.assertEqual(res["subreddit"], "r/Python")
        self.assertEqual(res["author"], "u/guido")
        self.assertEqual(res["upvotes"], 1540)
        self.assertEqual(res["comments"], 230)
        self.assertEqual(res["flair"], "Discussion")
        self.assertFalse(res.get("nsfw", False))
        self.assertLessEqual(len(str(res)), PLATFORM_META_BYTE_BUDGET)

    @patch("apps.clips.services.platform_enrich._http_get_json")
    def test_github_api_success(self, mock_get_json):
        mock_get_json.return_value = {
            "name": "fastapi",
            "stargazers_count": 78000,
            "forks_count": 6500,
            "language": "Python",
            "license": {"spdx_id": "MIT"},
            "topics": ["python", "api", "framework"],
        }
        res = enrich_platform_meta(
            url="https://github.com/tiangolo/fastapi",
            source_platform="github",
        )
        self.assertEqual(res["skin"], SKIN_GITHUB)
        self.assertEqual(res["owner"], "tiangolo")
        self.assertEqual(res["repo"], "fastapi")
        self.assertEqual(res["stars"], 78000)
        self.assertEqual(res["language"], "Python")
        self.assertEqual(res["license"], "MIT")
        self.assertIn("python", res["topics"])
        self.assertLessEqual(len(str(res)), PLATFORM_META_BYTE_BUDGET)


class MediaScrapersTests(SimpleTestCase):
    """Subagent B: Media & Audio Scrapers (YouTube, Spotify, LinkedIn, Instagram, Generic)."""

    def test_youtube_video_id_and_shorts_detection(self):
        vid, is_short = extract_youtube_video_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        self.assertEqual(vid, "dQw4w9WgXcQ")
        self.assertFalse(is_short)

        vid_short, is_short2 = extract_youtube_video_id("https://youtube.com/shorts/abcdef12345")
        self.assertEqual(vid_short, "abcdef12345")
        self.assertTrue(is_short2)

        vid_short_url, is_short3 = extract_youtube_video_id("https://youtu.be/dQw4w9WgXcQ")
        self.assertEqual(vid_short_url, "dQw4w9WgXcQ")
        self.assertFalse(is_short3)

    def test_iso8601_duration_parsing(self):
        self.assertEqual(parse_iso8601_duration("PT3M45S"), 225)
        self.assertEqual(parse_iso8601_duration("PT1H2M3S"), 3723)
        self.assertEqual(parse_iso8601_duration("PT45S"), 45)
        self.assertIsNone(parse_iso8601_duration("invalid"))

    @patch("apps.clips.services.platform_enrich._http_get_json")
    def test_youtube_enrichment_oembed_and_duration(self, mock_get_json):
        mock_get_json.return_value = {
            "title": "Never Gonna Give You Up",
            "author_name": "Rick Astley",
            "author_url": "https://www.youtube.com/@RickAstleyYT",
        }
        html = '<meta itemprop="duration" content="PT3M33S">'
        res = enrich_platform_meta(
            url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            source_platform="youtube",
            html_text=html,
        )
        self.assertEqual(res["skin"], SKIN_YOUTUBE)
        self.assertEqual(res["video_id"], "dQw4w9WgXcQ")
        self.assertEqual(res["channel"], "Rick Astley")
        self.assertEqual(res["duration"], 213)
        self.assertLessEqual(len(str(res)), PLATFORM_META_BYTE_BUDGET)

    @patch("apps.clips.services.platform_enrich._http_get_json")
    def test_spotify_enrichment_oembed(self, mock_get_json):
        mock_get_json.return_value = {
            "title": "Daft Punk - Get Lucky",
            "thumbnail_url": "https://i.scdn.co/image/ab67616d0000b273",
        }
        res = enrich_platform_meta(
            url="https://open.spotify.com/track/69kOkLUCkxIZYexIgSG8uz",
            source_platform="spotify",
        )
        self.assertEqual(res["skin"], SKIN_SPOTIFY)
        self.assertEqual(res["kind"], "track")
        self.assertEqual(res["artist"], "Daft Punk")
        self.assertEqual(res["cover"], "https://i.scdn.co/image/ab67616d0000b273")
        self.assertLessEqual(len(str(res)), PLATFORM_META_BYTE_BUDGET)

    def test_generic_article_read_time_and_og(self):
        words = "word " * 650  # 650 words -> 3 min read
        html = """
        <html>
        <head>
            <meta property="og:site_name" content="TechCrunch">
            <meta property="og:image" content="https://techcrunch.com/article.jpg">
            <meta name="author" content="Sarah Perez">
            <meta property="article:published_time" content="2026-10-05T09:00:00Z">
        </head>
        </html>
        """
        res = enrich_platform_meta(
            url="https://techcrunch.com/2026/10/05/ai-startup-news",
            source_platform="web",
            html_text=html,
            text=words,
        )
        self.assertEqual(res["skin"], SKIN_GENERIC)
        self.assertEqual(res["site"], "TechCrunch")
        self.assertEqual(res["author"], "Sarah Perez")
        self.assertEqual(res["read_min"], 3)
        self.assertEqual(res["image"], "https://techcrunch.com/article.jpg")
        self.assertLessEqual(len(str(res)), PLATFORM_META_BYTE_BUDGET)


class ArchetypeScrapersTests(SimpleTestCase):
    """Universal Archetype Scrapers: Commerce, Book, Academic Paper, Job."""

    def test_extract_json_ld_graph(self):
        html = """
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@graph": [
                {"@type": "WebSite", "name": "Store"},
                {"@type": "Product", "name": "Wireless Headphones", "offers": {"@type": "Offer", "price": "79.99"}}
            ]
        }
        </script>
        """
        items = extract_json_ld(html)
        self.assertEqual(len(items), 2)
        self.assertEqual(items[1]["name"], "Wireless Headphones")

    def test_commerce_enrichment_schema_org(self):
        html = """
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Sony WH-1000XM5 Wireless Headphones",
            "brand": {"@type": "Brand", "name": "Sony"},
            "image": "https://m.media-amazon.com/images/I/sony.jpg",
            "offers": {
                "@type": "Offer",
                "price": "348.00",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.6",
                "reviewCount": "8920"
            }
        }
        </script>
        """
        res = enrich_platform_meta(
            url="https://www.amazon.com/dp/B09XS7JWHH",
            source_platform="web",
            html_text=html,
        )
        self.assertEqual(res["skin"], SKIN_COMMERCE)
        self.assertEqual(res["brand"], "Sony")
        self.assertEqual(res["price"], 348.0)
        self.assertEqual(res["curr"], "USD")
        self.assertEqual(res["rating"], 4.6)
        self.assertEqual(res["reviews"], 8920)
        self.assertEqual(res["availability"], "In Stock")
        self.assertEqual(res["thumb"], "https://m.media-amazon.com/images/I/sony.jpg")
        self.assertLessEqual(len(str(res)), PLATFORM_META_BYTE_BUDGET)

    def test_commerce_enrichment_amazon_regex_fallback(self):
        html = """
        <html>
        <head>
            <meta property="og:title" content="Apple AirPods Pro (2nd Gen) - Amazon">
            <meta property="og:image" content="https://m.media-amazon.com/images/I/airpods.jpg">
        </head>
        <body>
            <span class="a-offscreen">$199.99</span>
            <span id="acrCustomerReviewText">42,500 ratings</span>
            <span>4.8 out of 5 stars</span>
        </body>
        </html>
        """
        res = enrich_platform_meta(
            url="https://www.amazon.com/dp/B0D1XD1ZV3",
            source_platform="web",
            html_text=html,
        )
        self.assertEqual(res["skin"], SKIN_COMMERCE)
        self.assertEqual(res["brand"], "Amazon")
        self.assertEqual(res["price"], 199.99)
        self.assertEqual(res["curr"], "USD")
        self.assertEqual(res["rating"], 4.8)
        self.assertEqual(res["reviews"], 42500)

    def test_book_enrichment_schema_org(self):
        html = """
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "Book",
            "name": "Clean Code",
            "author": {"@type": "Person", "name": "Robert C. Martin"},
            "numberOfPages": 464,
            "isbn": "978-0132350884",
            "image": "https://images.gr-assets.com/books/cleancode.jpg",
            "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.4"}
        }
        </script>
        """
        res = enrich_platform_meta(
            url="https://www.goodreads.com/book/show/3735293-clean-code",
            source_platform="web",
            html_text=html,
        )
        self.assertEqual(res["skin"], SKIN_BOOK)
        self.assertEqual(res["title"], "Clean Code")
        self.assertEqual(res["author"], "Robert C. Martin")
        self.assertEqual(res["rating"], 4.4)
        self.assertEqual(res["pages"], 464)
        self.assertEqual(res["isbn"], "9780132350884")
        self.assertEqual(res["cover"], "https://images.gr-assets.com/books/cleancode.jpg")

    def test_paper_enrichment_arxiv(self):
        html = """
        <html>
        <head>
            <meta name="citation_title" content="LoRA: Low-Rank Adaptation of Large Language Models">
            <meta name="citation_author" content="Edward Hu">
            <meta name="citation_author" content="Yelong Shen">
            <meta name="citation_author" content="Phillip Wallis">
            <meta name="citation_publication_date" content="2021/10/16">
            <meta name="citation_doi" content="10.48550/arXiv.2106.09685">
        </head>
        </html>
        """
        res = enrich_platform_meta(
            url="https://arxiv.org/abs/2106.09685",
            source_platform="web",
            html_text=html,
        )
        self.assertEqual(res["skin"], SKIN_PAPER)
        self.assertEqual(res["paper_id"], "2106.09685")
        self.assertEqual(res["pdf_url"], "https://arxiv.org/pdf/2106.09685.pdf")
        self.assertEqual(res["published_year"], 2021)
        self.assertIn("Edward Hu", res["authors"])
        self.assertIn("Yelong Shen", res["authors"])
        self.assertEqual(res["doi"], "10.48550/arXiv.2106.09685")

    def test_job_enrichment_greenhouse(self):
        html = """
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "title": "Senior Distributed Systems Engineer",
            "hiringOrganization": {"@type": "Organization", "name": "Vercel"},
            "jobLocation": {
                "@type": "Place",
                "address": {"@type": "PostalAddress", "addressLocality": "San Francisco", "addressRegion": "CA"}
            },
            "baseSalary": {
                "@type": "MonetaryAmount",
                "currency": "$",
                "value": {"@type": "QuantitativeValue", "minValue": 190000, "maxValue": 240000}
            }
        }
        </script>
        """
        res = enrich_platform_meta(
            url="https://boards.greenhouse.io/vercel/jobs/54321",
            source_platform="web",
            html_text=html,
        )
        self.assertEqual(res["skin"], SKIN_JOB)
        self.assertEqual(res["role"], "Senior Distributed Systems Engineer")
        self.assertEqual(res["company"], "Vercel")
        self.assertEqual(res["location"], "San Francisco, CA")
        self.assertIn("190,000", res["salary"])
        self.assertIn("240,000", res["salary"])

    def test_content_type_fallback_resolves_archetype(self):
        # A boutique book site that is not on a known domain
        res = enrich_platform_meta(
            url="https://indiebookpress.org/releases/the-great-adventure",
            source_platform="web",
            html_text="<meta property='og:title' content='The Great Adventure'><meta name='author' content='Jane Doe'>",
            content_type="book",
        )
        self.assertEqual(res["skin"], SKIN_BOOK)
        self.assertEqual(res["title"], "The Great Adventure")
        self.assertEqual(res["author"], "Jane Doe")
