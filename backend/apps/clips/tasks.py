"""
Background Celery tasks for clip processing.
"""

import logging
from datetime import timedelta

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

        # Save AI-extracted deadline and music embed URL
        update_fields = ['title', 'summary', 'content_type', 'tags', 'status']
        deadline_str = metadata.get('deadline_date')
        if deadline_str:
            try:
                from datetime import date as date_type
                parts = deadline_str.split('-')
                clip.deadline_date = date_type(int(parts[0]), int(parts[1]), int(parts[2]))
                update_fields.append('deadline_date')
            except (ValueError, IndexError):
                pass

        music_url = metadata.get('music_embed_url')
        if music_url:
            clip.music_embed_url = music_url
            update_fields.append('music_embed_url')

        clip.status = Clip.STATUS_DONE
        clip.save(update_fields=update_fields)
        logger.info('Clip %s summarized successfully (type=%s, deadline=%s).', clip.id, clip.content_type, clip.deadline_date)

        # Generate embedding for vector semantic search
        try:
            from apps.clips.services.embed import generate_embedding
            text_to_embed = f"{clip.title} {clip.summary} {clip.selected_text}"
            embedding_vector = generate_embedding(text_to_embed)
            if embedding_vector:
                clip.embedding = embedding_vector
                clip.save(update_fields=['embedding'])
                logger.info('Clip %s embedding generated successfully.', clip.id)
        except Exception as embed_exc:
            logger.warning('Embedding generation for clip %s failed: %s', clip.id, embed_exc)

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


@shared_task(bind=True)
def check_deadline_reminders(self):
    """
    Periodic task: find clips with deadlines approaching in the next 48 hours
    and send email reminders to their owners.
    """
    from datetime import date as date_type

    from django.core.mail import send_mail
    from django.conf import settings as django_settings

    from apps.clips.models import Clip

    today = date_type.today()
    cutoff = today + timedelta(days=2)

    upcoming = Clip.objects.filter(
        deadline_date__gte=today,
        deadline_date__lte=cutoff,
        reminder_sent=False,
        status=Clip.STATUS_DONE,
    ).select_related('user')

    count = 0
    for clip in upcoming:
        days_left = (clip.deadline_date - today).days
        subject = f'⏰ Clipper Reminder: "{clip.title}" deadline in {days_left} day{"s" if days_left != 1 else ""}!'
        body = (
            f'Hi {clip.user.first_name or "there"},\n\n'
            f'Your saved clip "{clip.title}" has a deadline approaching:\n\n'
            f'  📋 {clip.title}\n'
            f'  🔗 {clip.url}\n'
            f'  📅 Deadline: {clip.deadline_date.strftime("%B %d, %Y")}\n'
            f'  ⏳ {days_left} day{"s" if days_left != 1 else ""} remaining\n\n'
            f'{clip.summary or ""}\n\n'
            f'Don\'t miss it!\n'
            f'— Clipper'
        )

        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=django_settings.DEFAULT_FROM_EMAIL,
                recipient_list=[clip.user.email],
                fail_silently=True,
            )
            clip.reminder_sent = True
            clip.save(update_fields=['reminder_sent'])
            count += 1
            logger.info('Sent deadline reminder for clip %s to %s', clip.id, clip.user.email)
        except Exception as exc:
            logger.warning('Failed to send reminder for clip %s: %s', clip.id, exc)

    logger.info('Deadline reminder check complete: %d reminders sent.', count)
    return count
