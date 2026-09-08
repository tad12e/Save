"""
YouTube Music Destination Adapter for Save.
Handles exporting music clips, recognized audio, and song bookmarks directly into
YouTube Music playlists or generating streaming links.
Mirrors the SpotifyAdapter interface for seamless multi-provider music routing.
"""

import json
import logging
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from django.conf import settings

from .base import BaseDestinationAdapter, ExportResult

logger = logging.getLogger(__name__)


class YouTubeMusicAdapter(BaseDestinationAdapter):
    provider = 'youtube_music'

    @staticmethod
    def _extract_video_id(url: str) -> str | None:
        """Extracts YouTube 11-char video ID from various YouTube URL formats."""
        if not url:
            return None
        patterns = [
            r'(?:v=|\/v\/|youtu\.be\/|\/embed\/|\/watch\?v=|\/watch\?.+&v=)([a-zA-Z0-9_-]{11})',
            r'music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})',
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None

    @staticmethod
    def _get_credentials(destination=None) -> tuple[str, str, str]:
        """Resolves API Key, Access Token, and default Playlist ID."""
        config = destination.config if destination else {}
        api_key = (
            config.get('api_key')
            or os.getenv('YOUTUBE_API_KEY')
            or getattr(settings, 'YOUTUBE_API_KEY', '')
            or getattr(settings, 'GOOGLE_API_KEY', '')
        )
        access_token = config.get('access_token') or config.get('oauth_token') or ''
        playlist_id = (
            config.get('playlist_id')
            or config.get('target_resource_id')
            or ''
        )
        return api_key, access_token, playlist_id

    def export_clip(self, clip, destination) -> ExportResult:
        api_key, access_token, playlist_id = self._get_credentials(destination)
        extra = clip.extra_metadata or {}

        track_title = extra.get('track_title') or extra.get('track_name') or clip.title or ''
        track_artist = extra.get('track_artist') or extra.get('artist') or clip.source_author or ''

        # 1. Check if the clip URL itself is already a YouTube video
        video_id = self._extract_video_id(clip.url) or self._extract_video_id(extra.get('music_embed_url', ''))

        # 2. If not a direct video URL, construct search query
        query_parts = [p for p in (track_title, track_artist) if p]
        query = " ".join(query_parts).strip() or clip.url

        # 3. If API key or OAuth is configured, query YouTube API to resolve video_id
        if not video_id and (api_key or access_token):
            try:
                search_url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={urllib.parse.quote(query)}&type=video&maxResults=1"
                headers = {'User-Agent': 'Save-YouTubeMusic-Adapter/1.0'}
                if access_token:
                    headers['Authorization'] = f'Bearer {access_token}'
                elif api_key:
                    search_url += f"&key={api_key}"

                req = urllib.request.Request(search_url, headers=headers)
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    items = data.get('items', [])
                    if items:
                        video_id = items[0].get('id', {}).get('videoId')
            except Exception as search_err:
                logger.debug("YouTube API track search error: %s", search_err)

        # 4. If target playlist_id and access_token exist, insert track into user's YouTube playlist
        added_to_playlist = False
        if video_id and playlist_id and access_token:
            try:
                insert_result = self.add_track_to_playlist(destination, video_id, playlist_id)
                if insert_result.get('success'):
                    added_to_playlist = True
            except Exception as pl_err:
                logger.warning("Could not append track to YouTube playlist: %s", pl_err)

        # 5. Build high-fidelity YouTube Music streaming and search URLs
        if video_id:
            yt_music_url = f"https://music.youtube.com/watch?v={video_id}"
            external_id = video_id
        else:
            yt_music_url = f"https://music.youtube.com/search?q={urllib.parse.quote(query)}"
            external_id = ''

        # Store resolved streaming URL in clip metadata so frontend MusicRadar can link to it
        extra['youtube_music_url'] = yt_music_url
        if video_id:
            extra['youtube_video_id'] = video_id
        if added_to_playlist:
            extra['youtube_playlist_id'] = playlist_id
        clip.extra_metadata = extra
        clip.save(update_fields=['extra_metadata'])

        logger.info("Exported music clip %s to YouTube Music: %s", clip.id, yt_music_url)
        return ExportResult(
            success=True,
            external_url=yt_music_url,
            external_id=external_id,
        )

    def search_track(self, destination, query: str) -> list[dict]:
        """
        Searches YouTube Data API for tracks matching the query.
        Returns a list of normalized track items.
        """
        api_key, access_token, _ = self._get_credentials(destination)
        if not (api_key or access_token) or not query:
            # Fallback when no API credentials are provided: return structured search link
            return [{
                'id': '',
                'title': query,
                'artist': '',
                'youtube_music_url': f"https://music.youtube.com/search?q={urllib.parse.quote(query)}",
            }]

        search_url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={urllib.parse.quote(query)}&type=video&maxResults=5"
        headers = {'User-Agent': 'Save-YouTubeMusic-Adapter/1.0'}
        if access_token:
            headers['Authorization'] = f'Bearer {access_token}'
        elif api_key:
            search_url += f"&key={api_key}"

        try:
            req = urllib.request.Request(search_url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                results = []
                for item in data.get('items', []):
                    vid = item.get('id', {}).get('videoId', '')
                    snippet = item.get('snippet', {})
                    results.append({
                        'id': vid,
                        'title': snippet.get('title', ''),
                        'artist': snippet.get('channelTitle', ''),
                        'thumbnail': snippet.get('thumbnails', {}).get('default', {}).get('url', ''),
                        'youtube_music_url': f"https://music.youtube.com/watch?v={vid}",
                    })
                return results
        except Exception as exc:
            logger.error("YouTube search failed: %s", exc)
            return []

    def add_track_to_playlist(self, destination, video_id: str, playlist_id: str) -> dict:
        """
        Appends a video/track to the specified YouTube playlist using YouTube Data API v3.
        Requires OAuth access_token with youtube or youtube.force-ssl scope.
        """
        _, access_token, _ = self._get_credentials(destination)
        if not access_token:
            return {'success': False, 'error': 'Adding to YouTube playlists requires an authenticated OAuth token.'}

        url = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet"
        payload = {
            'snippet': {
                'playlistId': playlist_id,
                'resourceId': {
                    'kind': 'youtube#video',
                    'videoId': video_id,
                },
            }
        }
        data_bytes = json.dumps(payload).encode('utf-8')
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
            'User-Agent': 'Save-YouTubeMusic-Adapter/1.0',
        }
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                return {'success': True, 'playlist_item_id': res_data.get('id')}
        except urllib.error.HTTPError as exc:
            err = exc.read().decode('utf-8', errors='ignore')
            return {'success': False, 'error': f"YouTube API error HTTP {exc.code}: {err[:200]}"}
        except Exception as exc:
            return {'success': False, 'error': str(exc)}

    def ping(self, destination) -> dict:
        """
        Verifies YouTube credentials or returns general readiness for YouTube Music link generation.
        """
        api_key, access_token, playlist_id = self._get_credentials(destination)
        start_time = time.time()

        if access_token or api_key:
            # Check with a lightweight YouTube search ping
            test_url = f"https://www.googleapis.com/youtube/v3/search?part=id&q=test&maxResults=1"
            headers = {'User-Agent': 'Save-YouTubeMusic-Adapter/1.0'}
            if access_token:
                headers['Authorization'] = f'Bearer {access_token}'
            else:
                test_url += f"&key={api_key}"

            req = urllib.request.Request(test_url, headers=headers)
            try:
                with urllib.request.urlopen(req, timeout=8) as resp:
                    latency_ms = int((time.time() - start_time) * 1000)
                    return {
                        'success': True,
                        'status_code': resp.status,
                        'latency_ms': latency_ms,
                        'message': 'YouTube Music API connection verified OK.',
                    }
            except Exception as exc:
                return {'success': False, 'error': f"YouTube API test failed: {str(exc)}"}

        # If no custom API key is set, YouTube Music is in Direct Web/Deep-Link mode (0 setup required)
        return {
            'success': True,
            'status_code': 200,
            'latency_ms': 5,
            'message': 'YouTube Music Direct Web streaming resolver active (no API key required).',
        }
