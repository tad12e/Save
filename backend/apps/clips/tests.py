from datetime import date, timedelta
from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.clips.models import Clip
from apps.clips.services.source_detector import detect_source_platform, extract_external_job_url, detect_embedded_resources
from apps.clips.services.url import hash_url, normalise_url
from apps.clips.tasks import check_deadline_reminders, process_clip

User = get_user_model()


class SourceDetectorTestCase(TestCase):
    def test_detect_source_platform(self):
        # Twitter
        platform, author, post_url = detect_source_platform('https://x.com/levelsio/status/189000111222')
        self.assertEqual(platform, 'x_twitter')
        self.assertEqual(author, '@levelsio')

        # LinkedIn
        platform, author, post_url = detect_source_platform('https://www.linkedin.com/in/satyanadella/')
        self.assertEqual(platform, 'linkedin')
        self.assertEqual(author, 'satyanadella')

        # Reddit
        platform, author, post_url = detect_source_platform('https://www.reddit.com/r/webdev/comments/12345/awesome_tools/')
        self.assertEqual(platform, 'reddit')
        self.assertEqual(author, 'r/webdev')

        # YouTube
        platform, author, post_url = detect_source_platform('https://www.youtube.com/@mkbhd')
        self.assertEqual(platform, 'youtube')
        self.assertEqual(author, '@mkbhd')

    def test_extract_external_job_url(self):
        sample_text = "We are hiring Senior Engineers! Apply at https://greenhouse.io/acme/jobs/12345 or visit careers.acme.com"
        extracted = extract_external_job_url(sample_text)
        self.assertIsNotNone(extracted)
        self.assertIn('greenhouse.io', extracted)

    def test_detect_embedded_resources(self):
        sample_text = "Check our master directory https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit and https://notion.so/myworkspace/resources"
        resources = detect_embedded_resources(sample_text)
        self.assertEqual(len(resources), 2)
        self.assertEqual(resources[0]['type'], 'google_sheet')
        self.assertEqual(resources[1]['type'], 'notion')


class ClipIngestionTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='clipper_fan@save.app',
            name='Clipper Fan',
            password='password123'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_clip_api(self):
        response = self.client.post('/api/clips/', {
            'url': 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
            'selected_text': 'Never Gonna Give You Up - Rick Astley',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')
        self.assertTrue(Clip.objects.filter(user=self.user).exists())

    def test_deadline_reminders_task(self):
        # Create clip with deadline tomorrow
        Clip.objects.create(
            user=self.user,
            url='https://example.com/scholarship',
            url_hash='hash_deadline_test_1',
            title='Tech Excellence Grant 2026',
            status=Clip.STATUS_DONE,
            deadline_date=date.today() + timedelta(days=1),
            reminder_sent=False,
        )
        reminders_sent = check_deadline_reminders()
        self.assertGreaterEqual(reminders_sent, 1)

    def test_audio_recognizer_service(self):
        from apps.clips.services.audio_recognizer import AudioRecognizer
        result = AudioRecognizer.recognize_audio(
            audio_base64='dGVzdGF1ZGlvZGF0YQ==',
            audio_format='webm',
            sample_title_hint='Blinding Lights'
        )
        self.assertTrue(result['success'])
        self.assertEqual(result['title'], 'Blinding Lights')
        self.assertEqual(result['artist'], 'The Weeknd')
        self.assertTrue(result['spotify_uri'].startswith('spotify:track:'))

    def test_audio_recognize_api_endpoint(self):
        response = self.client.post('/api/clips/recognize-audio/', {
            'audio': 'dGVzdGF1ZGlvZGF0YQ==',
            'format': 'webm',
            'title_hint': 'Starboy',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('spotify_uri', response.data)
        self.assertIn('title', response.data)

    def test_audio_recognize_missing_audio(self):
        response = self.client.post('/api/clips/recognize-audio/', {
            'audio': '',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ClipDeadlineHierarchyAndMetadataTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='deadline_tester@save.app',
            name='Deadline Tester',
            password='password123'
        )
        self.client.force_authenticate(user=self.user)

    @patch('apps.clips.tasks.extract_clip_metadata')
    def test_article_without_user_deadline_remains_none(self, mock_extract):
        """Articles are timeless: even if AI returns a date, it should NOT be set as a deadline."""
        mock_extract.return_value = {
            'title': 'The Architecture of Modern Databases',
            'summary': 'Deep dive into LSM trees and B-Trees.',
            'content_type': 'article',
            'tags': ['databases', 'systems'],
            'deadline_date': '2026-12-31',
        }
        clip = Clip.objects.create(
            user=self.user,
            url='https://example.com/databases-article',
            url_hash='hash_art_1',
            status=Clip.STATUS_PENDING,
        )
        process_clip(None, str(clip.id))
        clip.refresh_from_db()
        self.assertEqual(clip.content_type, 'article')
        self.assertIsNone(clip.deadline_date)

    @patch('apps.clips.tasks.extract_clip_metadata')
    def test_article_with_user_custom_deadline_is_respected(self, mock_extract):
        """If user explicitly sets a deadline on an article (e.g. read later reminder), keep it."""
        mock_extract.return_value = {
            'title': 'AI in 2026',
            'summary': 'Predictions for artificial intelligence.',
            'content_type': 'article',
            'tags': ['ai'],
        }
        clip = Clip.objects.create(
            user=self.user,
            url='https://example.com/ai-article',
            url_hash='hash_art_2',
            deadline_date=date(2026, 9, 20),
            status=Clip.STATUS_PENDING,
        )
        process_clip(None, str(clip.id))
        clip.refresh_from_db()
        self.assertEqual(clip.deadline_date, date(2026, 9, 20))

    @patch('apps.clips.tasks.extract_clip_metadata')
    def test_job_without_user_deadline_extracts_job_deadline(self, mock_extract):
        """Time-sensitive content (Jobs/Grants) should extract the natural application deadline."""
        mock_extract.return_value = {
            'title': 'Staff Software Engineer @ Anthropic',
            'summary': 'Lead development of next-gen AI safety infrastructure.',
            'content_type': 'job',
            'tags': ['python', 'ai', 'careers'],
            'deadline_date': '2026-10-15',
        }
        clip = Clip.objects.create(
            user=self.user,
            url='https://jobs.example.com/staff-engineer',
            url_hash='hash_job_1',
            status=Clip.STATUS_PENDING,
        )
        process_clip(None, str(clip.id))
        clip.refresh_from_db()
        self.assertEqual(clip.content_type, 'job')
        self.assertEqual(clip.deadline_date, date(2026, 10, 15))

    @patch('apps.clips.tasks.extract_clip_metadata')
    def test_user_custom_deadline_overrides_job_deadline(self, mock_extract):
        """User's explicit deadline must always override the AI-extracted job deadline."""
        mock_extract.return_value = {
            'title': 'NSF AI Fellowship Grant 2026',
            'summary': 'Full research stipend for graduate researchers.',
            'content_type': 'grant',
            'tags': ['research', 'grant'],
            'deadline_date': '2026-11-30',
        }
        clip = Clip.objects.create(
            user=self.user,
            url='https://grants.example.com/nsf-ai',
            url_hash='hash_grant_1',
            deadline_date=date(2026, 9, 10),
            status=Clip.STATUS_PENDING,
        )
        process_clip(None, str(clip.id))
        clip.refresh_from_db()
        self.assertEqual(clip.deadline_date, date(2026, 9, 10))

    @patch('apps.clips.tasks.extract_clip_metadata')
    def test_user_note_and_tags_preservation_and_merge(self, mock_extract):
        """User custom notes and tags must be preserved and merged with AI-extracted tags."""
        mock_extract.return_value = {
            'title': 'Open Source Distributed Cache',
            'summary': 'High performance cache built in Rust.',
            'content_type': 'tool',
            'tags': ['rust', 'performance'],
        }
        clip = Clip.objects.create(
            user=self.user,
            url='https://github.com/example/cache',
            url_hash='hash_tool_1',
            tags=['my_favorite', 'must_try'],
            extra_metadata={'user_note': 'Check if this supports Redis wire protocol.'},
            status=Clip.STATUS_PENDING,
        )
        process_clip(None, str(clip.id))
        clip.refresh_from_db()
        self.assertIn('my_favorite', clip.tags)
        self.assertIn('must_try', clip.tags)
        self.assertIn('rust', clip.tags)
        self.assertEqual(clip.extra_metadata.get('user_note'), 'Check if this supports Redis wire protocol.')

    def test_clip_api_ingests_note_tags_and_deadline(self):
        """The /api/clips/ endpoint correctly ingests note, tags, and deadline from client request."""
        response = self.client.post('/api/clips/', {
            'url': 'https://example.com/research-fellowship',
            'selected_text': 'Research immersion in Singapore',
            'note': 'Discuss with academic advisor',
            'tags': ['fellowship', 'singapore', '2026'],
            'deadline': '2026-10-31',
            'table_name': 'My Clips',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_clip = Clip.objects.get(url_hash=response.data['url_hash'])
        self.assertEqual(str(created_clip.deadline_date), '2026-10-31')
        self.assertIn('fellowship', created_clip.tags)
        self.assertEqual(created_clip.extra_metadata.get('user_note'), 'Discuss with academic advisor')
        self.assertEqual(created_clip.extra_metadata.get('target_table_name'), 'My Clips')


