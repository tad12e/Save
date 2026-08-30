from django.urls import path
from .views import DashboardCardsView, NotificationListView, NotificationMarkReadView

urlpatterns = [
    path('cards/', DashboardCardsView.as_view(), name='analytics-cards'),
    path('notifications/', NotificationListView.as_view(), name='analytics-notifications'),
    path('notifications/<uuid:pk>/read/', NotificationMarkReadView.as_view(), name='analytics-notification-read'),
]
