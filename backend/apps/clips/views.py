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

from .models import Clip, CustomCategory, CustomPage
from .serializers import (
    ClipCreateSerializer,
    ClipDetailSerializer,
    ClipSerializer,
    CustomCategorySerializer,
    CustomPageSerializer,
)
from .services.url import hash_url, normalise_url

User = get_user_model()


# def get_or_create_demo_user():
#     user, _ = User.objects.get_or_create(
#         email='tadiwos@save.app',
#         defaults={'name': 'Tadiwos User', 'is_active': True},
#     )
#     return user


def get_user_clips_feed_version(user_id) -> int:
    """
    Returns the cache invalidation version number for the user's clips feed.
    """
    from django.core.cache import cache
    version_key = f"user_clips_feed_ver_{user_id}"
    try:
        ver = cache.get(version_key)
        if ver is None:
            ver = int(timezone.now().timestamp())
            cache.set(version_key, ver, timeout=86400 * 14)
        return ver
    except Exception:
        return 1


def invalidate_user_clips_feed_cache(user_id):
    """
    Bumps the cache version for the user's clips feed, atomically invalidating
    all cached query variations (all filters, intents, sources, and pages) in O(1) time.
    """
    from django.core.cache import cache
    version_key = f"user_clips_feed_ver_{user_id}"
    try:
        cache.set(version_key, int(timezone.now().timestamp()), timeout=86400 * 14)
    except Exception as exc:
        logger.warning("Clips feed cache version bump failed for user %s: %s", user_id, exc)


class ClipCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required. Please sign in to view clips.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        clips_qs = Clip.objects.filter(user=request.user)

        # Action Intent query filter (supports canonical categories, custom user intents, or specific action verbs)
        intent_param = request.query_params.get('intent', '').strip().lower()
        if intent_param and intent_param != 'all':
            from apps.clips.services.intent_detector import CANONICAL_MAPPING
            matching_intents = [k for k, v in CANONICAL_MAPPING.items() if v == intent_param]
            if intent_param not in matching_intents:
                matching_intents.append(intent_param)
            clips_qs = clips_qs.filter(intent__in=matching_intents)

        # Source Platform query filter
        source_param = (request.query_params.get('source') or request.query_params.get('platform') or '').strip().lower()
        if source_param and source_param != 'all':
            SOURCE_DOMAIN_MAP = {
                'youtube': ['youtube.com', 'youtu.be'],
                'github': ['github.com', 'gist.github.com'],
                'x_twitter': ['twitter.com', 'x.com'],
                'twitter': ['twitter.com', 'x.com'],
                'x': ['twitter.com', 'x.com'],
                'linkedin': ['linkedin.com'],
                'reddit': ['reddit.com'],
                'arxiv': ['arxiv.org'],
                'substack': ['substack.com'],
                'medium': ['medium.com'],
            }
            domains = SOURCE_DOMAIN_MAP.get(source_param)
            if domains:
                src_q = Q(source_platform__iexact=source_param)
                for d in domains:
                    src_q |= Q(url__icontains=d)
                clips_qs = clips_qs.filter(src_q)
            else:
                clips_qs = clips_qs.filter(
                    Q(source_platform__iexact=source_param) | Q(url__icontains=source_param)
                )

        # Content Type query filter
        type_param = (request.query_params.get('type') or request.query_params.get('content_type') or '').strip().lower()
        if type_param and type_param != 'all':
            clips_qs = clips_qs.filter(content_type__iexact=type_param)

        # Filter by Custom Page if provided
        page_param = (request.query_params.get('page_id') or request.query_params.get('page') or '').strip()
        if page_param and page_param != 'all':
            try:
                import uuid as uuid_pkg
                page_uuid = uuid_pkg.UUID(page_param)
                clips_qs = clips_qs.filter(custom_page_id=page_uuid)
            except (ValueError, TypeError):
                clips_qs = clips_qs.filter(custom_page__slug=page_param)

        # 1. Fast Redis Cache lookup (<2ms)
        from django.core.cache import cache
        feed_ver = get_user_clips_feed_version(request.user.id)
        cache_key = (
            f"clips_feed_{request.user.id}_v{feed_ver}_"
            f"{intent_param}_{source_param}_{type_param}_{page_param}"
        )
        try:
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data)
        except Exception as exc:
            logger.warning("Clips feed cache read error for user %s: %s", request.user.id, exc)

        # 2. Database query on cache miss (Deferred heavy blobs, pre-indexed, zero write locks)
        clips = list(
            clips_qs
            .defer('raw_content')
            .select_related('destination', 'custom_page', 'parent_clip')
            .annotate(prefetched_child_count=Count('child_clips'))
            .order_by('-created_at')[:100]
        )

        serialized_data = ClipSerializer(clips, many=True).data

        # 3. Store in Redis cache (5 minutes TTL)
        try:
            cache.set(cache_key, serialized_data, timeout=300)
        except Exception as exc:
            logger.warning("Clips feed cache write error for user %s: %s", request.user.id, exc)

        return Response(serialized_data)

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

        # Fast 0ms intent and content_type detection for immediate badge display before Celery task completes
        from apps.clips.services.intent_detector import IntentDetector, clean_action_intent
        from apps.clips.services.extract import _detect_content_type

        initial_content_type = request.data.get('content_type') or _detect_content_type(sel_text, url_val)
        initial_intent = request.data.get('intent')
        if not initial_intent:
            initial_intent = IntentDetector.detect_heuristic_intent(
                url=url_val,
                text=sel_text,
                content_type=initial_content_type,
            )
        initial_intent = clean_action_intent(initial_intent or 'other')

        # Resolve custom page if provided, or auto-route based on topic (e.g. Books)
        custom_page = None
        page_id_val = request.data.get('custom_page_id') or request.data.get('page_id')
        if page_id_val:
            try:
                import uuid as uuid_pkg
                page_uuid = uuid_pkg.UUID(str(page_id_val))
                custom_page = CustomPage.objects.filter(user=user, pk=page_uuid).first()
            except (ValueError, TypeError):
                custom_page = CustomPage.objects.filter(user=user, slug=str(page_id_val)).first()

        if not custom_page:
            try:
                from apps.clips.services.page_router import find_matching_custom_page
                custom_page = find_matching_custom_page(
                    user=user,
                    content_type=initial_content_type,
                    url=url_val,
                    text=sel_text,
                    intent=initial_intent,
                    tags=user_tags,
                )
            except Exception as auto_route_err:
                logger.warning("Auto-routing to custom page failed: %s", auto_route_err)

        clip = Clip.objects.create(
            user=user,
            url=url_val,
            url_hash=u_hash,
            selected_text=request.data.get('selected_text', ''),
            content_type=initial_content_type,
            status=Clip.STATUS_PENDING,
            intent=initial_intent,
            destination=destination,
            custom_page=custom_page,
            tags=user_tags,
            extra_metadata=extra_meta,
        )

        warnings: list[str] = []

        if custom_deadline:
            try:
                from datetime import datetime
                clip.deadline_date = datetime.strptime(str(custom_deadline)[:10], '%Y-%m-%d').date()
                clip.save(update_fields=['deadline_date'])
            except Exception as exc:
                logger.warning("Ignoring invalid deadline %r for clip %s: %s", custom_deadline, clip.id, exc)
                warnings.append('Invalid deadline ignored. Expected format YYYY-MM-DD.')

        clip.duplicate = False

        try:
            from .tasks import process_clip
            process_clip.delay(str(clip.id))
        except Exception as exc:
            logger.warning("Celery enqueue failed for clip %s: %s. Trying background thread.", clip.id, exc)
            # Run in daemon background thread so HTTP request returns in <50ms without blocking user UI
            try:
                import threading
                from .tasks import process_clip
                threading.Thread(target=lambda: process_clip(str(clip.id)), daemon=True).start()
            except Exception as thread_exc:
                logger.error("Background processing unavailable for clip %s: %s", clip.id, thread_exc)
                warnings.append('Clip saved but background processing unavailable. Summary/embeddings will be delayed.')

        # Invalidate analytics and clusters cache for user so next load re-aggregates with fresh data
        try:
            from apps.analytics.olap_engine import DuckDBAnalyticsEngine
            DuckDBAnalyticsEngine.invalidate_cache(user.id)
        except Exception as exc:
            logger.warning("Analytics cache invalidation failed for user %s: %s", user.id, exc)
            warnings.append('Clip saved but analytics cache refresh failed. Stats may be briefly stale.')

        try:
            invalidate_user_clips_feed_cache(user.id)
            invalidate_user_clusters_cache(user.id)
        except Exception as exc:
            logger.warning("Cluster/feed cache invalidation failed for user %s: %s", user.id, exc)

        data = ClipSerializer(clip).data
        if warnings:
            data['warnings'] = warnings
        return Response(data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required. Please sign in to delete clips.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        raw_ids = request.data.get('ids') or request.query_params.get('ids')
        ids = []
        if isinstance(raw_ids, list):
            ids = [str(i) for i in raw_ids if str(i).strip()]
        elif isinstance(raw_ids, str):
            ids = [i.strip() for i in raw_ids.split(',') if i.strip()]

        if not ids:
            return Response({'error': 'No clip IDs provided.'}, status=status.HTTP_400_BAD_REQUEST)

        import uuid as uuid_pkg
        valid_uuids = []
        for i in ids:
            try:
                valid_uuids.append(uuid_pkg.UUID(str(i).strip()))
            except (ValueError, TypeError, AttributeError) as exc:
                logger.warning("Bulk delete: skipping invalid UUID identifier %r: %s", i, exc)
                continue

        if not valid_uuids:
            return Response({'deleted': 0, 'message': 'No matching database clips found to delete.'}, status=status.HTTP_200_OK)

        deleted_count, _ = Clip.objects.filter(user=request.user, id__in=valid_uuids).delete()
        try:
            invalidate_user_clips_feed_cache(request.user.id)
            invalidate_user_clusters_cache(request.user.id)
        except Exception as exc:
            logger.warning("Cache invalidation failed after bulk deletion for user %s: %s", request.user.id, exc)
        return Response({'deleted': deleted_count, 'message': f'{deleted_count} clips deleted.'}, status=status.HTTP_200_OK)


class ClipDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, clip_id):
        import uuid as uuid_pkg
        try:
            c_uuid = uuid_pkg.UUID(str(clip_id).strip())
        except (ValueError, TypeError, AttributeError):
            return Response({'error': 'Clip not found.'}, status=status.HTTP_404_NOT_FOUND)

        clip = Clip.objects.select_related('destination', 'custom_page', 'parent_clip').filter(pk=c_uuid, user=request.user).first()
        if not clip:
            return Response({'error': 'Clip not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ClipDetailSerializer(clip).data)

    def patch(self, request, clip_id):
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        import uuid as uuid_pkg
        try:
            c_uuid = uuid_pkg.UUID(str(clip_id).strip())
        except (ValueError, TypeError, AttributeError):
            return Response({'error': 'Clip not found.'}, status=status.HTTP_404_NOT_FOUND)

        clip = Clip.objects.filter(pk=c_uuid, user=request.user).first()
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
                except (ValueError, TypeError, AttributeError) as exc:
                    logger.warning("Ignoring invalid custom_page_id %r for clip %s: %s", cpage_id, clip.id, exc)
                    return Response(
                        {'error': 'Invalid custom_page_id. Expected a valid UUID.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                cpage = CustomPage.objects.filter(user=request.user, pk=cpage_uuid).first()
                if not cpage:
                    return Response(
                        {'error': 'Custom page not found.'},
                        status=status.HTTP_404_NOT_FOUND,
                    )
                clip.custom_page = cpage
            update_fields.append('custom_page')

        if 'source_platform' in request.data:
            clip.source_platform = str(request.data['source_platform']).strip().lower()
            update_fields.append('source_platform')

        if 'deadline' in request.data:
            import datetime
            d_val = request.data['deadline']
            if not d_val:
                clip.deadline_date = None
            else:
                try:
                    clip.deadline_date = datetime.date.fromisoformat(str(d_val)[:10])
                except (ValueError, TypeError) as exc:
                    logger.warning("Invalid deadline format %r for clip %s: %s", d_val, clip.id, exc)
            update_fields.append('deadline_date')

        if 'status' in request.data:
            clip.status = str(request.data['status']).strip().lower()
            update_fields.append('status')

        if 'is_favorite' in request.data or 'is_starred' in request.data:
            fav_val = bool(request.data.get('is_favorite') if 'is_favorite' in request.data else request.data.get('is_starred'))
            extra = clip.extra_metadata or {}
            extra['is_favorite'] = fav_val
            extra['is_starred'] = fav_val
            clip.extra_metadata = extra
            if 'extra_metadata' not in update_fields:
                update_fields.append('extra_metadata')

        if update_fields:
            clip.save(update_fields=update_fields)
            try:
                invalidate_user_clips_feed_cache(request.user.id)
            except Exception as exc:
                logger.warning("Cache invalidation failed after updating clip %s: %s", clip.id, exc)

        return Response(ClipSerializer(clip).data, status=status.HTTP_200_OK)

    def delete(self, request, clip_id):
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        import uuid as uuid_pkg
        try:
            c_uuid = uuid_pkg.UUID(str(clip_id).strip())
        except (ValueError, TypeError, AttributeError):
            return Response({'error': 'Clip not found.'}, status=status.HTTP_404_NOT_FOUND)

        clip = Clip.objects.filter(pk=c_uuid, user=request.user).first()
        if not clip:
            return Response({'error': 'Clip not found.'}, status=status.HTTP_404_NOT_FOUND)
        clip.delete()
        try:
            invalidate_user_clips_feed_cache(request.user.id)
            invalidate_user_clusters_cache(request.user.id)
        except Exception as exc:
            logger.warning("Cluster cache invalidation failed after delete for user %s: %s", request.user.id, exc)
        return Response({'message': 'Clip deleted successfully.'}, status=status.HTTP_200_OK)


class ClipContentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, clip_id):
        import uuid as uuid_pkg
        try:
            c_uuid = uuid_pkg.UUID(str(clip_id).strip())
        except (ValueError, TypeError, AttributeError):
            return Response({'error': 'Clip not found.'}, status=status.HTTP_404_NOT_FOUND)

        clip = Clip.objects.filter(pk=c_uuid, user=request.user).first()
        if not clip:
            return Response({'error': 'Clip not found.'}, status=status.HTTP_404_NOT_FOUND)

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

        # Real destination fetch and status computation
        user_dest_objs = list(Destination.objects.filter(user=user))
        vault_dest = next((d for d in user_dest_objs if d.provider == 'custom_db'), None)
        destinations_status = [
            {
                'id': str(vault_dest.id) if vault_dest else 'dest_save_vault',
                'provider': 'custom_db',
                'name': 'Save Vault (Cloud Database)',
                'connected': True,
                'status': 'active',
                'items_synced': total_clips,
            }
        ]

        PROVIDER_LABELS = {
            'google_sheets': 'Google Sheets',
            'notion': 'Notion Workspace',
            'airtable': 'Airtable Base',
            'spotify': 'Spotify',
            'youtube_music': 'YouTube Music',
            'webhook': 'Webhook Ingest',
        }

        for d in user_dest_objs:
            if d.provider == 'custom_db':
                continue
            synced_count = qs.filter(Q(destination=d) | Q(destination__provider=d.provider)).count()
            destinations_status.append({
                'id': str(d.id),
                'provider': d.provider,
                'name': d.name or PROVIDER_LABELS.get(d.provider, d.provider.replace('_', ' ').title()),
                'connected': d.is_active,
                'status': 'active' if d.is_active else 'disconnected',
                'items_synced': synced_count,
            })

        configured_provs = {d['provider'] for d in destinations_status}
        for default_prov in ['google_sheets', 'notion']:
            if default_prov not in configured_provs:
                destinations_status.append({
                    'id': f'dest_{default_prov}',
                    'provider': default_prov,
                    'name': PROVIDER_LABELS.get(default_prov, default_prov.replace('_', ' ').title()),
                    'connected': False,
                    'status': 'not_configured',
                    'items_synced': 0,
                })

        active_destinations = len([d for d in destinations_status if d.get('connected')])

        # One annotated base queryset per list below, so the serializer's
        # child-clip count comes from the same query (no N+1 COUNT per clip).
        base_clips_qs = qs.defer('raw_content').select_related('destination', 'parent_clip').annotate(
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

        highlight_title = "Weekly AI Digest & Opportunity Highlights"
        highlight_summary = (
            f"You saved {saved_this_week} items this week. Gemini AI detected high-priority opportunities "
            f"including remote engineering roles and research articles."
        )
        if recent_clips and recent_clips[0].get('summary'):
            highlight_summary = f"Latest Opportunity ({recent_clips[0].get('title') or 'Clip'}): {recent_clips[0].get('summary')}"

        # Live dynamic aggregation of Action Intents for donut chart & filter counts
        from apps.clips.services.intent_detector import CANONICAL_INTENTS, normalize_canonical_intent, IntentDetector, clean_action_intent

        # Auto-detect intent on the fly for any clips that missed Celery enrichment
        other_clips = list(qs.filter(Q(intent='other') | Q(intent__isnull=True) | Q(intent=''))[:100])
        clips_to_update = []
        for c in other_clips:
            detected = IntentDetector.detect_heuristic_intent(
                url=c.url,
                text=f"{c.title or ''} {c.selected_text or ''} {c.summary or ''} {' '.join(c.tags or [])}",
                content_type=c.content_type or '',
            )
            if detected and detected != 'other':
                c.intent = clean_action_intent(detected)
                clips_to_update.append(c)

        if clips_to_update:
            Clip.objects.bulk_update(clips_to_update, ['intent'])

        raw_intent_counts = qs.values('intent').annotate(count=Count('id'))
        intent_map = {ci: 0 for ci in CANONICAL_INTENTS}
        for item in raw_intent_counts:
            c_intent = normalize_canonical_intent(item.get('intent') or 'other')
            intent_map[c_intent] = intent_map.get(c_intent, 0) + item['count']

        INTENT_COLORS = {
            'learn': '#2D6A4F',
            'track': '#40916C',
            'apply': '#D97706',
            'watch': '#EF4444',
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

        from .services.similarity import VectorSimilarityEngine

        matches = VectorSimilarityEngine.search_similar_clips(
            user=user,
            query_text=text,
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
            except Exception as exc:
                logger.warning("Cluster cache get failed for user %s: %s", request.user.id, exc)

        clusters = ClipClusterEngine.discover_clusters_for_user(
            user=request.user,
            similarity_threshold=threshold,
            min_cluster_size=min_size,
        )

        try:
            cache.set(cache_key, clusters, timeout=300)
        except Exception as exc:
            logger.warning("Cluster cache set failed for user %s: %s", request.user.id, exc)

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

        existing_slugs = set(
            CustomPage.objects.filter(user=request.user, slug__startswith=base_slug)
            .values_list('slug', flat=True)
        )
        slug = base_slug
        counter = 1
        while slug in existing_slugs:
            slug = f"{base_slug}-{counter}"
            counter += 1

        content_types = request.data.get('content_types') or ['general', 'article', 'research']
        if isinstance(content_types, str):
            content_types = [c.strip() for c in content_types.split(',') if c.strip()]

        parent_page = None
        parent_id_val = request.data.get('parent_id') or request.data.get('parentId')
        if parent_id_val:
            try:
                import uuid as uuid_pkg
                parent_uuid = uuid_pkg.UUID(str(parent_id_val))
                parent_page = CustomPage.objects.filter(user=request.user, pk=parent_uuid).first()
            except (ValueError, TypeError):
                parent_page = CustomPage.objects.filter(user=request.user, slug=str(parent_id_val)).first()

        page = CustomPage.objects.create(
            user=request.user,
            parent=parent_page,
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


class CustomCategoryListCreateView(APIView):
    """
    GET /api/clips/custom-categories/
    Lists custom user categories for grouping dimensions (intent, source, type, custom).
    Optional query parameter: ?dimension=intent

    POST /api/clips/custom-categories/
    Creates a new custom user category.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required. Please sign in.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        qs = CustomCategory.objects.filter(user=request.user)
        dimension = request.query_params.get('dimension', '').strip().lower()
        if dimension and dimension != 'all':
            qs = qs.filter(dimension=dimension)
        return Response(CustomCategorySerializer(qs, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required. Please sign in.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        name = str(request.data.get('name', '')).strip()
        if not name:
            return Response({'error': 'Category name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        dimension = str(request.data.get('dimension', 'intent')).strip().lower()
        if dimension not in dict(CustomCategory.DIMENSION_CHOICES):
            dimension = CustomCategory.DIMENSION_INTENT

        import re
        base_slug = request.data.get('slug') or re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        if not base_slug:
            base_slug = 'category'

        existing_slugs = set(
            CustomCategory.objects.filter(user=request.user, dimension=dimension, slug__startswith=base_slug)
            .values_list('slug', flat=True)
        )
        slug = base_slug
        counter = 1
        while slug in existing_slugs:
            slug = f"{base_slug}-{counter}"
            counter += 1

        keywords = request.data.get('keywords') or []
        if isinstance(keywords, str):
            keywords = [k.strip().lower() for k in keywords.split(',') if k.strip()]

        cat = CustomCategory.objects.create(
            user=request.user,
            dimension=dimension,
            name=name,
            slug=slug,
            color=request.data.get('color') or '#3B82F6',
            bg_color=request.data.get('bg_color') or 'rgba(59, 130, 246, 0.15)',
            icon_name=request.data.get('icon_name') or request.data.get('icon') or 'Tag',
            description=request.data.get('description', '').strip(),
            keywords=keywords,
        )
        return Response(CustomCategorySerializer(cat).data, status=status.HTTP_201_CREATED)


class CustomCategoryDetailView(APIView):
    """
    DELETE /api/clips/custom-categories/<uuid:pk>/
    PATCH /api/clips/custom-categories/<uuid:pk>/
    """
    permission_classes = [AllowAny]

    def _get_cat(self, request, pk):
        if not request.user or not request.user.is_authenticated:
            return None
        return CustomCategory.objects.filter(pk=pk, user=request.user).first()

    def patch(self, request, pk):
        cat = self._get_cat(request, pk)
        if not cat:
            return Response({'error': 'Custom category not found.'}, status=status.HTTP_404_NOT_FOUND)

        update_fields = []
        if 'name' in request.data:
            cat.name = str(request.data['name']).strip()
            update_fields.append('name')
        if 'color' in request.data:
            cat.color = str(request.data['color']).strip()
            update_fields.append('color')
        if 'bg_color' in request.data:
            cat.bg_color = str(request.data['bg_color']).strip()
            update_fields.append('bg_color')
        if 'icon_name' in request.data:
            cat.icon_name = str(request.data['icon_name']).strip()
            update_fields.append('icon_name')
        if 'description' in request.data:
            cat.description = str(request.data['description']).strip()
            update_fields.append('description')
        if 'keywords' in request.data:
            kw = request.data['keywords']
            if isinstance(kw, str):
                kw = [k.strip().lower() for k in kw.split(',') if k.strip()]
            cat.keywords = kw
            update_fields.append('keywords')

        if update_fields:
            cat.save(update_fields=update_fields)
        return Response(CustomCategorySerializer(cat).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        cat = self._get_cat(request, pk)
        if not cat:
            return Response({'error': 'Custom category not found.'}, status=status.HTTP_404_NOT_FOUND)
        cat.delete()
        return Response({'message': 'Custom category deleted successfully.'}, status=status.HTTP_200_OK)


class FeedStreamView(APIView):
    """
    GET /api/clips/feed/
    Returns the comprehensive, algorithmic Activity & Opportunity Feed:
    - Live Ingestion Stream Metrics
    - The Daily 5 Spaced Review Queue (Streak-building micro-review)
    - "Connect the Dots" AI Cross-Clip Synthesis
    - Stream Timeline Cards filtered by timeframe and category
    - Destination Sync River activity
    - Career Opportunity Watchlist
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        timeframe = request.query_params.get('timeframe', 'today').strip().lower()
        category = request.query_params.get('category', 'all').strip().lower()
        limit = int(request.query_params.get('limit', 50))

        from .services.feed_engine import FeedEngine
        feed_data = FeedEngine.get_feed(
            user=user,
            timeframe=timeframe,
            category=category,
            limit=limit,
        )

        return Response(feed_data, status=status.HTTP_200_OK)


class FeedItemActionView(APIView):
    """
    POST /api/clips/feed/<uuid:clip_id>/action/
    Handles interactive feed actions:
    - 'review' / 'master': Marks item reviewed in Daily 5, increments habit streak
    - 'snooze': Temporarily snoozes item for 3 days
    - 'watchlist': Toggles career opportunity watchlist
    - 'archive': Marks clip status as DONE
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, clip_id):
        user = request.user
        action = str(request.data.get('action', 'review')).strip().lower()
        note = str(request.data.get('note', '')).strip()

        from .services.feed_engine import FeedEngine
        result = FeedEngine.handle_action(
            user=user,
            clip_id=str(clip_id),
            action=action,
            note=note,
        )

        if not result.get('success'):
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)


class PlaylistListView(APIView):
    """
    GET /api/clips/playlists/
    Returns all auto-generated knowledge stacks (Daily 5, tag-based, thematic categories)
    for the user with progress stats and domain previews.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        from .services.playlist_engine import PlaylistEngine
        playlists = PlaylistEngine.get_user_playlists(user)
        return Response({'playlists': playlists}, status=status.HTTP_200_OK)


class PlaylistClipsView(APIView):
    """
    GET /api/clips/playlists/<str:playlist_id>/clips/
    Returns ordered swipe cards for a given knowledge stack.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, playlist_id):
        user = request.user
        from .services.playlist_engine import PlaylistEngine
        cards = PlaylistEngine.get_playlist_clips(user, playlist_id)
        return Response({'cards': cards, 'total': len(cards), 'playlist_id': playlist_id}, status=status.HTTP_200_OK)


class SwipeActionView(APIView):
    """
    POST /api/clips/<uuid:clip_id>/swipe-action/
    Handles interactive swipe actions:
    like, reviewed, watchlist, snooze, archive, note, share, destination
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, clip_id):
        user = request.user
        action = str(request.data.get('action', 'reviewed')).strip().lower()
        note = str(request.data.get('note', '')).strip()
        destination_id = str(request.data.get('destination_id', '')).strip()

        from .services.playlist_engine import PlaylistEngine
        result = PlaylistEngine.handle_swipe_action(
            user=user,
            clip_id=str(clip_id),
            action=action,
            note=note,
            destination_id=destination_id,
        )

        if not result.get('success'):
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)






