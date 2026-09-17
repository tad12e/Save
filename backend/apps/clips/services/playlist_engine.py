"""
Playlist Engine Service: High-speed Swipeable Knowledge Stacks ("Stories / TikTok for Saves").

Generates zero-AI-cost dynamic playlists:
1. Daily 5 Spaced Review Stack (high-priority streak builder)
2. Tag-based Auto-Playlists (every clip tag with >= 1 clip)
3. Category & Opportunity Stacks (Deadlines, Deep Articles, Audio, Code)
4. Full Swipe Action Handler (Like, Review, Watchlist, Snooze, Archive, Note, Share, Export)
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Any
from urllib.parse import urlparse

from django.db.models import Q
from django.utils import timezone

from apps.clips.models import Clip
from apps.destinations.models import Destination

logger = logging.getLogger(__name__)

PALETTE = [
    '#3FE769',  # Neon Mint (Primary)
    '#38BDF8',  # Sky Blue
    '#A855F7',  # Electric Purple
    '#F59E0B',  # Amber
    '#EC4899',  # Neon Pink
    '#6366F1',  # Indigo
    '#14B8A6',  # Teal
    '#F43F5E',  # Rose
]


class PlaylistEngine:
    """
    Algorithmic engine for generating and swiping through themed knowledge stacks.
    """

    @classmethod
    def get_user_playlists(cls, user: Any) -> list[dict[str, Any]]:
        """
        Returns list of all auto-generated playlists for the given user,
        ordered with Daily 5 review first, followed by tags and thematic categories.
        """
        clips_qs = (
            Clip.objects.filter(user=user)
            .exclude(status=Clip.STATUS_FAILED)
            .order_by('-created_at')
        )

        all_clips = list(clips_qs)
        if not all_clips:
            return []

        now = timezone.now()
        playlists: list[dict[str, Any]] = []

        # -----------------------------------------------------------------
        # 1. Daily 5 Spaced Review Stack (High priority)
        # -----------------------------------------------------------------
        from apps.clips.services.feed_engine import FeedEngine
        daily_queue = FeedEngine._build_daily_review_queue(clips_qs, now.date())
        if daily_queue:
            d5_clip_ids = {item['clip_id'] for item in daily_queue}
            d5_clips = [c for c in all_clips if str(c.id) in d5_clip_ids]
            reviewed_d5 = sum(
                1 for c in d5_clips
                if (c.extra_metadata or {}).get('feed_reviewed_at')
            )
            total_d5 = len(d5_clips)
            cover_domains = list(dict.fromkeys(
                cls._extract_domain(c.url) for c in d5_clips if c.url
            ))[:3]

            playlists.append({
                'id': 'daily-5',
                'slug': 'daily-5',
                'title': 'Daily 5 Review',
                'subtitle': 'Spaced Repetition Streak',
                'type': 'daily_5',
                'color': '#3FE769',
                'badge': 'DAILY',
                'clip_count': total_d5,
                'reviewed_count': reviewed_d5,
                'progress_pct': int((reviewed_d5 / total_d5 * 100)) if total_d5 else 0,
                'cover_domains': cover_domains,
                'cover_domain': cover_domains[0] if cover_domains else 'vault',
                'is_completed': reviewed_d5 >= total_d5 and total_d5 > 0,
            })

        # -----------------------------------------------------------------
        # 2. Tag-Based Auto-Playlists (Free Tier: 0 AI cost)
        # -----------------------------------------------------------------
        tag_buckets: dict[str, list[Clip]] = {}
        for clip in all_clips:
            clip_tags = clip.tags or []
            if isinstance(clip_tags, list):
                for t in clip_tags:
                    clean_tag = str(t).strip().lower()
                    if clean_tag and len(clean_tag) > 1:
                        tag_buckets.setdefault(clean_tag, []).append(clip)

        # Sort tags by frequency (most clips first)
        sorted_tags = sorted(
            tag_buckets.items(),
            key=lambda item: len(item[1]),
            reverse=True,
        )

        for idx, (tag_name, tagged_clips) in enumerate(sorted_tags[:12]):
            total_count = len(tagged_clips)
            reviewed_count = sum(
                1 for c in tagged_clips
                if (c.extra_metadata or {}).get('feed_reviewed_at')
            )
            color = PALETTE[(idx + 1) % len(PALETTE)]
            cover_domains = list(dict.fromkeys(
                cls._extract_domain(c.url) for c in tagged_clips if c.url
            ))[:3]

            slug = f"tag-{tag_name.replace(' ', '-').replace('/', '-')}"
            display_title = tag_name.title() if not tag_name.isupper() else tag_name

            playlists.append({
                'id': slug,
                'slug': slug,
                'title': f"#{display_title}",
                'subtitle': f"{total_count} clips saved",
                'type': 'tag',
                'tag_name': tag_name,
                'color': color,
                'badge': 'TAG',
                'clip_count': total_count,
                'reviewed_count': reviewed_count,
                'progress_pct': int((reviewed_count / total_count * 100)) if total_count else 0,
                'cover_domains': cover_domains,
                'cover_domain': cover_domains[0] if cover_domains else 'vault',
                'is_completed': reviewed_count >= total_count and total_count > 0,
            })

        # -----------------------------------------------------------------
        # 3. Thematic Stacks: Opportunities & Deadlines
        # -----------------------------------------------------------------
        opp_clips = [
            c for c in all_clips
            if c.deadline_date or c.intent in ['apply', 'attend', 'interview']
            or c.content_type in ['job', 'event', 'scholarship', 'grant', 'contest']
        ]
        if opp_clips:
            total_opp = len(opp_clips)
            rev_opp = sum(
                1 for c in opp_clips
                if (c.extra_metadata or {}).get('feed_reviewed_at')
            )
            opp_domains = list(dict.fromkeys(
                cls._extract_domain(c.url) for c in opp_clips if c.url
            ))[:3]
            playlists.append({
                'id': 'category-opportunities',
                'slug': 'category-opportunities',
                'title': 'Action & Deadlines',
                'subtitle': 'Opportunities & Events',
                'type': 'category',
                'color': '#F59E0B',
                'badge': 'RADAR',
                'clip_count': total_opp,
                'reviewed_count': rev_opp,
                'progress_pct': int((rev_opp / total_opp * 100)) if total_opp else 0,
                'cover_domains': opp_domains,
                'cover_domain': opp_domains[0] if opp_domains else 'vault',
                'is_completed': rev_opp >= total_opp and total_opp > 0,
            })

        # -----------------------------------------------------------------
        # 4. Thematic Stacks: Articles & Papers (Deep Reading)
        # -----------------------------------------------------------------
        article_clips = [
            c for c in all_clips
            if c.content_type in ['article', 'research', 'paper', 'essay', 'newsletter']
            or c.intent in ['learn', 'read', 'research']
        ]
        if len(article_clips) >= 2:
            total_art = len(article_clips)
            rev_art = sum(
                1 for c in article_clips
                if (c.extra_metadata or {}).get('feed_reviewed_at')
            )
            art_domains = list(dict.fromkeys(
                cls._extract_domain(c.url) for c in article_clips if c.url
            ))[:3]
            playlists.append({
                'id': 'category-articles',
                'slug': 'category-articles',
                'title': 'Deep Reading',
                'subtitle': 'Articles & Research',
                'type': 'category',
                'color': '#38BDF8',
                'badge': 'READ',
                'clip_count': total_art,
                'reviewed_count': rev_art,
                'progress_pct': int((rev_art / total_art * 100)) if total_art else 0,
                'cover_domains': art_domains,
                'cover_domain': art_domains[0] if art_domains else 'vault',
                'is_completed': rev_art >= total_art and total_art > 0,
            })

        # -----------------------------------------------------------------
        # 5. Thematic Stacks: Audio & Media
        # -----------------------------------------------------------------
        audio_clips = [
            c for c in all_clips
            if c.music_embed_url
            or c.content_type in ['audio', 'podcast', 'track', 'music', 'album']
            or 'spotify.com' in (c.url or '')
            or 'music.youtube.com' in (c.url or '')
            or 'soundcloud.com' in (c.url or '')
        ]
        if audio_clips:
            total_aud = len(audio_clips)
            rev_aud = sum(
                1 for c in audio_clips
                if (c.extra_metadata or {}).get('feed_reviewed_at')
            )
            aud_domains = list(dict.fromkeys(
                cls._extract_domain(c.url) for c in audio_clips if c.url
            ))[:3]
            playlists.append({
                'id': 'category-audio',
                'slug': 'category-audio',
                'title': 'Audio & Podcasts',
                'subtitle': 'Music & Listenables',
                'type': 'category',
                'color': '#C084FC',
                'badge': 'AUDIO',
                'clip_count': total_aud,
                'reviewed_count': rev_aud,
                'progress_pct': int((rev_aud / total_aud * 100)) if total_aud else 0,
                'cover_domains': aud_domains,
                'cover_domain': aud_domains[0] if aud_domains else 'spotify.com',
                'is_completed': rev_aud >= total_aud and total_aud > 0,
            })

        return playlists

    @classmethod
    def get_playlist_clips(cls, user: Any, playlist_id: str) -> list[dict[str, Any]]:
        """
        Returns an ordered list of rich summary cards for swiping inside the modal.
        Prioritizes unreviewed / snoozed clips first, followed by reviewed clips.
        """
        clips_qs = (
            Clip.objects.filter(user=user)
            .exclude(status=Clip.STATUS_FAILED)
            .select_related('destination')
        )

        target_clips: list[Clip] = []

        if playlist_id == 'daily-5':
            from apps.clips.services.feed_engine import FeedEngine
            now = timezone.now()
            daily_queue = FeedEngine._build_daily_review_queue(clips_qs, now.date())
            target_ids = [item['clip_id'] for item in daily_queue]
            clips_map = {str(c.id): c for c in clips_qs.filter(id__in=target_ids)}
            target_clips = [clips_map[cid] for cid in target_ids if cid in clips_map]

        elif playlist_id.startswith('tag-'):
            tag_name = playlist_id.replace('tag-', '').replace('-', ' ')
            all_user_clips = list(clips_qs.order_by('-created_at'))
            for c in all_user_clips:
                c_tags = [str(t).strip().lower() for t in (c.tags or [])]
                if tag_name.lower() in c_tags or any(tag_name.lower() in t for t in c_tags):
                    target_clips.append(c)

        elif playlist_id == 'category-opportunities':
            target_clips = list(
                clips_qs.filter(
                    Q(deadline_date__isnull=False) |
                    Q(intent__in=['apply', 'attend', 'interview']) |
                    Q(content_type__in=['job', 'event', 'scholarship', 'grant', 'contest'])
                ).order_by('-created_at')
            )

        elif playlist_id == 'category-articles':
            target_clips = list(
                clips_qs.filter(
                    Q(content_type__in=['article', 'research', 'paper', 'essay', 'newsletter']) |
                    Q(intent__in=['learn', 'read', 'research'])
                ).order_by('-created_at')
            )

        elif playlist_id == 'category-audio':
            target_clips = list(
                clips_qs.filter(
                    Q(music_embed_url__gt='') |
                    Q(content_type__in=['audio', 'podcast', 'track', 'music']) |
                    Q(url__icontains='spotify.com') |
                    Q(url__icontains='music.youtube.com') |
                    Q(url__icontains='soundcloud.com')
                ).order_by('-created_at')
            )

        else:
            target_clips = list(clips_qs.order_by('-created_at')[:20])

        # Separate unreviewed vs already reviewed for satisfying swipe progression
        unreviewed: list[Clip] = []
        reviewed: list[Clip] = []
        now = timezone.now()

        for c in target_clips:
            meta = c.extra_metadata or {}
            snoozed_until = meta.get('feed_snoozed_until')
            is_snoozed = False
            if snoozed_until:
                try:
                    snooze_dt = datetime.fromisoformat(snoozed_until)
                    if snooze_dt > now:
                        is_snoozed = True
                except Exception:
                    pass

            if not meta.get('feed_reviewed_at') and not is_snoozed:
                unreviewed.append(c)
            else:
                reviewed.append(c)

        ordered_clips = unreviewed + reviewed
        return [cls._format_swipe_card(c) for c in ordered_clips]

    @classmethod
    def handle_swipe_action(
        cls,
        user: Any,
        clip_id: str,
        action: str,
        note: str = '',
        destination_id: str = '',
    ) -> dict[str, Any]:
        """
        Executes interactive swipe actions for a clip:
        - 'like': Toggles heart/favorite
        - 'reviewed': Marks mastered/reviewed, increments spaced repetition streak
        - 'watchlist': Toggles career/opportunity watchlist
        - 'snooze': Temporarily snoozes card for 24h
        - 'archive': Sets status=done
        - 'note': Appends a reflection note to the clip
        - 'share': Increments share counter
        - 'destination': Enqueues sync to destination
        """
        clip = Clip.objects.filter(pk=clip_id, user=user).first()
        if not clip:
            return {'success': False, 'error': 'Clip not found'}

        meta = clip.extra_metadata or {}
        now = timezone.now()

        if action == 'like':
            meta['is_liked'] = not meta.get('is_liked', False)
            meta['liked_at'] = now.isoformat() if meta['is_liked'] else None

        elif action in ('reviewed', 'review', 'master'):
            meta['feed_reviewed_at'] = now.isoformat()
            meta['review_count'] = meta.get('review_count', 0) + 1

        elif action == 'watchlist':
            meta['feed_watchlisted'] = not meta.get('feed_watchlisted', False)

        elif action == 'snooze':
            meta['feed_snoozed_until'] = (now + timedelta(days=1)).isoformat()

        elif action == 'archive':
            clip.status = Clip.STATUS_DONE
            meta['feed_archived_at'] = now.isoformat()

        elif action == 'note':
            notes = meta.setdefault('swipe_notes', [])
            if note:
                notes.append({'text': note, 'created_at': now.isoformat()})
                meta['feed_user_note'] = note

        elif action == 'share':
            meta['share_count'] = meta.get('share_count', 0) + 1

        elif action == 'destination':
            if destination_id:
                dest = Destination.objects.filter(pk=destination_id, user=user).first()
                if dest:
                    clip.destination = dest
                    clip.export_status = 'pending'

        clip.extra_metadata = meta
        clip.save(update_fields=['extra_metadata', 'status', 'destination', 'export_status'])

        # Recalculate streak
        from apps.clips.services.feed_engine import FeedEngine
        clips_qs = Clip.objects.filter(user=user)
        streak = FeedEngine._calculate_review_streak(clips_qs, now.date())

        return {
            'success': True,
            'clip_id': str(clip.id),
            'action': action,
            'is_liked': bool(meta.get('is_liked')),
            'is_reviewed': bool(meta.get('feed_reviewed_at')),
            'is_watchlisted': bool(meta.get('feed_watchlisted')),
            'review_streak': streak,
            'updated_at': now.isoformat(),
        }

    # -------------------------------------------------------------------------
    # Card Formatter
    # -------------------------------------------------------------------------
    @classmethod
    def _format_swipe_card(cls, clip: Clip) -> dict[str, Any]:
        meta = clip.extra_metadata or {}
        domain = cls._extract_domain(clip.url)

        # Extract crisp key takeaway
        takeaway = (
            meta.get('key_takeaway')
            or meta.get('takeaway')
            or meta.get('summary_highlight')
        )
        if not takeaway and clip.summary:
            takeaway = clip.summary.split('.')[0] + '.'
        if not takeaway and clip.selected_text:
            takeaway = clip.selected_text[:160] + '...'

        # Check if currently snoozed
        is_snoozed = False
        snoozed_until = meta.get('feed_snoozed_until')
        if snoozed_until:
            try:
                is_snoozed = datetime.fromisoformat(snoozed_until) > timezone.now()
            except Exception:
                pass

        # Deadline countdown
        days_until_deadline = None
        if clip.deadline_date:
            diff = clip.deadline_date - timezone.now().date()
            days_until_deadline = diff.days

        return {
            'id': str(clip.id),
            'title': clip.title or 'Untitled Clip',
            'url': clip.url,
            'domain': domain,
            'summary': clip.summary or clip.selected_text or 'No summary available.',
            'key_takeaway': takeaway or 'Tap to review key points.',
            'content_type': clip.content_type or 'clip',
            'intent': clip.intent or 'learn',
            'tags': clip.tags or [],
            'deadline_date': clip.deadline_date.isoformat() if clip.deadline_date else None,
            'days_until_deadline': days_until_deadline,
            'music_embed_url': clip.music_embed_url or '',
            'created_at': clip.created_at.isoformat() if clip.created_at else None,
            'time_ago': cls._format_time_ago(clip.created_at),
            'is_liked': bool(meta.get('is_liked')),
            'is_reviewed': bool(meta.get('feed_reviewed_at')),
            'is_watchlisted': bool(meta.get('feed_watchlisted')),
            'is_snoozed': is_snoozed,
            'notes': meta.get('swipe_notes', []),
            'destination_name': clip.destination.name if clip.destination else None,
            'export_status': clip.export_status,
        }

    # -------------------------------------------------------------------------
    # Helper Utilities
    # -------------------------------------------------------------------------
    @staticmethod
    def _extract_domain(url: str) -> str:
        if not url:
            return 'vault'
        try:
            d = urlparse(url).netloc.lower()
            if d.startswith('www.'):
                d = d[4:]
            return d.split(':')[0]
        except Exception:
            return 'vault'

    @staticmethod
    def _format_time_ago(dt: datetime) -> str:
        if not dt:
            return 'just now'
        diff = timezone.now() - dt
        seconds = int(diff.total_seconds())
        if seconds < 60:
            return 'just now'
        minutes = seconds // 60
        if minutes < 60:
            return f"{minutes}m ago"
        hours = minutes // 60
        if hours < 24:
            return f"{hours}h ago"
        days = hours // 24
        return f"{days}d ago"
