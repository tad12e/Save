from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'

    def ready(self):
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if not User.objects.filter(email='admin@save.app').exists():
                User.objects.create_superuser('admin@save.app', 'admin123', name='Admin User')
        except Exception:
            pass
