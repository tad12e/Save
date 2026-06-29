"""
Celery application configuration for the Save project.

Usage:
    # Start the worker (from the backend/ directory):
    celery -A config worker --loglevel=info

    # On Windows, you may need the solo pool:
    celery -A config worker --loglevel=info --pool=solo
"""

import os

from celery import Celery

# Set default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('save')

# Read Celery config from Django settings, using the CELERY_ namespace.
# e.g. CELERY_BROKER_URL in settings.py → broker_url in Celery.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks.py in all installed Django apps.
app.autodiscover_tasks()
