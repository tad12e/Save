"""
Audio & Music Recognition Service for Save Clipper.
Supports:
1. AudD.io acoustic fingerprinting (when AUDD_API_TOKEN is provided)
2. Live YouTube Music & YouTube search (perfect for Mezmurs, spiritual chants, remixes, and indie tracks)
3. Apple Music / iTunes live catalog search
4. Spotify Track URI & metadata integration
"""

import base64
import json
import logging
import os
import re
import urllib.parse
import urllib.request
from django.conf import settings

logger = logging.getLogger(__name__)

AUDD_API_URL = "https://api.audd.io/"


class AudioRecognizer:
    @staticmethod
    def get_api_token():
        return os.getenv('AUDD_API_TOKEN') or getattr(settings, 'AUDD_API_TOKEN', '')

    @classmethod
    def recognize_audio(cls, audio_base64: str, audio_format: str = 'webm', sample_title_hint: str = ''):
        """
        Submits base64 audio data to AudD / YouTube Music / iTunes for music recognition.
        """
        api_token = cls.get_api_token()

        # Clean base64 header if present
        if ',' in audio_base64:
            audio_base64 = audio_base64.split(',', 1)[1]

        # 1. If AudD API token is present and valid audio provided, query AudD API
        if api_token and audio_base64 and audio_base64 != 'SIMULATED_AUDIO_SNIPPET':
            try:
                payload = {
                    'api_token': api_token,
                    'audio': audio_base64,
                    'return': 'spotify,apple_music',
                }
                encoded_data = urllib.parse.urlencode(payload).encode('utf-8')
                req = urllib.request.Request(
                    AUDD_API_URL,
                    data=encoded_data,
                    headers={'Content-Type': 'application/x-www-form-urlencoded'}
                )
                with urllib.request.urlopen(req, timeout=12) as response:
                    res_json = json.loads(response.read().decode('utf-8'))

                if res_json.get('status') == 'success' and res_json.get('result'):
                    result = res_json['result']
                    spotify_data = result.get('spotify') or {}
                    apple_data = result.get('apple_music') or {}

                    spotify_id = spotify_data.get('id', '')
                    spotify_uri = f"spotify:track:{spotify_id}" if spotify_id else ''
                    spotify_url = (
                        spotify_data.get('external_urls', {}).get('spotify')
                        if isinstance(spotify_data.get('external_urls'), dict)
                        else (f"https://open.spotify.com/track/{spotify_id}" if spotify_id else '')
                    )
                    artwork_url = (
                        (spotify_data.get('album', {}).get('images', [{}])[0].get('url'))
                        if isinstance(spotify_data.get('album'), dict) and spotify_data.get('album', {}).get('images')
                        else (apple_data.get('artwork', {}).get('url', '').replace('{w}x{h}', '600x600'))
                    )
                    preview_url = (
                        spotify_data.get('preview_url')
                        or (apple_data.get('previews', [{}])[0].get('url') if apple_data.get('previews') else '')
                    )

                    return {
                        'success': True,
                        'title': result.get('title', 'Unknown Track'),
                        'artist': result.get('artist', 'Unknown Artist'),
                        'album': result.get('album', ''),
                        'release_date': result.get('release_date', ''),
                        'label': result.get('label', ''),
                        'timecode': result.get('timecode', '0:00'),
                        'spotify_id': spotify_id,
                        'spotify_uri': spotify_uri,
                        'spotify_url': spotify_url,
                        'youtube_music_url': f"https://music.youtube.com/search?q={urllib.parse.quote(result.get('title', '') + ' ' + result.get('artist', ''))}",
                        'artwork_url': artwork_url or 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
                        'preview_url': preview_url,
                        'apple_music_url': apple_data.get('url', ''),
                        'is_simulated': False,
                    }
                else:
                    logger.info("AudD returned no match: %s", res_json.get('error'))
            except Exception as e:
                logger.warning("AudD API request failed: %s", e)

        # 2. Option A & Native Sound Badges: Check if hint has a clean song title (e.g., from Shorts "Contains ...")
        if sample_title_hint:
            clean_sound = re.sub(r'^(?:Contains|contains)\s+', '', sample_title_hint).strip()

            # If the hint is a direct song name (e.g., "Summertime Sadness"), query iTunes / Shazam first
            if clean_sound and not any(tag in clean_sound.lower() for tag in ('#shorts', 'edit', 'tiktok', 'instagram video')):
                itunes_exact = cls._search_itunes_track(clean_sound)
                if itunes_exact:
                    return itunes_exact
                shazam_exact = cls._search_shazam_track(clean_sound)
                if shazam_exact:
                    return shazam_exact

            # Check for YouTube's native 'Music in this video' (Content ID)
            content_id_match = cls._extract_youtube_content_id_music(clean_sound or sample_title_hint)
            if content_id_match:
                return content_id_match

            # 3. Query YouTube Music / YouTube Search (crucial for Mezmurs, spiritual chants, gospel & unreleased tracks)
            yt_match = cls._search_youtube_music(clean_sound or sample_title_hint)
            if yt_match:
                return yt_match

            # 4. Fallback to iTunes API
            itunes_match = cls._search_itunes_track(clean_sound or sample_title_hint)
            if itunes_match:
                return itunes_match

            # 5. Fallback to Shazam Catalog Search ($0 API cost)
            shazam_match = cls._search_shazam_track(clean_sound or sample_title_hint)
            if shazam_match:
                return shazam_match

        # 6. Return clean structured sound result for original Reel audio
        clean_hint = re.sub(r'[:•\-\|#@].*', '', sample_title_hint).strip() if sample_title_hint else 'Reel Sound'
        return {
            'success': True,
            'title': clean_hint or 'Instagram Reel Sound',
            'artist': 'Original Audio / Creator',
            'album': 'Instagram Audio',
            'spotify_id': '',
            'spotify_uri': '',
            'spotify_url': f"https://open.spotify.com/search/{urllib.parse.quote(clean_hint)}",
            'youtube_music_url': f"https://music.youtube.com/search?q={urllib.parse.quote(clean_hint)}",
            'artwork_url': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
            'preview_url': '',
            'is_simulated': True,
        }

    @classmethod
    def _extract_youtube_content_id_music(cls, hint: str):
        """
        Option A: Extracts YouTube's native 'Music in this video' (Content ID)
        metadata directly from the YouTube watch page if available.
        """
        try:
            # 1. Identify video ID from URL or title search
            video_id = None
            id_match = re.search(r'(?:v=|youtu\.be/|shorts/)([a-zA-Z0-9_-]{11})', hint)
            if id_match:
                video_id = id_match.group(1)
            else:
                # Clean title hint to find video ID on YouTube
                clean_term = re.sub(r'(?:on Instagram|Instagram video|Instagram photo|Reel by|•\s*Instagram.*|Original audio|Original Audio)', '', hint, flags=re.IGNORECASE).strip()
                clean_term = re.sub(r'[#@].*', '', clean_term).strip()
                clean_term = re.sub(r'^\(\d+\)\s*', '', clean_term).strip()
                clean_term = re.sub(r'\s*-\s*YouTube.*$', '', clean_term, flags=re.IGNORECASE).strip()
                if not clean_term:
                    clean_term = hint.strip()

                search_query = urllib.parse.quote(clean_term)
                search_url = f"https://www.youtube.com/results?search_query={search_query}"
                req = urllib.request.Request(
                    search_url,
                    headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept-Language': 'en-US,en;q=0.9',
                    }
                )
                with urllib.request.urlopen(req, timeout=6) as resp:
                    search_html = resp.read().decode('utf-8', errors='ignore')
                vids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', search_html)
                if vids:
                    video_id = vids[0]

            if not video_id:
                return None

            # 2. Fetch the YouTube Watch page HTML
            watch_url = f"https://www.youtube.com/watch?v={video_id}"
            req = urllib.request.Request(
                watch_url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            )
            with urllib.request.urlopen(req, timeout=7) as response:
                watch_html = response.read().decode('utf-8', errors='ignore')

            # 3. Check for YouTube Content ID / "Music in this video" metadata
            song_title = None
            song_artist = None
            song_album = ''

            # Pattern: metadataRowRenderer with "Song", "Artist", "Album"
            song_match = re.search(
                r'"metadataRowRenderer":\s*\{"title":\s*\{"(?:simpleText|runs)":(?:\[\{"text":)?\s*"Song"\}'
                r'.*?"contents":\s*\[\{"runs":\s*\[\{"text":\s*"([^"]+)"\}',
                watch_html,
                re.DOTALL
            )
            if song_match:
                candidate = song_match.group(1).strip()
                if candidate.lower() not in ('search filters', 'filters'):
                    song_title = candidate

            artist_match = re.search(
                r'"metadataRowRenderer":\s*\{"title":\s*\{"(?:simpleText|runs)":(?:\[\{"text":)?\s*"Artist"\}'
                r'.*?"contents":\s*\[\{"runs":\s*\[\{"text":\s*"([^"]+)"\}',
                watch_html,
                re.DOTALL
            )
            if artist_match:
                song_artist = artist_match.group(1).strip()

            album_match = re.search(
                r'"metadataRowRenderer":\s*\{"title":\s*\{"(?:simpleText|runs)":(?:\[\{"text":)?\s*"Album"\}'
                r'.*?"contents":\s*\[\{"runs":\s*\[\{"text":\s*"([^"]+)"\}',
                watch_html,
                re.DOTALL
            )
            if album_match:
                song_album = album_match.group(1).strip()

            # Alternative Pattern: musicTitle / musicArtist in videoDescriptionMusicSectionRenderer
            if not song_title:
                music_title_match = re.search(r'"musicTitle":\s*\{"(?:simpleText|runs)":(?:\[\{"text":)?\s*"([^"]+)"\}', watch_html)
                if music_title_match:
                    song_title = music_title_match.group(1).strip()
                music_artist_match = re.search(r'"musicArtist":\s*\{"(?:simpleText|runs)":(?:\[\{"text":)?\s*"([^"]+)"\}', watch_html)
                if music_artist_match:
                    song_artist = music_artist_match.group(1).strip()

            if not song_title:
                return None

            # 4. If found in YouTube Content ID, check iTunes for high-res artwork & preview
            full_query = f"{song_title} {song_artist or ''}".strip()
            itunes_info = cls._search_itunes_track(full_query) or {}

            return {
                'success': True,
                'title': song_title,
                'artist': song_artist or itunes_info.get('artist', 'YouTube Content ID'),
                'album': song_album or itunes_info.get('album', 'Music in this video'),
                'release_date': itunes_info.get('release_date', ''),
                'spotify_id': itunes_info.get('spotify_id', ''),
                'spotify_uri': itunes_info.get('spotify_uri', ''),
                'spotify_url': itunes_info.get('spotify_url') or f"https://open.spotify.com/search/{urllib.parse.quote(full_query)}",
                'youtube_music_url': f"https://music.youtube.com/watch?v={video_id}",
                'youtube_url': f"https://www.youtube.com/watch?v={video_id}",
                'artwork_url': itunes_info.get('artwork_url') or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                'preview_url': itunes_info.get('preview_url', ''),
                'is_simulated': False,
                'is_youtube': True,
                'source': 'youtube_content_id',
            }
        except Exception as e:
            logger.info("YouTube Content ID extraction failed for '%s': %s", hint, e)
            return None

    @staticmethod
    def _search_youtube_music(hint: str):
        """Searches YouTube & YouTube Music for Mezmurs, chants, and live audio."""
        try:
            # Clean noise
            clean_term = re.sub(r'(?:on Instagram|Instagram video|Instagram photo|Reel by|•\s*Instagram.*|Original audio|Original Audio)', '', hint, flags=re.IGNORECASE).strip()
            clean_term = re.sub(r'[#@].*', '', clean_term).strip()
            clean_term = re.sub(r'^\(\d+\)\s*', '', clean_term).strip()
            clean_term = re.sub(r'\s*-\s*YouTube.*$', '', clean_term, flags=re.IGNORECASE).strip()
            if not clean_term:
                clean_term = hint.strip()

            search_query = urllib.parse.quote(f"{clean_term}")
            url = f"https://www.youtube.com/results?search_query={search_query}"
            req = urllib.request.Request(
                url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9,am;q=0.8',
                }
            )
            with urllib.request.urlopen(req, timeout=7) as response:
                html = response.read().decode('utf-8', errors='ignore')

            # Find video IDs
            video_ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)
            if not video_ids:
                return None

            video_id = video_ids[0]
            # Try to extract the title from the video renderer JSON in html (skipping "Search filters")
            title_matches = re.findall(r'"videoRenderer":\{"videoId":"[a-zA-Z0-9_-]{11}".*?"title":\{"runs":\[\{"text":"([^"]+)"\}', html)
            valid_titles = [t for t in title_matches if t.lower() not in ('search filters', 'filters', 'all', 'videos')]
            extracted_title = valid_titles[0] if valid_titles else None

            if not extracted_title:
                all_titles = re.findall(r'"title":\{"runs":\[\{"text":"([^"]+)"\}', html)
                valid_all = [t for t in all_titles if t.lower() not in ('search filters', 'filters', 'all', 'videos')]
                extracted_title = valid_all[0] if valid_all else clean_term

            # Try to extract channel name
            channel_match = re.search(r'"ownerText":\{"runs":\[\{"text":"([^"]+)"\}', html)
            extracted_artist = channel_match.group(1) if channel_match else 'YouTube Music'

            return {
                'success': True,
                'title': extracted_title,
                'artist': extracted_artist,
                'album': 'YouTube Music / Mezmur',
                'release_date': '',
                'spotify_id': '',
                'spotify_uri': '',
                'spotify_url': f"https://open.spotify.com/search/{urllib.parse.quote(extracted_title)}",
                'youtube_music_url': f"https://music.youtube.com/watch?v={video_id}",
                'youtube_url': f"https://www.youtube.com/watch?v={video_id}",
                'artwork_url': f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                'preview_url': '',
                'is_simulated': False,
                'is_youtube': True,
            }
        except Exception as e:
            logger.info("YouTube Music search failed for '%s': %s", hint, e)
            return None

    @staticmethod
    def _search_itunes_track(hint: str):
        """Searches Apple / iTunes public database for real track metadata and 30s preview."""
        try:
            clean_term = re.sub(r'(?:on Instagram|Instagram video|Instagram photo|Reel by|•\s*Instagram.*|Original audio|Original Audio)', '', hint, flags=re.IGNORECASE).strip()
            clean_term = re.sub(r'[:•\-\|#@].*', '', clean_term).strip()
            if not clean_term or len(clean_term) < 2:
                clean_term = hint.strip()

            url = f"https://itunes.apple.com/search?term={urllib.parse.quote(clean_term[:80])}&entity=song&limit=1"
            req = urllib.request.Request(url, headers={'User-Agent': 'Save-Clipper/1.0'})
            with urllib.request.urlopen(req, timeout=6) as response:
                data = json.loads(response.read().decode('utf-8', errors='ignore'))

            if data.get('resultCount', 0) > 0 and data.get('results'):
                track = data['results'][0]
                artwork = track.get('artworkUrl100', '').replace('100x100bb', '600x600bb')
                return {
                    'success': True,
                    'title': track.get('trackName', clean_term),
                    'artist': track.get('artistName', 'Unknown Artist'),
                    'album': track.get('collectionName', ''),
                    'release_date': track.get('releaseDate', '')[:10] if track.get('releaseDate') else '',
                    'spotify_id': '',
                    'spotify_uri': '',
                    'spotify_url': track.get('trackViewUrl', ''),
                    'youtube_music_url': f"https://music.youtube.com/search?q={urllib.parse.quote(track.get('trackName', '') + ' ' + track.get('artistName', ''))}",
                    'artwork_url': artwork or 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
                    'preview_url': track.get('previewUrl', ''),
                    'is_simulated': False,
                }
        except Exception as e:
            logger.info("iTunes search fallback failed for '%s': %s", hint, e)
        return None

    @staticmethod
    def _search_shazam_track(hint: str):
        """
        Queries Shazam's public search API (100% Free, $0 API cost).
        Retrieves Shazam track metadata, official artist, and album artwork.
        """
        try:
            clean_term = re.sub(r'(?:on Instagram|Instagram video|Instagram photo|Reel by|•\s*Instagram.*|Original audio|Original Audio)', '', hint, flags=re.IGNORECASE).strip()
            clean_term = re.sub(r'[:•\-\|#@].*', '', clean_term).strip()
            if not clean_term or len(clean_term) < 2:
                clean_term = hint.strip()

            search_query = urllib.parse.quote(clean_term[:80])
            url = f"https://www.shazam.com/services/search/v4/en-US/US/web/search?term={search_query}&numResults=3"
            req = urllib.request.Request(
                url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                }
            )
            with urllib.request.urlopen(req, timeout=6) as response:
                data = json.loads(response.read().decode('utf-8', errors='ignore'))

            hits = data.get('tracks', {}).get('hits', [])
            if hits:
                track = hits[0].get('track', {})
                title = track.get('title') or clean_term
                artist = track.get('subtitle') or 'Unknown Artist'
                artwork = track.get('images', {}).get('coverarthq') or track.get('images', {}).get('coverart', '')
                shazam_url = track.get('url', '')

                preview_url = ''
                actions = track.get('hub', {}).get('actions', [])
                for action in actions:
                    if action.get('type') == 'audio/m4a' and action.get('uri'):
                        preview_url = action.get('uri')
                        break

                return {
                    'success': True,
                    'title': title,
                    'artist': artist,
                    'album': 'Shazam Catalog',
                    'release_date': '',
                    'spotify_id': '',
                    'spotify_uri': '',
                    'spotify_url': f"https://open.spotify.com/search/{urllib.parse.quote(title + ' ' + artist)}",
                    'youtube_music_url': f"https://music.youtube.com/search?q={urllib.parse.quote(title + ' ' + artist)}",
                    'artwork_url': artwork or 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
                    'preview_url': preview_url,
                    'shazam_url': shazam_url,
                    'is_simulated': False,
                    'source': 'shazam',
                }
        except Exception as e:
            logger.info("Shazam public search failed for '%s': %s", hint, e)
        return None
