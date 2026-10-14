import logging
from django.apps import AppConfig
from django.conf import settings

logger = logging.getLogger(__name__)


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'

    def ready(self):
        # Auto-create local development admin only in DEBUG mode
        if getattr(settings, 'DEBUG', False):
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                if not User.objects.filter(email='admin@save.app').exists():
                    User.objects.create_superuser('admin@save.app', 'admin123', name='Admin User')
            except Exception as exc:
                logger.debug("Local development admin bootstrap skipped: %s", exc)
