import json
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.clips.importers import (
    CsvAndUrlImporter,
    HTMLBookmarkImporter,
    RedditImporter,
    TwitterImporter,
    get_importer,
)
from apps.clips.models import BulkImportJob, Clip
from apps.users.models import ApiKey

User = get_user_model()


class ApiKeyAndMcpTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='mcp_tester@save.app',
            name='MCP Tester',
            password='password123',
        )
        self.api_key, self.raw_token = ApiKey.generate_key(self.user, 'Test Key')
        self.client = APIClient()

    def test_api_key_generation_and_verification(self):
        self.assertTrue(self.raw_token.startswith('save_live_'))
        verified_user = ApiKey.verify_key(self.raw_token)
        self.assertEqual(verified_user.id, self.user.id)

        # Invalid key returns None
        self.assertIsNone(ApiKey.verify_key('save_live_invalidkey12345'))
        self.assertIsNone(ApiKey.verify_key('not_a_key'))

    def test_authenticated_endpoint_with_api_key_header(self):
        # Using Authorization: Api-Key
        self.client.credentials(HTTP_AUTHORIZATION=f'Api-Key {self.raw_token}')
        response = self.client.get('/api/v1/clips/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Using X-API-Key header
        client2 = APIClient()
        client2.credentials(HTTP_X_API_KEY=self.raw_token)
        res2 = client2.get('/api/v1/clips/')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)

    def test_revoked_api_key_fails(self):
        self.api_key.is_active = False
        self.api_key.save()

        self.client.credentials(HTTP_AUTHORIZATION=f'Api-Key {self.raw_token}')
        response = self.client.get('/api/v1/clips/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class BulkImportParsersTestCase(TestCase):
    def test_html_bookmark_parser(self):
        html_sample = """<!DOCTYPE NETSCAPE-Bookmark-file-1>
        <META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
        <TITLE>Bookmarks</TITLE>
        <H1>Bookmarks</H1>
        <DL><p>
            <DT><H3 ADD_DATE="1600000000">Tech Tools</H3>
            <DL><p>
                <DT><A HREF="https://github.com/astral-sh/uv" ADD_DATE="1600000001">Astral UV</A>
                <DT><A HREF="https://x.com/karpathy/status/188000000000" ADD_DATE="1600000002">Karpathy Post</A>
            </DL><p>
        </DL><p>
        """
        importer = HTMLBookmarkImporter()
        bookmarks = importer.parse(html_sample)
        self.assertEqual(len(bookmarks), 2)
        self.assertEqual(bookmarks[0].url, 'https://github.com/astral-sh/uv')
        self.assertEqual(bookmarks[0].title, 'Astral UV')
        self.assertIn('tech tools', bookmarks[0].tags)
        self.assertEqual(bookmarks[0].source_platform, 'github')
        self.assertEqual(bookmarks[1].source_platform, 'x_twitter')

    def test_twitter_archive_parser(self):
        twitter_json = json.dumps([
            {
                "tweet": {
                    "id": "189999999999",
                    "full_text": "Building great software with Python and TypeScript #dev #ai",
                    "author": "devguru",
                }
            }
        ])
        importer = TwitterImporter()
        bookmarks = importer.parse(twitter_json)
        self.assertEqual(len(bookmarks), 1)
        self.assertEqual(bookmarks[0].source_platform, 'x_twitter')
        self.assertIn('https://x.com/devguru/status/189999999999', bookmarks[0].url)
        self.assertIn('dev', bookmarks[0].tags)
        self.assertIn('ai', bookmarks[0].tags)

    def test_reddit_saved_parser(self):
        reddit_json = json.dumps([
            {
                "permalink": "/r/Python/comments/xyz123/fastmcp_tutorial/",
                "title": "FastMCP Tutorial for Beginners",
                "subreddit": "Python",
                "author": "pythonista",
                "body": "Here is how you write a fast MCP server...",
            }
        ])
        importer = RedditImporter()
        bookmarks = importer.parse(reddit_json)
        self.assertEqual(len(bookmarks), 1)
        self.assertEqual(bookmarks[0].url, 'https://www.reddit.com/r/Python/comments/xyz123/fastmcp_tutorial/')
        self.assertEqual(bookmarks[0].source_platform, 'reddit')
        self.assertIn('r/python', bookmarks[0].tags)

    def test_csv_and_url_list_parser(self):
        raw_urls = """
        https://simonwillison.net/2024/Dec/fastmcp/
        https://news.ycombinator.com/item?id=42000000
        https://simonwillison.net/2024/Dec/fastmcp/
        """
        importer = CsvAndUrlImporter()
        bookmarks = importer.parse(raw_urls)
        # All URLs are parsed; deduplication is handled by BulkImportUploadView
        self.assertEqual(len(bookmarks), 3)
        self.assertEqual(bookmarks[0].url, 'https://simonwillison.net/2024/Dec/fastmcp/')
        self.assertEqual(bookmarks[1].url, 'https://news.ycombinator.com/item?id=42000000')


class BulkImportViewTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='importer_fan@save.app',
            name='Importer Fan',
            password='password123',
        )
        _, self.raw_token = ApiKey.generate_key(self.user, 'Import Key')
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Api-Key {self.raw_token}')

    @patch('apps.clips.tasks.process_bulk_import_job.delay')
    def test_bulk_import_raw_urls_with_deduplication(self, mock_delay):
        from apps.clips.services.url import hash_url, normalise_url
        existing_url = 'https://example.com/existing'
        Clip.objects.create(
            user=self.user,
            url=existing_url,
            url_hash=hash_url(normalise_url(existing_url)),
            title='Pre-existing',
            status=Clip.STATUS_DONE,
        )

        urls_payload = """
        https://example.com/existing
        https://example.com/new-article-1
        https://example.com/new-article-2
        https://example.com/new-article-1
        """
        response = self.client.post('/api/v1/clips/import/upload/', {'raw_data': urls_payload})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data['created_items'], 2)  # new-article-1 and new-article-2
        self.assertGreaterEqual(data['skipped_duplicates'], 2)  # pre-existing and duplicate in batch

        # Verify job was created
        job = BulkImportJob.objects.get(id=data['job_id'])
        self.assertEqual(job.created_items, 2)
        mock_delay.assert_called_once_with(str(job.id))

    def test_bulk_import_status_and_history(self):
        job = BulkImportJob.objects.create(
            user=self.user,
            source_platform='browser',
            total_items=10,
            created_items=8,
            skipped_duplicates=2,
            status=BulkImportJob.STATUS_PROCESSING,
        )
        # Check status endpoint
        res = self.client.get(f'/api/v1/clips/import/{job.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()['total_items'], 10)

        # Check history endpoint
        hist_res = self.client.get('/api/v1/clips/import/history/')
        self.assertEqual(hist_res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(hist_res.json()), 1)


class ClipContentAndDetailTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='content_fan@save.app',
            name='Content Fan',
            password='password123',
        )
        _, self.raw_token = ApiKey.generate_key(self.user, 'Content Key')
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Api-Key {self.raw_token}')

        self.clip = Clip.objects.create(
            user=self.user,
            url='https://example.com/article',
            url_hash='hash123',
            title='Sample Article Title',
            summary='Brief summary of the article.',
            raw_content='Full detailed text of the article for MCP reader.',
            status=Clip.STATUS_DONE,
            tags=['python', 'ai'],
        )

    def test_get_clip_content(self):
        res = self.client.get(f'/api/v1/clips/{self.clip.id}/content/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['content'], 'Full detailed text of the article for MCP reader.')
        self.assertEqual(data['title'], 'Sample Article Title')

    def test_patch_clip_metadata(self):
        res = self.client.patch(
            f'/api/v1/clips/{self.clip.id}/',
            {
                'title': 'Updated Title via MCP',
                'tags': ['python', 'fastmcp', 'tools'],
                'intent': 'learn',
            },
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.clip.refresh_from_db()
        self.assertEqual(self.clip.title, 'Updated Title via MCP')
        self.assertIn('fastmcp', self.clip.tags)
        self.assertEqual(self.clip.extra_metadata.get('intent'), 'learn')
