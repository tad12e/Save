import logging
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .importers import get_importer
from .models import BulkImportJob, Clip
from .services.url import hash_url, normalise_url

logger = logging.getLogger(__name__)


class BulkImportUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        source_platform = request.data.get('source_platform', '')
        file_obj = request.FILES.get('file')
        raw_text = request.data.get('raw_data') or request.data.get('urls') or ''

        file_name = ''
        content = ''

        if file_obj:
            file_name = file_obj.name
            try:
                content = file_obj.read().decode('utf-8', errors='replace')
            except Exception as e:
                return Response({'error': f'Failed to read uploaded file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        elif raw_text:
            content = str(raw_text)
            file_name = 'raw_urls.txt'
        else:
            return Response(
                {'error': 'Either a file upload or raw_data/urls must be provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Detect platform if not explicitly passed
        importer = get_importer(source_platform=source_platform, filename=file_name, content=content)
        detected_platform = source_platform or (
            'browser' if 'HTML' in importer.__class__.__name__ else
            'twitter' if 'Twitter' in importer.__class__.__name__ else
            'reddit' if 'Reddit' in importer.__class__.__name__ else
            'urls'
        )

        try:
            parsed_bookmarks = importer.parse(content)
        except Exception as e:
            logger.exception('Bulk import parsing failed')
            return Response({'error': f'Parsing error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        if not parsed_bookmarks:
            return Response({'error': 'No valid bookmark URLs found in the provided data.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create job
        job = BulkImportJob.objects.create(
            user=user,
            source_platform=detected_platform[:30],
            file_name=file_name[:255],
            status=BulkImportJob.STATUS_PROCESSING,
            total_items=len(parsed_bookmarks),
            raw_data=content[:50000] if len(content) < 50000 else content[:50000] + '... [truncated]',
        )

        # Phase 1: Fast Ingestion & Deduplication
        created_clips = []
        skipped_duplicates = 0
        seen_in_batch = set()

        for bm in parsed_bookmarks:
            try:
                clean_url = normalise_url(bm.url)
                u_hash = hash_url(clean_url)
            except Exception:
                continue

            if u_hash in seen_in_batch:
                skipped_duplicates += 1
                continue
            seen_in_batch.add(u_hash)

            # Check existing database records for user
            if Clip.objects.filter(user=user, url_hash=u_hash).exists():
                skipped_duplicates += 1
                continue

            clip = Clip(
                user=user,
                url=clean_url,
                url_hash=u_hash,
                title=bm.title[:512] if bm.title else clean_url[:512],
                tags=bm.tags or [],
                source_platform=bm.source_platform or 'web',
                source_author=bm.source_author[:255] if bm.source_author else '',
                selected_text=bm.selected_text or '',
                status=Clip.STATUS_PENDING,
                extra_metadata=bm.extra_metadata or {},
            )
            created_clips.append(clip)

        if created_clips:
            # Bulk create clips in database
            Clip.objects.bulk_create(created_clips, batch_size=200)

        created_count = len(created_clips)
        job.created_items = created_count
        job.skipped_duplicates = skipped_duplicates
        job.status = BulkImportJob.STATUS_DONE if created_count == 0 else BulkImportJob.STATUS_PROCESSING
        if created_count == 0:
            job.completed_at = timezone.now()
        job.save()

        # Phase 2: Celery Background Task for AI Summarization & Embeddings
        if created_count > 0:
            try:
                from .tasks import process_bulk_import_job
                process_bulk_import_job.delay(str(job.id))
            except Exception as e:
                logger.warning('Could not enqueue Celery task for bulk import: %s', e)

        return Response(
            {
                'job_id': str(job.id),
                'status': job.status,
                'source_platform': job.source_platform,
                'total_items': job.total_items,
                'created_items': created_count,
                'skipped_duplicates': skipped_duplicates,
                'message': f"Import started. {created_count} bookmarks added, {skipped_duplicates} duplicate(s) skipped.",
            },
            status=status.HTTP_201_CREATED,
        )


class BulkImportStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = BulkImportJob.objects.get(id=job_id, user=request.user)
        except BulkImportJob.DoesNotExist:
            return Response({'error': 'Import job not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            {
                'id': str(job.id),
                'status': job.status,
                'source_platform': job.source_platform,
                'file_name': job.file_name,
                'total_items': job.total_items,
                'created_items': job.created_items,
                'skipped_duplicates': job.skipped_duplicates,
                'processed_items': job.processed_items,
                'failed_items': job.failed_items,
                'error_log': job.error_log,
                'created_at': job.created_at.isoformat(),
                'completed_at': job.completed_at.isoformat() if job.completed_at else None,
            },
            status=status.HTTP_200_OK,
        )


class BulkImportHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        jobs = BulkImportJob.objects.filter(user=request.user)[:20]
        data = [
            {
                'id': str(j.id),
                'status': j.status,
                'source_platform': j.source_platform,
                'file_name': j.file_name,
                'total_items': j.total_items,
                'created_items': j.created_items,
                'skipped_duplicates': j.skipped_duplicates,
                'processed_items': j.processed_items,
                'created_at': j.created_at.isoformat(),
                'completed_at': j.completed_at.isoformat() if j.completed_at else None,
            }
            for j in jobs
        ]
        return Response(data, status=status.HTTP_200_OK)
