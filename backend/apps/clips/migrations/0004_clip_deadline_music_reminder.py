from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clips', '0003_clip_embedding'),
    ]

    operations = [
        migrations.AddField(
            model_name='clip',
            name='deadline_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='clip',
            name='music_embed_url',
            field=models.URLField(blank=True, max_length=2048),
        ),
        migrations.AddField(
            model_name='clip',
            name='reminder_sent',
            field=models.BooleanField(default=False),
        ),
    ]
