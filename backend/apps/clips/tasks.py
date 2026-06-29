"""
Background Celery tasks for clip processing.

This is where scraping, AI summarisation, tagging, etc. will live.
For now it's a skeleton that transitions the clip through its status lifecycle.
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
    """
    Process a newly saved clip in the background.

    Steps (to be expanded later):
      1. Mark clip as 'processing'
      2. Scrape the page content
      3. Extract title, summary, content_type, tags via AI
      4. Mark clip as 'done'

    On failure, mark as 'failed' and log the error.
    """
    from apps.clips.models import Clip

    try:
        clip = Clip.objects.get(pk=clip_id)
    except Clip.DoesNotExist:
        logger.error('Clip %s not found — skipping.', clip_id)
        return

    clip.status = Clip.STATUS_PROCESSING
    clip.save(update_fields=['status'])
    logger.info('Processing clip %s — %s', clip.id, clip.url)

    try:
        # ------------------------------------------------------------------
        # TODO: Implement the actual processing pipeline here.
        #
        # Future steps:
        #   1. Scrape / fetch the URL content
        #   2. Send to AI for title, summary, content_type, tags
        #   3. Save the results on the clip
        #
        # Example placeholder:
        #   page = scrape(clip.url)
        #   result = ai_extract(page, clip.selected_text)
        #   clip.title = result['title']
        #   clip.summary = result['summary']
        #   clip.content_type = result['content_type']
        #   clip.tags = result['tags']
        # ------------------------------------------------------------------

        clip.status = Clip.STATUS_DONE
        clip.save(update_fields=['status', 'title', 'summary', 'content_type', 'tags'])
        logger.info('Clip %s processed successfully.', clip.id)

    except Exception as exc:
        clip.status = Clip.STATUS_FAILED
        clip.save(update_fields=['status'])
        logger.exception('Clip %s processing failed: %s', clip.id, exc)
        raise self.retry(exc=exc)
