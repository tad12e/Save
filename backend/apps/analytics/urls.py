from django.urls import path
from .views import (
    DashboardCardsView,
    ExtractDeadlineView,
    FullAnalyticsView,
    NotificationListView,
    NotificationMarkReadView,
)

urlpatterns = [
    path('full/', FullAnalyticsView.as_view(), name='analytics-full'),
    path('extract-deadline/', ExtractDeadlineView.as_view(), name='analytics-extract-deadline'),
    path('cards/', DashboardCardsView.as_view(), name='analytics-cards'),
    path('notifications/', NotificationListView.as_view(), name='analytics-notifications'),
    path('notifications/<uuid:pk>/read/', NotificationMarkReadView.as_view(), name='analytics-notification-read'),
]
