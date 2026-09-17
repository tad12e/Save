# Generated for CustomCategory model

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clips', '0011_custompage_clip_custom_page'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CustomCategory',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('dimension', models.CharField(choices=[('intent', 'Intent'), ('source', 'Source Platform'), ('type', 'Content Type'), ('custom', 'Custom Dimension')], db_index=True, default='intent', max_length=30)),
                ('name', models.CharField(max_length=100)),
                ('slug', models.SlugField(max_length=100)),
                ('color', models.CharField(default='#3B82F6', max_length=32)),
                ('bg_color', models.CharField(default='rgba(59, 130, 246, 0.15)', max_length=64)),
                ('icon_name', models.CharField(default='Tag', max_length=64)),
                ('description', models.CharField(blank=True, default='', max_length=255)),
                ('keywords', models.JSONField(blank=True, default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='custom_categories', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['name'],
                'unique_together': {('user', 'dimension', 'slug')},
            },
        ),
    ]
