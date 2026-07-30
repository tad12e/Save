"""
Background Celery tasks for clip processing.
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    acks_late=True,
)
def process_clip(self, clip_id: str):
    from apps.clips.models import Clip
    from apps.clips.services.extract import extract_clip_metadata
    from apps.destinations.services import export_clip_to_destination, get_user_destination

    try:
        clip = Clip.objects.select_related('destination', 'user').get(pk=clip_id)
    except Clip.DoesNotExist:
        logger.error('Clip %s not found — skipping.', clip_id)
        return

    clip.status = Clip.STATUS_PROCESSING
    clip.save(update_fields=['status'])
    logger.info('Processing clip %s — %s', clip.id, clip.url)

    try:
        metadata = extract_clip_metadata(clip)
        clip.title = metadata['title']
        clip.summary = metadata['summary']
        clip.content_type = metadata['content_type']
        clip.tags = metadata['tags']
        clip.status = Clip.STATUS_DONE
        clip.save(update_fields=['title', 'summary', 'content_type', 'tags', 'status'])
        logger.info('Clip %s summarized successfully.', clip.id)

        destination = clip.destination or get_user_destination(clip.user)
        if not destination:
            clip.export_status = 'skipped'
            clip.save(update_fields=['export_status'])
            logger.info('Clip %s has no destination configured — export skipped.', clip.id)
            return

        clip.export_status = 'processing'
        clip.save(update_fields=['export_status'])

        result = export_clip_to_destination(clip, destination)
        if result.success:
            clip.export_status = 'done'
            clip.export_url = result.external_url
            clip.export_error = ''
            clip.save(update_fields=['export_status', 'export_url', 'export_error'])
            logger.info('Clip %s exported to %s.', clip.id, destination.provider)
        else:
            clip.export_status = 'failed'
            clip.export_error = result.error
            clip.save(update_fields=['export_status', 'export_error'])
            logger.error('Clip %s export failed: %s', clip.id, result.error)

    except Exception as exc:
        clip.status = Clip.STATUS_FAILED
        clip.save(update_fields=['status'])
        logger.exception('Clip %s processing failed: %s', clip.id, exc)
        raise self.retry(exc=exc)
