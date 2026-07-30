from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('destinations', '0001_initial'),
        ('clips', '0001_create_clip_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='clip',
            name='destination',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='clips',
                to='destinations.destination',
            ),
        ),
        migrations.AddField(
            model_name='clip',
            name='export_error',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='clip',
            name='export_status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('processing', 'Processing'),
                    ('done', 'Done'),
                    ('failed', 'Failed'),
                    ('skipped', 'Skipped'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='clip',
            name='export_url',
            field=models.URLField(blank=True, max_length=2048),
        ),
    ]
