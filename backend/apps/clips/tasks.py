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
    from apps.clips.github_detector import get_repo_info, is_github_list_repo
    from apps.clips.github_parser import fetch_repo_metadata
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

    # ─── STEP 1: GitHub Repository & List Detection ───
    repo_info = get_repo_info(clip.url)
    if repo_info:
        is_list, reason = is_github_list_repo(clip.url)
        logger.info('List detection: %s reason=%s for %s', is_list, reason, repo_info['full_repo'])
        if is_list:
            logger.info(
                'Clip %s detected as GitHub Resource / Awesome List (%s, reason=%s). Delegating to process_github_list_repo.',
                clip.id,
                repo_info['full_repo'],
                reason,
            )
            # Delegate to specialized GitHub list task
            process_github_list_repo.delay(str(clip.id))
            return

        # Normal code repository handling (single clip with type 'repo')
        logger.info('Clip %s is a standard GitHub code repo (%s).', clip.id, repo_info['full_repo'])
        repo_meta = fetch_repo_metadata(repo_info['owner'], repo_info['repo'])

        clip.title = repo_meta.get('full_name') or repo_meta.get('name') or clip.url
        clip.summary = repo_meta.get('description') or f"GitHub repository by {repo_info['owner']}"
        clip.content_type = 'repo'
        clip.source_platform = Clip.PLATFORM_GITHUB
        clip.source_author = repo_info['owner']
        clip.source_post_url = clip.url
        clip.tags = [
            'repo',
            'github',
            repo_meta.get('language', 'Code').lower(),
        ] + [str(t).lower() for t in repo_meta.get('topics', [])[:4]]

        clip.extra_metadata = {
            'repo_name': repo_meta.get('name'),
            'stars': repo_meta.get('stars', 0),
            'language': repo_meta.get('language', 'Code'),
            'license': repo_meta.get('license', 'Open Source'),
            'forks': repo_meta.get('forks', 0),
            'topics': repo_meta.get('topics', []),
            'source_type': 'github_repo',
        }
        clip.status = Clip.STATUS_DONE
        clip.save(update_fields=[
            'title',
            'summary',
            'content_type',
            'tags',
            'source_platform',
            'source_author',
            'source_post_url',
            'extra_metadata',
            'status',
        ])

        # Generate embedding for repository
        try:
            from apps.clips.services.embed import generate_embedding
            text_to_embed = f"{clip.title} {clip.summary} {repo_meta.get('language', '')}"
            embedding_vector = generate_embedding(text_to_embed)
            if embedding_vector:
                clip.embedding = embedding_vector
                clip.save(update_fields=['embedding'])
        except Exception as embed_exc:
            logger.warning('Embedding generation for repo clip %s failed: %s', clip.id, embed_exc)

        # Export normal repo clip
        destination = clip.destination or get_user_destination(clip.user)
        if destination and destination.provider != 'custom_db' and not destination.name.startswith('Save Vault'):
            export_clip_to_destination(clip, destination)
        return

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
        destination = clip.destination or get_user_destination(clip.user, content_type=clip.content_type)
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


