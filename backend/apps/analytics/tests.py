from datetime import timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.clips.models import Clip
from apps.destinations.models import Destination
from apps.analytics.services import DashboardAnalyticsService
from apps.analytics.models import Notification

User = get_user_model()


class DashboardAnalyticsServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='analyst@save.app',
            password='TestPassword123!',
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_total_clips_and_trend(self):
        now = timezone.now()
        # Create 3 clips this week
        for i in range(3):
            c = Clip.objects.create(
                user=self.user,
                url=f'https://example.com/{i}',
                url_hash=f'hash_{i}',
            )

        cards = DashboardAnalyticsService.get_cards_data(self.user)['card_dict']
        total_card = cards['total_clips']
        self.assertEqual(total_card['value'], 3)
        self.assertEqual(total_card['trend'], 'up')
        self.assertEqual(total_card['sub_label'], '+3 this week')
        self.assertEqual(total_card['color'], 'green')
        self.assertEqual(total_card['target_url'], '/clips')

    def test_this_week_metric(self):
        now = timezone.now()
        # 2 clips this week
        for i in range(2):
            Clip.objects.create(
                user=self.user,
                url=f'https://example.com/tw_{i}',
                url_hash=f'tw_{i}',
            )

        cards = DashboardAnalyticsService.get_cards_data(self.user)['card_dict']
        this_week_card = cards['this_week']
        self.assertEqual(this_week_card['value'], 2)
        self.assertEqual(this_week_card['sub_label'], 'vs 0 last week')
        self.assertEqual(this_week_card['target_url'], '/clips?filter=this_week')

    def test_expiring_soon_metric(self):
        today = timezone.localdate()
        # 1 clip expiring in 3 days
        Clip.objects.create(
            user=self.user,
            url='https://example.com/deadline',
            url_hash='dl_hash',
            deadline_date=today + timedelta(days=3),
        )
        # 1 clip expiring in 20 days (outside next 7 days window)
        Clip.objects.create(
            user=self.user,
            url='https://example.com/far_deadline',
            url_hash='far_hash',
            deadline_date=today + timedelta(days=20),
        )

        cards = DashboardAnalyticsService.get_cards_data(self.user)['card_dict']
        expiring_card = cards['expiring_soon']
        self.assertEqual(expiring_card['value'], 1)
        self.assertTrue(expiring_card['is_alert'])
        self.assertEqual(expiring_card['color'], 'red')
        self.assertEqual(expiring_card['sub_label'], 'act before they disappear')
        self.assertEqual(expiring_card['target_url'], '/clips?sort=deadline_asc')

    def test_destinations_active_metric(self):
        Destination.objects.create(
            user=self.user,
            name='Test Sheets',
            provider='google_sheets',
            is_active=True,
        )
        Destination.objects.create(
            user=self.user,
            name='Inactive Notion',
            provider='notion',
            is_active=False,
        )

        cards = DashboardAnalyticsService.get_cards_data(self.user)['card_dict']
        dest_card = cards['destinations_active']
        self.assertEqual(dest_card['value'], 1)
        self.assertEqual(dest_card['sub_label'], 'of 8 available')
        self.assertEqual(dest_card['target_url'], '/connections')

    def test_cards_api_endpoint(self):
        response = self.client.get('/api/analytics/cards/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('cards', response.data)
        self.assertEqual(len(response.data['cards']), 4)
