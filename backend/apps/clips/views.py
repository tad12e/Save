from datetime import timedelta
import logging

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

from apps.destinations.models import Destination

from .models import Clip
from .serializers import ClipCreateSerializer, ClipSerializer
from .services.url import hash_url, normalise_url

User = get_user_model()


# def get_or_create_demo_user():
#     user, _ = User.objects.get_or_create(
#         email='tadiwos@save.app',
#         defaults={'name': 'Tadiwos User', 'is_active': True},
#     )
#     return user


class ClipCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required. Please sign in to view clips.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        clips = (
            Clip.objects.filter(user=request.user)
            .select_related('destination')
            .annotate(prefetched_child_count=Count('child_clips'))
            .order_by('-created_at')[:100]
        )
        return Response(ClipSerializer(clips, many=True).data)

    def post(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required. Please sign in to save clips.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        user = request.user
        # user = request.user if (request.user and request.user.is_authenticated) else get_or_create_demo_user()

        url_val = request.data.get('url')
        if not url_val:
            return Response({'error': 'URL is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check for Local Privacy Mode Header or Request Parameter (Zero Server Data Retention)
        is_privacy_mode = (
            request.headers.get('X-Privacy-Mode') == 'true' or 
            str(request.data.get('privacy_mode', '')).lower() == 'true'
        )

        sel_text = request.data.get('selected_text', '').strip()
        norm_url = normalise_url(url_val)
        u_hash = hash_url(f"{norm_url}||{sel_text}")

        if is_privacy_mode:
            # Ephemeral Zero-Storage Privacy Processing: extract in-memory, return to client, do NOT persist to DB
            from apps.clips.services.extract import extract_clip_metadata
            dummy_clip = type('DummyClip', (), {
                'url': url_val,
                'selected_text': sel_text,
                'title': '',
                'summary': '',
                'content_type': 'article',
                'tags': []
            })()
            try:
                extracted = extract_clip_metadata(dummy_clip)
            except Exception:
                extracted = {
                    'title': request.data.get('title') or url_val,
                    'summary': sel_text,
                    'content_type': 'article',
                    'tags': ['private_local']
                }

            return Response({
                'id': f"local_{u_hash[:12]}",
                'url': url_val,
                'title': extracted.get('title', url_val),
                'summary': extracted.get('summary', ''),
                'selected_text': sel_text,
                'content_type': extracted.get('content_type', 'article'),
                'tags': extracted.get('tags', []),
                'privacy_mode': True,
                'status': 'DONE',
                'message': 'Processed in Ephemeral Privacy Mode (Zero Server Data Retention)'
            }, status=status.HTTP_200_OK)

        # Allow multiple clips from same URL if selected_text or hash differs
        existing = Clip.objects.filter(user=user, url_hash=u_hash).first()
        if existing:
            existing.duplicate = True
            return Response(ClipSerializer(existing).data, status=status.HTTP_200_OK)

        destination = None
        destination_id = request.data.get('destination_id')
        if destination_id:
            destination = Destination.objects.filter(pk=destination_id, user=user).first()
        if not destination:
            from apps.destinations.services import get_user_destination
            destination = get_user_destination(user)

        # Extract user custom metadata (note, tags, custom deadline, chosen table)
        user_tags = request.data.get('tags') or []
        if isinstance(user_tags, str):
            user_tags = [t.strip().replace('#', '') for t in user_tags.split(',') if t.strip()]

        user_note = (request.data.get('note') or '').strip()
        custom_deadline = request.data.get('deadline') or request.data.get('deadline_date')

        extra_meta = {}
        if user_note:
            extra_meta['user_note'] = user_note
        if request.data.get('table_id'):
            extra_meta['target_table_id'] = request.data.get('table_id')
        if request.data.get('table_name') or request.data.get('tableName'):
            extra_meta['target_table_name'] = request.data.get('table_name') or request.data.get('tableName')

        clip = Clip.objects.create(
            user=user,
            url=url_val,
            url_hash=u_hash,
            selected_text=request.data.get('selected_text', ''),
            status=Clip.STATUS_PENDING,
            destination=destination,
            tags=user_tags,
            extra_metadata=extra_meta,
        )

        if custom_deadline:
            try:
                from datetime import datetime
                clip.deadline_date = datetime.strptime(str(custom_deadline)[:10], '%Y-%m-%d').date()
                clip.save(update_fields=['deadline_date'])
            except Exception:
                pass

        clip.duplicate = False

        try:
            from .tasks import process_clip
            process_clip.delay(str(clip.id))
        except Exception:
            # Run in daemon background thread so HTTP request returns in <50ms without blocking user UI
            try:
                import threading
                from .tasks import process_clip
                threading.Thread(target=lambda: process_clip(str(clip.id)), daemon=True).start()
            except Exception:
                pass

        # Invalidate analytics cache for user so next load re-aggregates with fresh data
        try:
            from apps.analytics.olap_engine import DuckDBAnalyticsEngine
            DuckDBAnalyticsEngine.invalidate_cache(user.id)
        except Exception:
            pass

        return Response(ClipSerializer(clip).data, status=status.HTTP_201_CREATED)


class ClipDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, clip_id):
        clip = Clip.objects.select_related('destination').filter(pk=clip_id).first()
        if not clip:
            return Response({'error': 'Clip not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ClipSerializer(clip).data)

    def patch(self, request, clip_id):
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        clip = Clip.objects.filter(pk=clip_id, user=request.user).first()
        if not clip:
            return Response({'error': 'Clip not found.'}, status=status.HTTP_404_NOT_FOUND)

        update_fields = []
        if 'title' in request.data:
            clip.title = str(request.data['title'])[:512]
            update_fields.append('title')

        if 'tags' in request.data:
            raw_tags = request.data['tags']
            if isinstance(raw_tags, str):
                clip.tags = [t.strip().lower() for t in raw_tags.split(',') if t.strip()]
            elif isinstance(raw_tags, list):
                clip.tags = [str(t).strip().lower() for t in raw_tags if str(t).strip()]
            update_fields.append('tags')

        if 'intent' in request.data or 'note' in request.data:
            extra = clip.extra_metadata or {}
            if 'intent' in request.data:
                extra['intent'] = request.data['intent']
            if 'note' in request.data:
                extra['user_note'] = request.data['note']
            clip.extra_metadata = extra
            update_fields.append('extra_metadata')

        if update_fields:
            clip.save(update_fields=update_fields)

        return Response(ClipSerializer(clip).data, status=status.HTTP_200_OK)

    def delete(self, request, clip_id):
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        clip = Clip.objects.filter(pk=clip_id, user=request.user).first()
        if not clip:
            return Response({'error': 'Clip not found.'}, status=status.HTTP_404_NOT_FOUND)
        clip.delete()
        return Response({'message': 'Clip deleted successfully.'}, status=status.HTTP_200_OK)


class ClipContentView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, clip_id):
        clip = Clip.objects.filter(pk=clip_id).first()
        if not clip:
            return Response({'error': 'Clip not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Scoped access check if authenticated
        if request.user and request.user.is_authenticated and clip.user_id != request.user.id:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        full_content = clip.raw_content or clip.selected_text or clip.summary or ''
        return Response({
            'id': str(clip.id),
            'title': clip.title or clip.url,
            'url': clip.url,
            'content_type': clip.content_type or 'article',
            'summary': clip.summary or '',
            'content': full_content,
            'word_count': len(full_content.split()),
            'source_platform': clip.source_platform,
            'author': clip.source_author,
            'tags': clip.tags,
            'created_at': clip.created_at.isoformat(),
        })



class DashboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required. Please sign in to view dashboard.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        user = request.user
        # user = request.user if (request.user and request.user.is_authenticated) else get_or_create_demo_user()

        qs = Clip.objects.filter(user=user)

        now = timezone.now()
        one_week_ago = now - timedelta(days=7)

        # Single conditional-aggregation query: one pass over the user's rows
        # instead of six separate COUNT queries.
        stats = qs.aggregate(
            total_clips=Count('id'),
            saved_this_week=Count('id', filter=Q(created_at__gte=one_week_ago)),
            jobs_saved=Count('id', filter=Q(content_type='job')),
            music_saved=Count('id', filter=Q(content_type='music')),
            articles_saved=Count('id', filter=Q(content_type__in=['article', 'blog'])),
        )

        total_clips = stats['total_clips']
        saved_this_week = stats['saved_this_week']
        jobs_saved = stats['jobs_saved']
        if jobs_saved == 0:
            # Single query with OR instead of two sequential full-table LIKE scans.
            # Counts each matching row once (union) rather than title-matches only.
            jobs_saved = qs.filter(Q(title__icontains='job') | Q(url__icontains='job')).count()
        music_saved = stats['music_saved']
        articles_saved = stats['articles_saved']

        # Single destination fetch; row count stays identical (len of rows),
        # provider flags computed in Python instead of 1 COUNT + 4 EXISTS queries.
        dest_provider_list = list(
            Destination.objects.filter(user=user, is_active=True).values_list('provider', flat=True)
        )
        active_destinations = len(dest_provider_list)
        dest_providers = set(dest_provider_list)

        # One annotated base queryset per list below, so the serializer's
        # child-clip count comes from the same query (no N+1 COUNT per clip).
        base_clips_qs = qs.select_related('destination').annotate(
            prefetched_child_count=Count('child_clips')
        )
        recent_clips = ClipSerializer(base_clips_qs.order_by('-created_at')[:50], many=True).data

        # Categorized breakdown
        today = timezone.now().date()
        upcoming_deadlines = ClipSerializer(
            base_clips_qs.filter(deadline_date__gte=today).order_by('deadline_date')[:5],
            many=True,
        ).data

        jobs_clips = ClipSerializer(base_clips_qs.filter(content_type__in=['job', 'scholarship']).order_by('-created_at')[:4], many=True).data
        music_clips = ClipSerializer(base_clips_qs.filter(content_type='music').order_by('-created_at')[:4], many=True).data
        article_clips = ClipSerializer(base_clips_qs.filter(content_type__in=['article', 'blog']).order_by('-created_at')[:4], many=True).data

        destinations_status = [
            {
                'provider': 'google_sheets',
                'name': 'Google Sheets',
                'connected': 'google_sheets' in dest_providers,
                'status': 'active' if 'google_sheets' in dest_providers else 'not_configured',
            },
            {
                'provider': 'notion',
                'name': 'Notion Workspace',
                'connected': 'notion' in dest_providers,
                'status': 'active' if 'notion' in dest_providers else 'not_configured',
            },
            {
                'provider': 'airtable',
                'name': 'Airtable Base',
                'connected': False,
                'status': 'not_configured',
            },
        ]

        highlight_title = "Weekly AI Digest & Opportunity Highlights"
        highlight_summary = (
            f"You saved {saved_this_week} items this week. Gemini AI detected high-priority opportunities "
            f"including remote engineering roles and research articles."
        )
        if recent_clips and recent_clips[0].get('summary'):
            highlight_summary = f"Latest Opportunity ({recent_clips[0].get('title') or 'Clip'}): {recent_clips[0].get('summary')}"

        return Response({
            'user': {
                'name': (getattr(user, 'name', '') or user.email) if user else '',
                'email': user.email if user else '',
            },
            'stats': {
                'total_clips': total_clips,
                'saved_this_week': saved_this_week,
                'jobs_saved': jobs_saved,
                'music_saved': music_saved,
                'articles_saved': articles_saved,
                'active_destinations': active_destinations,
                'upcoming_deadlines_count': len(upcoming_deadlines),
            },
            'upcoming_deadlines': upcoming_deadlines,
            'categorized_clips': {
                'jobs': jobs_clips,
                'music': music_clips,
                'articles': article_clips,
            },
            'ai_digest_highlight': {
                'title': highlight_title,
                'summary': highlight_summary,
                'action_needed_count': len(upcoming_deadlines) or min(3, total_clips or 3),
            },
            'recent_clips': recent_clips,
            'destinations_status': destinations_status,
        })


class SimilaritySearchView(APIView):
    """
    High-performance Semantic Similarity Search.
    Uses SIMD-accelerated DuckDB / NumPy vector cosine similarity.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required. Please sign in.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        user = request.user

        text = request.data.get('text', '').strip()
        threshold = float(request.data.get('threshold', 0.65))
        limit = int(request.data.get('limit', 5))

        if not text:
            return Response({'relevant': False, 'reason': 'empty_text'})

        from .services.embed import generate_embedding
        from .services.similarity import VectorSimilarityEngine

        query_vec = generate_embedding(text)
        if not query_vec:
            return Response({'relevant': False, 'reason': 'embedding_failed'})

        # High-performance SIMD vector search
        matches = VectorSimilarityEngine.search_similar_clips(
            user=user,
            query_vector=query_vec,
            threshold=threshold,
            limit=limit,
        )

        if matches:
            best_match = matches[0]
            return Response({
                'relevant': True,
                'similarity_score': best_match['similarity_score'],
                'matched_clip': {
                    'id': best_match['id'],
                    'title': best_match['title'],
                    'summary': best_match['summary'],
                    'content_type': best_match['content_type'],
                    'url': best_match['url'],
                },
                'top_matches': matches,
            })

        return Response({
            'relevant': False,
            'similarity_score': 0.0,
            'reason': 'below_threshold',
        })



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def github_selection_save(request):
    """
    Saves an individual resource highlighted by the user on a GitHub repository/list page.
    Directly extracts resource metadata, saves Clip record, and exports to Google Sheets Tools tab synchronously.
    """
    selected_text = str(request.data.get('selected_text', '')).strip()
    page_url = str(request.data.get('page_url', '')).strip()
    section = str(request.data.get('section', '')).strip()

    # 1. Validate inputs
    if not selected_text or not page_url:
        return Response(
            {'error': 'missing_fields', 'message': 'Both selected_text and page_url are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 2. Validate GitHub URL
    from urllib.parse import urlparse
    parsed_page = urlparse(page_url)
    if 'github.com' not in parsed_page.netloc:
        return Response(
            {'error': 'invalid_url', 'message': 'This endpoint only works on GitHub pages'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 3. Extract resource from selection
    from .github_parser import extract_resource_from_selection
    resource = extract_resource_from_selection(
        selected_text=selected_text,
        page_url=page_url,
        section=section,
    )

    # 4. Handle no resource found
    if not resource:
        return Response(
            {
                'error': 'no_resource_found',
                'message': 'Could not find a resource link in your selection. Try selecting the full line including the URL.',
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 5. Create Clip record
    user = request.user
    norm_url = normalise_url(resource['url'])
    u_hash = hash_url(f"{norm_url}||selection_{user.id}")

    # Deduplication check
    existing = Clip.objects.filter(user=user, url=resource['url']).first()
    if not existing:
        existing = Clip.objects.filter(user=user, url_hash=u_hash).first()

    if existing:
        return Response(
            {
                **ClipSerializer(existing).data,
                'duplicate': True,
                'saved_as': 'single_selection',
            },
            status=status.HTTP_200_OK,
        )

    from apps.destinations.services import get_user_destination
    destination = get_user_destination(user)

    clip = Clip.objects.create(
        user=user,
        url=resource['url'],
        url_hash=u_hash,
        title=resource['name'][:512],
        summary=resource['description'],
        selected_text=selected_text,
        content_type=resource['content_type'],
        source_platform=Clip.PLATFORM_GITHUB,
        source_author=resource['source_repo'],
        source_post_url=resource['source_url'],
        destination=destination,
        status=Clip.STATUS_DONE,
        tags=[
            resource['content_type'],
            resource['pricing'],
            'github_selection',
        ],
        extra_metadata={
            'section': resource['section'],
            'pricing': resource['pricing'],
            'source_url': resource['source_url'],
            'source_repo': resource['source_repo'],
            'saved_as': 'single_selection',
        },
    )

    # Synchronous Google Sheets export to Tools tab
    if destination and destination.provider == 'google_sheets':
        try:
            from apps.destinations.services import batch_export_resources_to_destination
            export_res = batch_export_resources_to_destination(
                destination=destination,
                resources=[resource],
                source_url=resource['source_url'],
                source_repo=resource['source_repo'],
                saved_at_str=clip.created_at.strftime('%Y-%m-%d %H:%M:%S') if clip.created_at else '',
            )
            if export_res.success:
                clip.export_status = 'done'
                clip.export_url = export_res.external_url
            else:
                clip.export_status = 'failed'
                clip.export_error = export_res.error
            clip.save(update_fields=['export_status', 'export_url', 'export_error'])
        except Exception as sheet_exc:
            logger.warning('Synchronous sheets sync for selection clip failed: %s', sheet_exc)

    return Response(
        {
            **ClipSerializer(clip).data,
            'saved_as': 'single_selection',
        },
        status=status.HTTP_201_CREATED,
    )


class AudioRecognizeView(APIView):
    """
    POST /api/clips/recognize-audio/
    Receives an audio sample (base64) recorded from tab audio or microphone,
    queries AudD / recognition engine, and returns identified track metadata + Spotify URIs.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from .services.audio_recognizer import AudioRecognizer

        audio_data = request.data.get('audio', '')
        audio_format = request.data.get('format', 'webm')
        title_hint = request.data.get('title_hint', '')

        if not audio_data:
            return Response(
                {'success': False, 'error': 'Audio data is required (base64 string).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        match_result = AudioRecognizer.recognize_audio(
            audio_base64=audio_data,
            audio_format=audio_format,
            sample_title_hint=title_hint
        )

        if not match_result.get('success'):
            return Response(
                {'success': False, 'error': match_result.get('error', 'Song could not be identified')},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(match_result, status=status.HTTP_200_OK)


