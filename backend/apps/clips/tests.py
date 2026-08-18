from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.clips.models import Clip
from apps.clips.services.source_detector import detect_source_platform, extract_external_job_url, detect_embedded_resources
from apps.clips.services.url import hash_url, normalise_url
from apps.clips.tasks import check_deadline_reminders

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


