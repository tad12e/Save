from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('clips', '0006_clip_extra_metadata'),
    ]

    operations = [
        # Option A: Pure PostgreSQL JSONField embeddings (zero C-extension dependencies)
    ]
