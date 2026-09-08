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

from .models import Clip, CustomPage
from .serializers import ClipCreateSerializer, ClipSerializer, CustomPageSerializer
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
        clips_qs = Clip.objects.filter(user=request.user)

        # Action Intent query filter (supports canonical categories or specific action verbs)
        intent_param = request.query_params.get('intent', '').strip().lower()
        if intent_param and intent_param != 'all':
            from apps.clips.services.intent_detector import CANONICAL_MAPPING
            matching_intents = [k for k, v in CANONICAL_MAPPING.items() if v == intent_param]
            if intent_param not in matching_intents:
                matching_intents.append(intent_param)
            clips_qs = clips_qs.filter(intent__in=matching_intents)

        # Filter by Custom Page if provided
        page_param = (request.query_params.get('page_id') or request.query_params.get('page') or '').strip()
        if page_param and page_param != 'all':
            try:
                import uuid as uuid_pkg
                page_uuid = uuid_pkg.UUID(page_param)
                clips_qs = clips_qs.filter(custom_page_id=page_uuid)
            except (ValueError, TypeError):
                clips_qs = clips_qs.filter(custom_page__slug=page_param)

        clips = (
            clips_qs
            .select_related('destination', 'custom_page')
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

        # Fast 0ms intent detection for immediate badge display before Celery task completes
        from apps.clips.services.intent_detector import IntentDetector, clean_action_intent
        initial_intent = request.data.get('intent')
        if not initial_intent:
            initial_intent = IntentDetector.detect_heuristic_intent(
                url=url_val,
                text=sel_text,
                content_type=request.data.get('content_type', ''),
            )
        initial_intent = clean_action_intent(initial_intent or 'other')

        # Resolve custom page if provided
        custom_page = None
        page_id_val = request.data.get('custom_page_id') or request.data.get('page_id')
        if page_id_val:
            try:
                import uuid as uuid_pkg
                page_uuid = uuid_pkg.UUID(str(page_id_val))
                custom_page = CustomPage.objects.filter(user=user, pk=page_uuid).first()
            except (ValueError, TypeError):
                custom_page = CustomPage.objects.filter(user=user, slug=str(page_id_val)).first()

        clip = Clip.objects.create(
            user=user,
            url=url_val,
            url_hash=u_hash,
            selected_text=request.data.get('selected_text', ''),
            status=Clip.STATUS_PENDING,
            intent=initial_intent,
            destination=destination,
            custom_page=custom_page,
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

        # Invalidate analytics and clusters cache for user so next load re-aggregates with fresh data
        try:
            from apps.analytics.olap_engine import DuckDBAnalyticsEngine
            DuckDBAnalyticsEngine.invalidate_cache(user.id)
        except Exception:
            pass

        try:
            invalidate_user_clusters_cache(user.id)
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

        if 'intent' in request.data:
            from apps.clips.services.intent_detector import clean_action_intent
            clean_int = clean_action_intent(request.data['intent'])
            clip.intent = clean_int
            update_fields.append('intent')
            extra = clip.extra_metadata or {}
            extra['intent'] = clean_int
            clip.extra_metadata = extra
            if 'extra_metadata' not in update_fields:
                update_fields.append('extra_metadata')

        if 'note' in request.data:
            extra = clip.extra_metadata or {}
            extra['user_note'] = request.data['note']
            clip.extra_metadata = extra
            if 'extra_metadata' not in update_fields:
                update_fields.append('extra_metadata')

        if 'custom_page_id' in request.data:
            cpage_id = request.data['custom_page_id']
            if not cpage_id:
                clip.custom_page = None
            else:
                try:
                    import uuid as uuid_pkg
                    cpage_uuid = uuid_pkg.UUID(str(cpage_id))
                    clip.custom_page = CustomPage.objects.filter(user=request.user, pk=cpage_uuid).first()
                except Exception:
                    pass
            update_fields.append('custom_page')

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
        try:
            invalidate_user_clusters_cache(request.user.id)
        except Exception:
            pass
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

        # Live dynamic aggregation of Action Intents for donut chart & filter counts
        from apps.clips.services.intent_detector import CANONICAL_INTENTS, normalize_canonical_intent
        raw_intent_counts = qs.values('intent').annotate(count=Count('id'))
        intent_map = {ci: 0 for ci in CANONICAL_INTENTS}
        for item in raw_intent_counts:
            c_intent = normalize_canonical_intent(item.get('intent') or 'other')
            intent_map[c_intent] = intent_map.get(c_intent, 0) + item['count']

        INTENT_COLORS = {
            'learn': '#2D6A4F',
            'track': '#40916C',
            'apply': '#D97706',
            'buy': '#0284C7',
            'attend': '#7C3AED',
            'hire': '#EC4899',
            'other': '#64748B',
        }
        intent_slices = [
            {
                'name': ci.capitalize(),
                'intent': ci,
                'count': intent_map.get(ci, 0),
                'pct': round((intent_map.get(ci, 0) / max(total_clips, 1)) * 100),
                'color': INTENT_COLORS.get(ci, '#64748B'),
            }
            for ci in CANONICAL_INTENTS
        ]

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
            'intent_distribution': intent_slices,
            'intent_counts': intent_map,
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

    def _perform_similarity_search(self, user, text, threshold, limit):
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
                'results': matches,
            })

        return Response({
            'relevant': False,
            'similarity_score': 0.0,
            'reason': 'below_threshold',
            'results': [],
        })

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required. Please sign in.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        text = (request.query_params.get('q') or request.query_params.get('text') or '').strip()
        threshold = float(request.query_params.get('threshold', 0.65))
        limit = int(request.query_params.get('limit', 5))
        return self._perform_similarity_search(request.user, text, threshold, limit)

    def post(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required. Please sign in.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        text = str(request.data.get('text', '')).strip()
        threshold = float(request.data.get('threshold', 0.65))
        limit = int(request.data.get('limit', 5))
        return self._perform_similarity_search(request.user, text, threshold, limit)



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


def invalidate_user_clusters_cache(user_id):
    """
    Clears cached semantic clusters for the user across common parameter variations.
    """
    from django.core.cache import cache
    for t in (0.72, 0.70, 0.65, 0.75, 0.80):
        for s in (2, 3, 4):
            cache.delete(f"clip_clusters_{user_id}_{t}_{s}")


class ClipClustersView(APIView):
    """
    GET /api/clips/clusters/
    Discovers and returns semantic clusters for the user's saved clips using
    vector cosine similarity or token Jaccard overlap, with cluster auto-naming.
    Cached for 5 minutes (300s TTL) for 0ms subsequent loads.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required. Please sign in to view clusters.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            threshold = float(request.query_params.get('threshold', 0.72))
            threshold = max(0.3, min(0.99, threshold))
        except (ValueError, TypeError):
            threshold = 0.72

        try:
            min_size = int(request.query_params.get('min_size', 2))
            min_size = max(2, min(20, min_size))
        except (ValueError, TypeError):
            min_size = 2

        refresh = request.query_params.get('refresh', '').lower() in ('true', '1', 'yes')

        from django.core.cache import cache
        from .services.clustering import ClipClusterEngine

        cache_key = f"clip_clusters_{request.user.id}_{threshold}_{min_size}"

        if not refresh:
            try:
                cached_clusters = cache.get(cache_key)
                if cached_clusters is not None:
                    return Response({
                        'clusters': cached_clusters,
                        'total_clusters': len(cached_clusters),
                        'total_clustered_clips': sum(c.get('count', 0) for c in cached_clusters),
                        'cached': True,
                    })
            except Exception:
                pass

        clusters = ClipClusterEngine.discover_clusters_for_user(
            user=request.user,
            similarity_threshold=threshold,
            min_cluster_size=min_size,
        )

        try:
            cache.set(cache_key, clusters, timeout=300)
        except Exception:
            pass

        return Response({
            'clusters': clusters,
            'total_clusters': len(clusters),
            'total_clustered_clips': sum(c.get('count', 0) for c in clusters),
            'cached': False,
        })


class CustomPageListCreateView(APIView):
    """
    GET /api/clips/pages/
    Lists all custom workspaces/pages for the user with live clip counts.

    POST /api/clips/pages/
    Creates a new custom workspace/page with custom theme, AI Goal prompt, and content types.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required. Please sign in to view custom pages.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        pages_qs = (
            CustomPage.objects.filter(user=request.user)
            .annotate(annotated_clip_count=Count('clips'))
            .order_by('created_at')
        )
        return Response(CustomPageSerializer(pages_qs, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required. Please sign in.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        name = str(request.data.get('name', '')).strip()
        if not name:
            return Response(
                {'error': 'Name is required for custom page.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        import re
        base_slug = request.data.get('slug') or re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        if not base_slug:
            base_slug = 'page'

        slug = base_slug
        counter = 1
        while CustomPage.objects.filter(user=request.user, slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        content_types = request.data.get('content_types') or ['general', 'article', 'research']
        if isinstance(content_types, str):
            content_types = [c.strip() for c in content_types.split(',') if c.strip()]

        page = CustomPage.objects.create(
            user=request.user,
            name=name,
            slug=slug,
            icon_name=request.data.get('icon_name') or request.data.get('icon') or 'Bookmark',
            color=request.data.get('color') or '#8B5CF6',
            bg_color=request.data.get('bg_color') or 'rgba(139, 92, 246, 0.15)',
            description=request.data.get('description', '').strip(),
            content_types=content_types,
            ai_goal_prompt=request.data.get('ai_goal_prompt', '').strip(),
            is_system_default=bool(request.data.get('is_system_default', False)),
        )
        return Response(CustomPageSerializer(page).data, status=status.HTTP_201_CREATED)


class CustomPageDetailView(APIView):
    """
    GET /api/clips/pages/<uuid:pk>/
    PATCH /api/clips/pages/<uuid:pk>/
    DELETE /api/clips/pages/<uuid:pk>/
    """
    permission_classes = [AllowAny]

    def _get_page(self, request, pk):
        if not request.user or not request.user.is_authenticated:
            return None
        return CustomPage.objects.filter(pk=pk, user=request.user).first()

    def get(self, request, pk):
        page = self._get_page(request, pk)
        if not page:
            return Response({'error': 'Custom page not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(CustomPageSerializer(page).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        page = self._get_page(request, pk)
        if not page:
            return Response({'error': 'Custom page not found.'}, status=status.HTTP_404_NOT_FOUND)

        update_fields = []
        if 'name' in request.data:
            page.name = str(request.data['name']).strip()
            update_fields.append('name')
        if 'icon_name' in request.data:
            page.icon_name = str(request.data['icon_name']).strip()
            update_fields.append('icon_name')
        if 'color' in request.data:
            page.color = str(request.data['color']).strip()
            update_fields.append('color')
        if 'bg_color' in request.data:
            page.bg_color = str(request.data['bg_color']).strip()
            update_fields.append('bg_color')
        if 'description' in request.data:
            page.description = str(request.data['description']).strip()
            update_fields.append('description')
        if 'content_types' in request.data:
            ctypes = request.data['content_types']
            if isinstance(ctypes, str):
                ctypes = [c.strip() for c in ctypes.split(',') if c.strip()]
            page.content_types = ctypes
            update_fields.append('content_types')
        if 'ai_goal_prompt' in request.data:
            page.ai_goal_prompt = str(request.data['ai_goal_prompt']).strip()
            update_fields.append('ai_goal_prompt')

        if update_fields:
            page.save(update_fields=update_fields)

        return Response(CustomPageSerializer(page).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        page = self._get_page(request, pk)
        if not page:
            return Response({'error': 'Custom page not found.'}, status=status.HTTP_404_NOT_FOUND)
        page.delete()
        return Response({'message': 'Custom page deleted successfully.'}, status=status.HTTP_200_OK)




