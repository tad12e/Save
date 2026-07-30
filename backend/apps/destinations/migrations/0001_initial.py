from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_alter_otp_max_length_for_hash'),
    ]

    operations = [
        migrations.CreateModel(
            name='Destination',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('provider', models.CharField(choices=[('notion', 'Notion'), ('google_sheets', 'Google Sheets')], max_length=32)),
                ('name', models.CharField(max_length=255)),
                ('config', models.JSONField(blank=True, default=dict)),
                ('is_default', models.BooleanField(default=False)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='destinations', to='users.customuser')),
            ],
            options={
                'ordering': ['-is_default', 'name'],
                'unique_together': {('user', 'name')},
            },
        ),
    ]
