from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clips', '0002_clip_destination_export_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='clip',
            name='embedding',
            field=models.JSONField(blank=True, default=list, null=True),
        ),
    ]
