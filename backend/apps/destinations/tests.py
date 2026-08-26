from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.destinations.models import Destination
from apps.destinations.adapters.spotify import SpotifyAdapter
from apps.destinations.services import get_user_destination, export_clip_to_destination
from apps.clips.models import Clip

User = get_user_model()


class SpotifyAdapterTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='musiclover@save.app',
            name='Music Fan',
            password='securepassword123'
        )
        self.spotify_dest = Destination.objects.create(
            user=self.user,
            provider='spotify',
            name='Spotify Music',
            is_active=True,
            config={
                'target_resource_name': 'Playlist: Clipper Tracks (Default)',
                'access_type': 'full',
            }
        )
        self.adapter = SpotifyAdapter()

    def test_extract_spotify_track_info_from_url(self):
        clip = Clip(
            user=self.user,
            url='https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=12345',
            title='Never Gonna Give You Up',
        )
        track_id, track_uri, query = SpotifyAdapter.extract_spotify_track_info(clip)
        self.assertEqual(track_id, '4cOdK2wGLETKBW3PvgPWqT')
        self.assertEqual(track_uri, 'spotify:track:4cOdK2wGLETKBW3PvgPWqT')
        self.assertEqual(query, '')

    def test_extract_spotify_track_info_from_uri(self):
        clip = Clip(
            user=self.user,
            url='https://example.com/song',
            music_embed_url='spotify:track:7qiZfU4dY1lWllzX7mPBI3',
            title='Shape of You',
        )
        track_id, track_uri, query = SpotifyAdapter.extract_spotify_track_info(clip)
        self.assertEqual(track_id, '7qiZfU4dY1lWllzX7mPBI3')
        self.assertEqual(track_uri, 'spotify:track:7qiZfU4dY1lWllzX7mPBI3')

    def test_extract_spotify_track_info_fallback_query(self):
        clip = Clip(
            user=self.user,
            url='https://youtube.com/watch?v=dQw4w9WgXcQ',
            title='Rick Astley - Never Gonna Give You Up (Official Music Video)',
        )
        track_id, track_uri, query = SpotifyAdapter.extract_spotify_track_info(clip)
        self.assertIsNone(track_id)
        self.assertIsNone(track_uri)
        self.assertIn('Rick Astley', query)

    def test_get_user_playlists_mock(self):
        playlists = self.adapter.get_user_playlists(self.spotify_dest)
        self.assertIsInstance(playlists, list)
        self.assertGreater(len(playlists), 0)
        self.assertIn('name', playlists[0])

    def test_create_playlist_mock(self):
        created = self.adapter.create_playlist(
            self.spotify_dest,
            name='Late Night Synthwave',
            description='Test Playlist',
        )
        self.assertIsNotNone(created)
        self.assertEqual(created['name'], 'Late Night Synthwave')
        self.assertTrue(created['uri'].startswith('spotify:playlist:'))

    def test_search_tracks_mock(self):
        tracks = self.adapter.search_tracks(self.spotify_dest, 'Blinding Lights The Weeknd', limit=3)
        self.assertIsInstance(tracks, list)
        self.assertGreater(len(tracks), 0)
        self.assertIn('uri', tracks[0])

    def test_export_clip_spotify(self):
        clip = Clip.objects.create(
            user=self.user,
            url='https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
            url_hash='hash_spotify_test_1',
            title='Blinding Lights',
            content_type='music',
        )
        result = export_clip_to_destination(clip, self.spotify_dest)
        self.assertTrue(result.success)
        self.assertIn('open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b', result.external_url)


class SpotifyApiViewsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='api_tester@save.app',
            name='API Tester',
            password='securepassword123'
        )
        self.client.force_authenticate(user=self.user)
        self.spotify_dest = Destination.objects.create(
            user=self.user,
            provider='spotify',
            name='Spotify Music',
            is_active=True,
            config={'target_resource_name': 'Playlist: Clipper Tracks (Default)'}
        )

    def test_destination_authorize_spotify(self):
        response = self.client.post('/api/destinations/authorize/', {
            'provider': 'spotify',
            'name': 'Spotify Music',
            'access_type': 'full',
            'target_resource_name': 'Playlist: Clipper Tracks',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('provider'), 'spotify')
        self.assertEqual(response.data.get('status'), 'authorized')

    def test_spotify_playlists_endpoint(self):
        response = self.client.get('/api/destinations/spotify/playlists/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('playlists', response.data)
        self.assertGreater(len(response.data['playlists']), 0)

    def test_spotify_create_playlist_endpoint(self):
        response = self.client.post('/api/destinations/spotify/playlists/', {
            'name': 'Deep Focus Beats',
            'description': 'Lofi & Chill',
            'is_public': False,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Deep Focus Beats')

    def test_spotify_search_endpoint(self):
        response = self.client.get('/api/destinations/spotify/search/?q=Starboy')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tracks', response.data)

    def test_spotify_add_track_endpoint(self):
        response = self.client.post('/api/destinations/spotify/add-track/', {
            'playlist_id': 'clipper_tracks_default',
            'track_uri': 'spotify:track:4cOdK2wGLETKBW3PvgPWqT',
            'track_id': '4cOdK2wGLETKBW3PvgPWqT',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'added_to_playlist')

    def test_set_music_provider_endpoint(self):
        response = self.client.post('/api/destinations/set-music-provider/', {
            'provider': 'youtube_music',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['music_provider'], 'youtube_music')
        self.assertEqual(response.data['status'], 'success')

    def test_category_routing_rules_get_and_post(self):
        # 1. Post new category routing rule
        response = self.client.post('/api/destinations/category-rules/', {
            'rules': {
                'job': str(self.spotify_dest.id),
                'article': 'default',
            }
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')

        # 2. Verify GET returns updated mapping
        get_res = self.client.get('/api/destinations/category-rules/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data['rules']['job'], str(self.spotify_dest.id))


class DestinationRoutingTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='routing_test@save.app',
            name='Router User',
            password='password123'
        )
        self.default_vault = Destination.objects.create(
            user=self.user,
            provider='custom_db',
            name='Save Vault (Internal Database)',
            is_default=True,
            is_active=True,
        )
        self.spotify = Destination.objects.create(
            user=self.user,
            provider='spotify',
            name='Spotify Music',
            is_default=False,
            is_active=True,
        )
        self.youtube_music = Destination.objects.create(
            user=self.user,
            provider='youtube_music',
            name='YouTube Music',
            is_default=False,
            is_active=True,
        )
        self.jobs_sheet = Destination.objects.create(
            user=self.user,
            provider='google_sheets',
            name='Google Sheets - Jobs',
            is_default=False,
            is_active=True,
            config={'content_types': ['job', 'internship']}
        )

    def test_music_routing_tier(self):
        dest = get_user_destination(self.user, content_type='music')
        self.assertIsNotNone(dest)
        self.assertIn(dest.provider, ['spotify', 'youtube_music'])

    def test_switch_preferred_music_provider(self):
        # Explicitly set YouTube Music as preferred
        self.youtube_music.config['is_preferred_music'] = True
        self.youtube_music.save()
        self.spotify.config['is_preferred_music'] = False
        self.spotify.save()

        dest = get_user_destination(self.user, content_type='music')
        self.assertEqual(dest.provider, 'youtube_music')

        # Switch to Spotify as preferred
        self.spotify.config['is_preferred_music'] = True
        self.spotify.save()
        self.youtube_music.config['is_preferred_music'] = False
        self.youtube_music.save()

        dest2 = get_user_destination(self.user, content_type='music')
        self.assertEqual(dest2.provider, 'spotify')

    def test_category_routing_tier(self):
        dest = get_user_destination(self.user, content_type='job')
        self.assertIsNotNone(dest)
        self.assertEqual(dest.pk, self.jobs_sheet.pk)

    def test_general_fallback_routing_tier(self):
        dest = get_user_destination(self.user, content_type='article')
        self.assertIsNotNone(dest)
        self.assertEqual(dest.pk, self.default_vault.pk)


class GoogleSheetsFormattingTestCase(TestCase):
    def test_format_link_formula(self):
        from apps.destinations.adapters.google_sheets import _format_link_formula

        self.assertEqual(
            _format_link_formula('https://x.com/levelsio/status/12345'),
            '=HYPERLINK("https://x.com/levelsio/status/12345", "Link ↗")',
        )
        self.assertEqual(
            _format_link_formula('https://jobs.lever.co/company/dev', 'Apply ↗'),
            '=HYPERLINK("https://jobs.lever.co/company/dev", "Apply ↗")',
        )
        self.assertEqual(_format_link_formula(''), '—')
        self.assertEqual(_format_link_formula('None'), '—')

    def test_export_clip_mock_google_sheets(self):
        from apps.destinations.adapters.google_sheets import GoogleSheetsAdapter
        from apps.destinations.models import Destination
        from apps.clips.models import Clip
        from django.utils import timezone

        user = User.objects.create_user(email='sheetsuser@save.app', password='testpassword123')
        dest = Destination.objects.create(
            user=user,
            provider='google_sheets',
            name='Google Sheets',
            config={'access_token': 'demo_google_sheets_token', 'spreadsheet_id': 'demo_sheet_id'},
            is_active=True,
        )
        clip = Clip.objects.create(
            user=user,
            url='https://x.com/levelsio/status/12345',
            title='Senior Full Stack Engineer',
            summary='Leading startup engineer role',
            content_type='job',
            created_at=timezone.now(),
        )
        adapter = GoogleSheetsAdapter()
        res = adapter.export_clip(clip, dest)
        self.assertTrue(res.success)
        self.assertIn('docs.google.com/spreadsheets', res.external_url)

    def test_beautify_endpoint_validation(self):
        user = User.objects.create_user(email='beautyuser@save.app', password='testpassword123')
        client = APIClient()
        client.force_authenticate(user=user)

        dest = Destination.objects.create(
            user=user,
            provider='google_sheets',
            name='Google Sheets',
            config={'access_token': 'demo_google_sheets_token', 'spreadsheet_id': 'demo_sheet_id'},
            is_active=True,
        )
        response = client.post(f'/api/destinations/{dest.id}/beautify/', format='json')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])



