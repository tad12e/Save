from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_add_google_id'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='customuser',
            name='google_access_token',
        ),
        migrations.RemoveField(
            model_name='customuser',
            name='google_refresh_token',
        ),
    ]
