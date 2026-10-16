"""
Tests for Part 3: Backend API, Serializer & Query Optimization.
Audits Subagent A (DRF Serializers, zero N+1 queries, .defer preservation)
and Subagent B (Postgres composite index audit, CONN_MAX_AGE = 600).
"""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import connection
from django.db.models import Count
from django.test import TestCase

from apps.clips.models import Clip
from apps.clips.serializers import ClipDetailSerializer, ClipSerializer

User = get_user_model()


class SerializerAndQueryAuditTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='auditor@save.app',
            password='testpassword123',
            name='Query Auditor',
        )
        self.clip = Clip.objects.create(
            user=self.user,
            url='https://x.com/karpathy/status/1800000000000000000',
            url_hash='testhash123',
            title='Autonomous Agent Architecture',
            summary='Detailed breakdown of agent loops.',
            raw_content='Very long uncompressed raw web text that should be deferred.',
            source_platform='x_twitter',
            extra_metadata={
                'platform_meta': {
                    'v': 1,
                    'skin': 'x',
                    'handle': '@karpathy',
                    'name': 'Andrej Karpathy',
                    'likes': 5000,
                }
            },
        )

    def test_clip_serializer_exposes_platform_fields(self):
        serializer = ClipSerializer(self.clip)
        data = serializer.data

        self.assertIn('platform_skin', data)
        self.assertEqual(data['platform_skin'], 'x')

        self.assertIn('platform_meta', data)
        self.assertEqual(data['platform_meta']['skin'], 'x')
        self.assertEqual(data['platform_meta']['handle'], '@karpathy')
        self.assertEqual(data['platform_meta']['likes'], 5000)

        # platform_metadata alias present for backwards compatibility
        self.assertIn('platform_metadata', data)
        self.assertEqual(data['platform_metadata'], data['platform_meta'])

        # raw_content MUST NOT be in ClipSerializer (to allow .defer('raw_content'))
        self.assertNotIn('raw_content', data)

    def test_clip_detail_serializer_includes_raw_content_and_platform_meta(self):
        serializer = ClipDetailSerializer(self.clip)
        data = serializer.data

        self.assertIn('platform_skin', data)
        self.assertEqual(data['platform_skin'], 'x')
        self.assertIn('platform_meta', data)
        self.assertIn('raw_content', data)
        self.assertEqual(data['raw_content'], 'Very long uncompressed raw web text that should be deferred.')

    def test_zero_n_plus_one_queries_on_list_serialization(self):
        """Serializing a list of clips should trigger ZERO additional queries."""
        # Create 4 more clips
        for i in range(4):
            Clip.objects.create(
                user=self.user,
                url=f'https://youtube.com/watch?v=video_{i}',
                url_hash=f'hash_{i}',
                title=f'Video {i}',
                source_platform='youtube',
                extra_metadata={
                    'platform_meta': {
                        'v': 1,
                        'skin': 'youtube',
                        'video_id': f'video_{i}',
                    }
                },
            )

        # Re-fetch using standard list view query pattern
        with self.assertNumQueries(1):
            qs = list(
                Clip.objects.filter(user=self.user)
                .defer('raw_content')
                .select_related('destination', 'custom_page', 'parent_clip')
                .annotate(prefetched_child_count=Count('child_clips'))
                .order_by('-created_at')
            )
            # Serialization should not execute any extra DB queries
            serialized_data = ClipSerializer(qs, many=True).data
            self.assertEqual(len(serialized_data), 5)
            for item in serialized_data:
                self.assertIn('platform_skin', item)
                self.assertIn('platform_meta', item)
                self.assertIn('platform_metadata', item)


class PostgresOptimizationAuditTests(TestCase):
    def test_conn_max_age_configured(self):
        """Verify persistent database connections are configured (CONN_MAX_AGE = 600)."""
        db_conf = settings.DATABASES.get('default', {})
        conn_max_age = db_conf.get('CONN_MAX_AGE')
        self.assertEqual(conn_max_age, 600)

    def test_composite_indexes_present_in_model_meta(self):
        """Verify composite indexes exist on the Clip model."""
        index_names = {idx.name for idx in Clip._meta.indexes}
        self.assertIn('clips_clip_user_created_idx', index_names)
        self.assertIn('clips_clip_usr_stat_idx', index_names)
        self.assertIn('clips_clip_usr_plat_idx', index_names)

        # Check field definitions of primary composite index
        user_created_idx = next(idx for idx in Clip._meta.indexes if idx.name == 'clips_clip_user_created_idx')
        self.assertEqual(user_created_idx.fields, ['user', '-created_at'])
