from datetime import timedelta
from django.utils import timezone
from apps.clips.models import Clip
from apps.destinations.models import Destination


class DashboardAnalyticsService:
    TOTAL_AVAILABLE_DESTINATIONS = 8

    @classmethod
    def get_cards_data(cls, user):
        """
        Calculates and returns metrics for the 4 core dashboard cards:
        1. Total clips (with net trend sublabel)
        2. This week (last 7 days vs previous 7 days)
        3. Expiring soon (deadlines within 7 days)
        4. Destinations active (active connected vs total available)
        """
        now = timezone.now()
        today = timezone.localdate()
        seven_days_ago = now - timedelta(days=7)
        fourteen_days_ago = now - timedelta(days=14)
        next_7_days = today + timedelta(days=7)

        # Scoped user querysets
        user_clips = Clip.objects.filter(user=user)
        user_destinations = Destination.objects.filter(user=user, is_active=True)

        # --- 1. Total clips & weekly trend ---
        total_clips = user_clips.count()
        clips_this_week = user_clips.filter(created_at__gte=seven_days_ago).count()
        clips_last_week = user_clips.filter(
            created_at__gte=fourteen_days_ago,
            created_at__lt=seven_days_ago
        ).count()
        
        trend_diff = clips_this_week - clips_last_week
        trending_up = trend_diff >= 0
        
        # Sub-label: "+12 this week" in green or "-3 this week" in red
        if trending_up:
            total_sub_label = f"+{clips_this_week} this week"
            total_trend_color = "green"
        else:
            total_sub_label = f"{trend_diff} this week"
            total_trend_color = "red"

        card_total_clips = {
            "id": "total_clips",
            "title": "Total Clips",
            "value": total_clips,
            "sub_label": total_sub_label,
            "trend": "up" if trending_up else "down",
            "trend_diff": trend_diff,
            "color": total_trend_color,
            "target_url": "/clips",
        }

        # --- 2. This week (vs previous week) ---
        week_diff = clips_this_week - clips_last_week
        week_trend = "up" if week_diff >= 0 else "down"

        card_this_week = {
            "id": "this_week",
            "title": "This Week",
            "value": clips_this_week,
            "sub_label": f"vs {clips_last_week} last week",
            "trend": week_trend,
            "diff": week_diff,
            "last_week_value": clips_last_week,
            "target_url": "/clips?filter=this_week",
        }

        # --- 3. Expiring soon (in the next 7 days) ---
        # Clips with deadline_date between today and today + 7 days
        expiring_clips_qs = user_clips.filter(
            deadline_date__isnull=False,
            deadline_date__gte=today,
            deadline_date__lte=next_7_days,
        )
        expiring_count = expiring_clips_qs.count()
        is_alert = expiring_count > 0

        card_expiring_soon = {
            "id": "expiring_soon",
            "title": "Expiring Soon",
            "value": expiring_count,
            "sub_label": "act before they disappear",
            "color": "red" if is_alert else "default",
            "is_alert": is_alert,
            "target_url": "/clips?sort=deadline_asc",
        }

        # --- 4. Destinations active ---
        active_destinations_count = user_destinations.count()
        total_available = cls.TOTAL_AVAILABLE_DESTINATIONS

        card_destinations_active = {
            "id": "destinations_active",
            "title": "Destinations Active",
            "value": active_destinations_count,
            "total_available": total_available,
            "sub_label": f"of {total_available} available",
            "target_url": "/connections",
        }

        return {
            "cards": [
                card_total_clips,
                card_this_week,
                card_expiring_soon,
                card_destinations_active,
            ],
            "card_dict": {
                "total_clips": card_total_clips,
                "this_week": card_this_week,
                "expiring_soon": card_expiring_soon,
                "destinations_active": card_destinations_active,
            }
        }