@shared_task(
    bind=True,
    max_retries=2,
    default_retry_delay=20,
    acks_late=True,
)
def process_github_list_repo(self, clip_id: str):
    """
    Dedicated background task to parse GitHub resource / awesome list repositories.
    Fetches raw README, scrapes individual tools, saves each as a child Clip,
    and batch exports them to the 'Tools' tab in Google Sheets.
    """
    from apps.clips.github_detector import get_repo_info
    from apps.clips.github_parser import fetch_readme, parse_list_resources
    from apps.clips.models import Clip
    from apps.clips.services.summarize import clean_text
    from apps.clips.services.url import hash_url, normalise_url
    from apps.destinations.services import batch_export_resources_to_destination, get_user_destination

    try:
        clip = Clip.objects.select_related('destination', 'user').get(pk=clip_id)
    except Clip.DoesNotExist:
        logger.error('GitHub list clip %s not found.', clip_id)
        return

    repo_info = get_repo_info(clip.url)
    if not repo_info:
        logger.error('Invalid GitHub URL %s for clip %s', clip.url, clip.id)
        clip.status = Clip.STATUS_FAILED
        clip.save(update_fields=['status'])
        return

    # STEP 6 (Initial Progress): update clip status
    clip.status = Clip.STATUS_PROCESSING
    clip.is_resource_hub = True
    clip.source_platform = Clip.PLATFORM_GITHUB
    clip.source_author = repo_info['owner']
    clip.source_post_url = clip.url
    clip.extra_metadata = {
        'total_found': 0,
        'processed': 0,
        'current': 'Parsing README...',
        'source_type': 'github_list',
        'source_repo': repo_info['full_repo'],
    }
    clip.save(update_fields=['status', 'is_resource_hub', 'source_platform', 'source_author', 'source_post_url', 'extra_metadata'])

    try:
        # STEP 2: Fetch and parse raw README
        readme_text = fetch_readme(repo_info['owner'], repo_info['repo'], repo_info.get('branch'))
        if not readme_text:
            logger.warning('Could not fetch README for %s. Falling back to normal clip processing.', repo_info['full_repo'])
            clip.status = Clip.STATUS_DONE
            clip.title = repo_info['repo']
            clip.summary = f"GitHub resource list {repo_info['full_repo']} (README not reachable)"
            clip.save(update_fields=['status', 'title', 'summary'])
            return

        resources = parse_list_resources(readme_text, source_url=clip.url, source_repo=repo_info['full_repo'])
        total_found = len(resources)

        clip.extra_metadata['total_found'] = total_found
        clip.extra_metadata['current'] = f'Found {total_found} resources. Processing & saving...'
        clip.save(update_fields=['extra_metadata'])

        if total_found == 0:
            logger.info('No individual tool resources extracted from %s', repo_info['full_repo'])
            clip.status = Clip.STATUS_DONE
            clip.title = repo_info['repo']
            clip.summary = f"GitHub list repository {repo_info['full_repo']} (0 tools parsed)"
            clip.extra_metadata = {
                'total_found': 0,
                'saved': 0,
                'skipped': 0,
                'source_type': 'github_list',
                'source_repo': repo_info['full_repo'],
                'tab': 'Tools',
            }
            clip.save(update_fields=['status', 'title', 'summary', 'extra_metadata'])
            return

        # STEP 4: Save each resource as a separate Clip record
        saved_count = 0
        skipped_count = 0

        for idx, r in enumerate(resources):
            # url_hash incorporates normalized tool URL + child clip marker
            norm_tool_url = normalise_url(r['url'])
            u_hash = hash_url(f"{norm_tool_url}||child_{clip.id}_{r['position']}")

            child_clip, created = Clip.objects.get_or_create(
                user=clip.user,
                url_hash=u_hash,
                defaults={
                    'parent_clip': clip,
                    'url': r['url'],  # Actual tool website URL (NOT GitHub URL)
                    'title': r['name'][:512],
                    'summary': r['description'],
                    'selected_text': r['description'],
                    'content_type': r['content_type'],  # Usually 'tool'
                    'tags': [
                        r['content_type'],
                        r['pricing'],
                        clean_text(r['section']).lower()[:30],
                    ],
                    'status': Clip.STATUS_DONE,
                    'source_platform': Clip.PLATFORM_GITHUB,
                    'source_author': r['source_repo'],
                    'source_post_url': r['source_url'],  # Original GitHub URL
                    'destination': clip.destination,
                    'extra_metadata': {
                        'section': r['section'],
                        'pricing': r['pricing'],
                        'position': r['position'],
                        'source_repo': r['source_repo'],
                        'source_url': r['source_url'],
                        'source_type': 'github_list',
                    },
                },
            )

            if created:
                saved_count += 1
            else:
                skipped_count += 1

            # Update progress periodically so frontend can display status
            if (idx + 1) % 25 == 0 or (idx + 1) == total_found:
                clip.extra_metadata['processed'] = idx + 1
                clip.extra_metadata['current'] = f'Saving tools ({idx + 1}/{total_found})...'
                clip.save(update_fields=['extra_metadata'])

        # STEP 5: Batch export all resources to Google Sheets (Tools tab)
        destination = clip.destination or get_user_destination(clip.user)
        if destination and destination.provider == 'google_sheets':
            clip.extra_metadata['current'] = 'Exporting tools batch to Google Sheets (Tools tab)...'
            clip.save(update_fields=['extra_metadata'])

            export_res = batch_export_resources_to_destination(
                destination=destination,
                resources=resources,
                source_url=clip.url,
                source_repo=repo_info['full_repo'],
                saved_at_str=clip.created_at.strftime('%Y-%m-%d %H:%M:%S') if clip.created_at else '',
            )

            if export_res.success:
                clip.export_status = 'done'
                clip.export_url = export_res.external_url
                clip.export_error = ''
                logger.info('Successfully batch-exported %d tools from %s to Google Sheets.', len(resources), repo_info['full_repo'])
            else:
                clip.export_status = 'failed'
                clip.export_error = export_res.error
                logger.warning('Google Sheets batch export failed for list %s: %s', clip.id, export_res.error)

            clip.save(update_fields=['export_status', 'export_url', 'export_error'])

        # STEP 6: Final status update
        clip.status = Clip.STATUS_DONE
        clip.title = f"{repo_info['repo']} ({saved_count} tools)"
        clip.summary = f"Curated resource list with {total_found} tools extracted from {repo_info['full_repo']}."
        clip.extra_metadata = {
            'total_found': total_found,
            'saved': saved_count,
            'skipped': skipped_count,
            'source_type': 'github_list',
            'source_repo': repo_info['full_repo'],
            'tab': 'Tools',
        }
        clip.save(update_fields=['status', 'title', 'summary', 'extra_metadata'])
        logger.info('Finished processing GitHub list %s: %d saved, %d skipped.', repo_info['full_repo'], saved_count, skipped_count)

    except Exception as exc:
        clip.status = Clip.STATUS_FAILED
        clip.extra_metadata['error'] = str(exc)
        clip.save(update_fields=['status', 'extra_metadata'])
        logger.exception('Failed processing GitHub list repo %s: %s', clip.id, exc)
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

