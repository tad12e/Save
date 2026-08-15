"""
Background Celery tasks for clip processing.
"""

import logging
from datetime import timedelta

from celery import shared_task

logger = logging.getLogger(__name__)


def _try_extract_sheet_rows(resource_url: str) -> list[dict]:
    """
    Attempts to read public rows from a Google Sheet URL (via CSV export endpoint).
    """
    import csv
    import io
    import re
    import urllib.request

    match = re.search(r'/spreadsheets/d/([a-zA-Z0-9-_]+)', resource_url)
    if not match:
        return []

    sheet_id = match.group(1)
    csv_url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv'

    try:
        req = urllib.request.Request(
            csv_url,
            headers={'User-Agent': 'SaveClipperBot/1.0'},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode('utf-8', errors='replace')
            reader = csv.reader(io.StringIO(content))
            rows = list(reader)
            if not rows or len(rows) < 2:
                return []

            headers = [h.strip().lower() for h in rows[0]]
            items = []
            for r in rows[1:50]:  # Limit to first 50 rows for safety
                if not any(r):
                    continue
                row_dict = {}
                for idx, val in enumerate(r):
                    if idx < len(headers):
                        row_dict[headers[idx]] = val.strip()
                    else:
                        row_dict[f'col_{idx}'] = val.strip()
                
                # Derive title and URL/summary
                title = row_dict.get('title') or row_dict.get('job title') or row_dict.get('role') or row_dict.get('company') or (r[0] if r else 'Linked Item')
                link = row_dict.get('url') or row_dict.get('link') or row_dict.get('apply') or resource_url
                desc = row_dict.get('description') or row_dict.get('summary') or ' '.join(f'{k}: {v}' for k, v in row_dict.items() if v and k not in ('title', 'job title', 'role'))
                
                items.append({
                    'title': title[:512],
                    'url': link,
                    'summary': desc[:400],
                    'content_type': 'job' if any(k in ' '.join(headers) for k in ('job', 'role', 'salary', 'company')) else 'article',
                })
            return items
    except Exception as exc:
        logger.info('Public sheet CSV export not accessible for %s: %s', resource_url, exc)
        return []


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
        clip = Clip.objects.select_related('destination', 'user', 'parent_clip').get(pk=clip_id)
    except Clip.DoesNotExist:
        logger.error('Clip %s not found — skipping.', clip_id)
        return

    clip.status = Clip.STATUS_PROCESSING
    clip.save(update_fields=['status'])
    logger.info('Processing clip %s — %s', clip.id, clip.url)

    try:
        metadata = extract_clip_metadata(clip)
        clip.title = metadata.get('title') or clip.url
        clip.summary = metadata.get('summary') or ''
        clip.content_type = metadata.get('content_type') or 'webpage'
        clip.tags = metadata.get('tags') or []

        # Source platform origin attribution
        clip.source_platform = metadata.get('source_platform') or getattr(clip, 'source_platform', 'web') or 'web'
        clip.source_author = metadata.get('source_author') or getattr(clip, 'source_author', '') or ''
        clip.source_post_url = metadata.get('source_post_url') or getattr(clip, 'source_post_url', clip.url) or clip.url

        # Resource hub identification
        clip.is_resource_hub = metadata.get('is_resource_hub', False)
        clip.extracted_resource_url = metadata.get('extracted_resource_url', '')

        # Category-specific structured fields & dynamic schema
        extra = metadata.get('category_fields') or {}
        if metadata.get('category_name'):
            extra['category_name'] = metadata['category_name']
        if metadata.get('dynamic_headers'):
            extra['dynamic_headers'] = metadata['dynamic_headers']
        if metadata.get('dynamic_row'):
            extra['dynamic_row'] = metadata['dynamic_row']
        clip.extra_metadata = extra

        # Save AI-extracted deadline and music embed URL
        update_fields = [
            'title',
            'summary',
            'content_type',
            'tags',
            'status',
            'source_platform',
            'source_author',
            'source_post_url',
            'is_resource_hub',
            'extracted_resource_url',
            'extra_metadata',
        ]
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
        logger.info(
            'Clip %s processed successfully (platform=%s, author=%s, type=%s).',
            clip.id,
            clip.source_platform,
            clip.source_author,
            clip.content_type,
        )

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

        # If clip is a resource hub and has linked sheet/table, unpack sub-items as child clips
        if clip.is_resource_hub and clip.extracted_resource_url and not clip.parent_clip:
            extracted_sub_rows = _try_extract_sheet_rows(clip.extracted_resource_url)
            if extracted_sub_rows:
                logger.info('Unpacking %d child items for parent clip %s', len(extracted_sub_rows), clip.id)
                from apps.clips.services.url import hash_url, normalise_url
                for item in extracted_sub_rows:
                    sub_url = item.get('url') or clip.url
                    sub_hash = hash_url(f"{normalise_url(sub_url)}||child_{clip.id}_{item['title'][:30]}")
                    child_clip, created = Clip.objects.get_or_create(
                        user=clip.user,
                        url_hash=sub_hash,
                        defaults={
                            'parent_clip': clip,
                            'url': sub_url,
                            'title': item['title'],
                            'summary': item['summary'],
                            'content_type': item.get('content_type', clip.content_type),
                            'status': Clip.STATUS_DONE,
                            'source_platform': clip.source_platform,
                            'source_author': clip.source_author,
                            'source_post_url': clip.url,
                            'destination': clip.destination,
                        },
                    )
                    if created and clip.destination:
                        export_clip_to_destination(child_clip, clip.destination)

        # Export parent clip to destination
        destination = clip.destination or get_user_destination(clip.user)
        if not destination or destination.provider == 'custom_db' or destination.name.startswith('Save Vault'):
            clip.export_status = 'done'
            clip.save(update_fields=['export_status'])
            logger.info('Clip %s target is Internal Database — saved to DB, no external export needed.', clip.id)
            return

        clip.export_status = 'processing'
        clip.save(update_fields=['export_status'])

        result = export_clip_to_destination(clip, destination)
        if result.success:
            clip.export_status = 'done'
            clip.export_url = result.external_url
            clip.export_error = ''
            clip.save(update_fields=['export_status', 'export_url', 'export_error'])
            logger.info('Clip %s exported to %s (category tab).', clip.id, destination.provider)
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

    from django.conf import settings as django_settings
    from django.core.mail import send_mail

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
            f'Hi {getattr(clip.user, "name", "there")},\n\n'
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
