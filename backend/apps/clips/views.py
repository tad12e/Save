from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

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

        clip = Clip.objects.create(
            user=user,
            url=url_val,
            url_hash=u_hash,
            selected_text=request.data.get('selected_text', ''),
            status=Clip.STATUS_PENDING,
            destination=destination,
        )
        clip.duplicate = False

        try:
            from .tasks import process_clip
            process_clip.delay(str(clip.id))
        except Exception:
            # Fallback if Celery/Redis is down: run synchronously in-process
            try:
                from .tasks import process_clip
                process_clip(str(clip.id))
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
        dest_qs = Destination.objects.filter(user=user, is_active=True)

        now = timezone.now()
        one_week_ago = now - timedelta(days=7)

        total_clips = qs.count()
        saved_this_week = qs.filter(created_at__gte=one_week_ago).count()

        jobs_saved = qs.filter(content_type='job').count()
        if jobs_saved == 0:
            jobs_saved = qs.filter(title__icontains='job').count() or qs.filter(url__icontains='job').count()

        active_destinations = dest_qs.count()

        recent_clips = ClipSerializer(qs.select_related('destination').order_by('-created_at')[:5], many=True).data

        # Categorized breakdown
        today = timezone.now().date()
        upcoming_deadlines = ClipSerializer(
            qs.filter(deadline_date__gte=today).order_by('deadline_date')[:5],
            many=True,
        ).data

        music_saved = qs.filter(content_type='music').count()
        articles_saved = qs.filter(content_type__in=['article', 'blog']).count()

        jobs_clips = ClipSerializer(qs.filter(content_type__in=['job', 'scholarship']).order_by('-created_at')[:4], many=True).data
        music_clips = ClipSerializer(qs.filter(content_type='music').order_by('-created_at')[:4], many=True).data
        article_clips = ClipSerializer(qs.filter(content_type__in=['article', 'blog']).order_by('-created_at')[:4], many=True).data

        destinations_status = [
            {
                'provider': 'google_sheets',
                'name': 'Google Sheets',
                'connected': dest_qs.filter(provider='google_sheets').exists(),
                'status': 'active' if dest_qs.filter(provider='google_sheets').exists() else 'not_configured',
            },
            {
                'provider': 'notion',
                'name': 'Notion Workspace',
                'connected': dest_qs.filter(provider='notion').exists(),
                'status': 'active' if dest_qs.filter(provider='notion').exists() else 'not_configured',
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


import math


def cosine_similarity(vec1, vec2):
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = math.sqrt(sum(a * a for a in vec1))
    magnitude2 = math.sqrt(sum(b * b for b in vec2))
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)


class SimilaritySearchView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required. Please sign in.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        user = request.user
        # user = request.user if (request.user and request.user.is_authenticated) else get_or_create_demo_user()

        text = request.data.get('text', '').strip()
        threshold = float(request.data.get('threshold', 0.65))

        if not text:
            return Response({'relevant': False, 'reason': 'empty_text'})

        from .services.embed import generate_embedding
        query_vec = generate_embedding(text)

        if not query_vec:
            return Response({'relevant': False, 'reason': 'embedding_failed'})

        clips_with_embeddings = Clip.objects.filter(user=user).exclude(embedding__isnull=True).exclude(embedding=[])

        best_score = 0.0
        best_clip = None

        for clip in clips_with_embeddings:
            score = cosine_similarity(query_vec, clip.embedding)
            if score > best_score:
                best_score = score
                best_clip = clip

        if best_clip and best_score >= threshold:
            return Response({
                'relevant': True,
                'similarity_score': round(best_score, 4),
                'matched_clip': {
                    'id': str(best_clip.id),
                    'title': best_clip.title,
                    'summary': best_clip.summary,
                    'content_type': best_clip.content_type,
                }
            })

        return Response({
            'relevant': False,
            'similarity_score': round(best_score, 4),
            'reason': 'below_threshold',
        })

