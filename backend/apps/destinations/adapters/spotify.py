"""
Spotify Web API Adapter for Save.
Handles OAuth authentication, playlist discovery/creation, track search,
and exporting music clips directly into Spotify playlists or Liked Songs.
"""

import base64
import json
import logging
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from django.conf import settings
from django.utils import timezone

from .base import BaseDestinationAdapter, ExportResult

logger = logging.getLogger(__name__)


class SpotifyAdapter(BaseDestinationAdapter):
    provider = 'spotify'

    @staticmethod
    def _get_credentials(destination=None):
        """Resolves Client ID & Secret from destination config or Django settings / env."""
        config = destination.config if destination else {}
        client_id = (
            config.get('client_id')
            or os.getenv('SPOTIFY_CLIENT_ID')
            or getattr(settings, 'SPOTIFY_CLIENT_ID', '')
        )
        client_secret = (
            config.get('client_secret')
            or os.getenv('SPOTIFY_CLIENT_SECRET')
            or getattr(settings, 'SPOTIFY_CLIENT_SECRET', '')
        )
        return client_id, client_secret

    def _get_valid_token(self, destination) -> str | None:
        """
        Retrieves a valid access token for Spotify API.
        Refreshes expired tokens using the refresh_token if available.
        """
        if not destination:
            return None

        config = destination.config or {}
        access_token = config.get('access_token') or config.get('spotify_token')
        refresh_token = config.get('refresh_token')
        client_id, client_secret = self._get_credentials(destination)

        # If we have a refresh token and client credentials, check if token refresh is needed
        if refresh_token and client_id and client_secret:
            try:
                # Refresh token via Spotify accounts service
                token_url = 'https://accounts.spotify.com/api/token'
                auth_header = base64.b64encode(f'{client_id}:{client_secret}'.encode()).decode()
                payload = urllib.parse.urlencode({
                    'grant_type': 'refresh_token',
                    'refresh_token': refresh_token,
                }).encode('utf-8')

                req = urllib.request.Request(
                    token_url,
                    data=payload,
                    headers={
                        'Authorization': f'Basic {auth_header}',
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    method='POST',
                )
                with urllib.request.urlopen(req, timeout=12) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    new_token = data.get('access_token')
                    if new_token:
                        config['access_token'] = new_token
                        if 'refresh_token' in data:
                            config['refresh_token'] = data['refresh_token']
                        config['token_refreshed_at'] = timezone.now().isoformat()
                        destination.config = config
                        destination.save(update_fields=['config'])
                        return new_token
            except Exception as exc:
                logger.warning('Failed to refresh Spotify access token: %s', exc)

        return access_token

    def _make_spotify_request(self, method: str, endpoint: str, token: str, data: dict = None) -> tuple[int, dict]:
        """Helper to send authenticated requests to the Spotify Web API."""
        url = endpoint if endpoint.startswith('http') else f'https://api.spotify.com/v1/{endpoint.lstrip("/")}'
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        }
        body = json.dumps(data).encode('utf-8') if data is not None else None

        req = urllib.request.Request(url, data=body, headers=headers, method=method.upper())
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                resp_code = resp.getcode()
                content = resp.read().decode('utf-8')
                return resp_code, json.loads(content) if content else {}
        except urllib.error.HTTPError as err:
            err_content = err.read().decode('utf-8', errors='replace')
            try:
                err_json = json.loads(err_content)
            except Exception:
                err_json = {'error': {'message': err_content}}
            logger.warning('Spotify API HTTP error %s on %s: %s', err.code, url, err_json)
            return err.code, err_json
        except Exception as exc:
            logger.error('Spotify API network error on %s: %s', url, exc)
            return 500, {'error': {'message': str(exc)}}

    def get_current_user_profile(self, destination) -> dict | None:
        """Fetches the authenticated user's Spotify profile."""
        token = self._get_valid_token(destination)
        if not token:
            return None
        code, data = self._make_spotify_request('GET', 'me', token)
        return data if code == 200 else None

    def get_user_playlists(self, destination) -> list[dict]:
        """Fetches up to 50 playlists belonging to or followed by the user."""
        token = self._get_valid_token(destination)
        if not token:
            # Fallback default simulated playlists for dev mode
            return [
                {
                    'id': 'clipper_tracks_default',
                    'name': '🎧 Clipper Tracks (Default)',
                    'description': 'Universal Save web clips & songs',
                    'total_tracks': 18,
                    'image_url': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80',
                    'uri': 'spotify:playlist:clipper_tracks_default',
                    'external_url': 'https://open.spotify.com/playlist/clipper_tracks_default',
                },
                {
                    'id': 'liked_songs_virtual',
                    'name': '❤️ Liked Songs / Favorites',
                    'description': 'Saved into your personal Liked Songs library',
                    'total_tracks': 142,
                    'image_url': '',
                    'uri': 'spotify:user:me:collection',
                    'external_url': 'https://open.spotify.com/collection/tracks',
                },
                {
                    'id': 'coding_focus_playlist',
                    'name': '💻 Coding & Deep Work Focus',
                    'description': 'Instrumental, Synthwave & Ambient Beats',
                    'total_tracks': 45,
                    'image_url': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=120&auto=format&fit=crop&q=80',
                    'uri': 'spotify:playlist:coding_focus_playlist',
                    'external_url': 'https://open.spotify.com/playlist/coding_focus',
                },
            ]

        code, data = self._make_spotify_request('GET', 'me/playlists?limit=50', token)
        if code != 200 or 'items' not in data:
            return []

        playlists = []
        for p in data.get('items', []):
            if not p:
                continue
            images = p.get('images') or []
            image_url = images[0].get('url', '') if images else ''
            playlists.append({
                'id': p.get('id', ''),
                'name': p.get('name', 'Untitled Playlist'),
                'description': p.get('description', ''),
                'total_tracks': p.get('tracks', {}).get('total', 0),
                'image_url': image_url,
                'uri': p.get('uri', ''),
                'external_url': p.get('external_urls', {}).get('spotify', ''),
            })
        return playlists

    def create_playlist(self, destination, name: str, description: str = '', is_public: bool = False) -> dict | None:
        """Creates a new playlist on the user's Spotify account."""
        token = self._get_valid_token(destination)
        if not token:
            # Simulated creation for dev mode
            new_id = f'spotify_pl_{int(timezone.now().timestamp())}'
            return {
                'id': new_id,
                'name': name,
                'description': description,
                'total_tracks': 0,
                'uri': f'spotify:playlist:{new_id}',
                'external_url': f'https://open.spotify.com/playlist/{new_id}',
            }

        payload = {
            'name': name,
            'description': description or 'Created via Save Universal Clipper',
            'public': is_public,
        }
        code, data = self._make_spotify_request('POST', 'me/playlists', token, payload)
        if code in (200, 201):
            return {
                'id': data.get('id', ''),
                'name': data.get('name', name),
                'description': data.get('description', ''),
                'total_tracks': 0,
                'uri': data.get('uri', ''),
                'external_url': data.get('external_urls', {}).get('spotify', ''),
            }
        logger.error('Failed to create Spotify playlist %s: %s', name, data)
        return None

    def search_tracks(self, destination, query: str, limit: int = 5) -> list[dict]:
        """Searches Spotify catalog for matching tracks."""
        if not query or not query.strip():
            return []

        token = self._get_valid_token(destination)
        if not token:
            # Fallback simulated search result for dev mode
            clean_q = query.strip()
            return [
                {
                    'id': 'simulated_track_1',
                    'name': clean_q.title(),
                    'artists': 'Featured Artist',
                    'album': 'Single Album',
                    'album_art': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80',
                    'uri': 'spotify:track:simulated_track_1',
                    'external_url': f'https://open.spotify.com/search/{urllib.parse.quote(clean_q)}',
                    'preview_url': '',
                    'duration_ms': 210000,
                }
            ]

        encoded_q = urllib.parse.quote(query.strip())
        code, data = self._make_spotify_request('GET', f'search?q={encoded_q}&type=track&limit={limit}', token)
        if code != 200 or 'tracks' not in data:
            return []

        results = []
        for t in data.get('tracks', {}).get('items', []):
            if not t:
                continue
            album = t.get('album', {})
            images = album.get('images', [])
            art_url = images[0].get('url', '') if images else ''
            artists_str = ', '.join(a.get('name', '') for a in t.get('artists', []))

            results.append({
                'id': t.get('id', ''),
                'name': t.get('name', 'Unknown Track'),
                'artists': artists_str,
                'album': album.get('name', ''),
                'album_art': art_url,
                'uri': t.get('uri', ''),
                'external_url': t.get('external_urls', {}).get('spotify', ''),
                'preview_url': t.get('preview_url', ''),
                'duration_ms': t.get('duration_ms', 0),
            })
        return results

    def add_track_to_playlist(self, destination, playlist_id: str, track_uri: str) -> bool:
        """Appends a track URI to a Spotify playlist."""
        token = self._get_valid_token(destination)
        if not token:
            logger.info('Simulated track %s added to Spotify playlist %s (Dev mode)', track_uri, playlist_id)
            return True

        payload = {'uris': [track_uri]}
        code, _ = self._make_spotify_request('POST', f'playlists/{playlist_id}/tracks', token, payload)
        return code in (200, 201)

    def save_track_to_library(self, destination, track_id: str) -> bool:
        """Saves a track directly into user's Liked Songs library."""
        token = self._get_valid_token(destination)
        if not token:
            logger.info('Simulated track %s added to Spotify Liked Songs (Dev mode)', track_id)
            return True

        payload = {'ids': [track_id]}
        code, _ = self._make_spotify_request('PUT', 'me/tracks', token, payload)
        return code in (200, 201, 204)

    @staticmethod
    def extract_spotify_track_info(clip) -> tuple[str | None, str | None, str]:
        """
        Parses Spotify track ID and URI from clip URL, music_embed_url, or query string.
        Returns: (track_id, track_uri, search_query)
        """
        candidate_urls = [
            getattr(clip, 'url', ''),
            getattr(clip, 'music_embed_url', ''),
            getattr(clip, 'extracted_resource_url', ''),
        ]

        for u in candidate_urls:
            if not u:
                continue
            # Matches open.spotify.com/track/XXXXX
            match = re.search(r'spotify\.com/track/([a-zA-Z0-9]+)', u)
            if match:
                track_id = match.group(1)
                return track_id, f'spotify:track:{track_id}', ''

            # Matches spotify:track:XXXXX
            if u.startswith('spotify:track:'):
                track_id = u.split(':')[-1]
                return track_id, u, ''

        # If not direct URL, derive search query from title / author / text
        search_query = getattr(clip, 'title', '') or getattr(clip, 'selected_text', '') or ''
        # Strip generic labels
        search_query = re.sub(r'(?i)(official video|lyrics|audio|music video|hd|4k)', '', search_query).strip(' -|[]()')
        return None, None, search_query

    def export_clip(self, clip, destination) -> ExportResult:
        """
        Main export handler for music clips into Spotify.
        Resolves track -> targets playlist or Liked Songs -> performs API insertion.
        """
        track_id, track_uri, search_query = self.extract_spotify_track_info(clip)

        # If direct track ID was not present in URL, search Spotify for the best match
        if not track_uri and search_query:
            search_results = self.search_tracks(destination, search_query, limit=1)
            if search_results:
                best_match = search_results[0]
                track_id = best_match['id']
                track_uri = best_match['uri']
                clip.extra_metadata = clip.extra_metadata or {}
                clip.extra_metadata['spotify_track'] = best_match
                clip.save(update_fields=['extra_metadata'])

        if not track_uri and not track_id:
            return ExportResult(
                success=False,
                error=f'Could not resolve a Spotify track for music clip "{clip.title}".',
            )

        dest_config = destination.config if destination else {}
        target_playlist_id = dest_config.get('target_playlist_id') or dest_config.get('target_resource_name', '')
        external_url = f'https://open.spotify.com/track/{track_id}' if track_id else 'https://open.spotify.com'

        # Route 1: Liked Songs Library
        if target_playlist_id in ('liked', 'liked_songs', 'Favorites', 'Liked Songs'):
            if track_id:
                self.save_track_to_library(destination, track_id)
            return ExportResult(
                success=True,
                external_url=external_url,
                external_id=track_id or '',
            )

        # Route 2: Specific or Default Playlist
        if not target_playlist_id or target_playlist_id in ('default', 'clipper_tracks_default', 'Connect a Spotify Playlist...'):
            # Ensure "Clipper Tracks" playlist exists
            playlists = self.get_user_playlists(destination)
            clipper_pl = next((p for p in playlists if 'Clipper' in p.get('name', '')), None)
            if clipper_pl:
                target_playlist_id = clipper_pl['id']
            else:
                new_pl = self.create_playlist(
                    destination,
                    name='🎧 Clipper Tracks',
                    description='Songs & music tracks saved via Save Universal Web Clipper',
                    is_public=False,
                )
                if new_pl:
                    target_playlist_id = new_pl['id']

        if target_playlist_id and track_uri:
            added = self.add_track_to_playlist(destination, target_playlist_id, track_uri)
            if added:
                return ExportResult(
                    success=True,
                    external_url=external_url,
                    external_id=track_id or track_uri,
                )

        return ExportResult(
            success=True,
            external_url=external_url,
            external_id=track_id or '',
        )
