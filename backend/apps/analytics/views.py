from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import CardMetricSerializer, NotificationSerializer
from .services import DashboardAnalyticsService


class DashboardCardsView(APIView):
    """
    Returns the 4 core metric cards for the dashboard:
    1. Total clips (with up/down weekly trend)
    2. This week (vs last week)
    3. Expiring soon (next 7 days)
    4. Destinations active (of 8 available)
    """
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required to view dashboard metrics."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        data = DashboardAnalyticsService.get_cards_data(request.user)
        return Response(data, status=status.HTTP_200_OK)


class NotificationListView(APIView):
    """
    Lists notifications for the authenticated user.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        notifications = Notification.objects.filter(user=request.user)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationMarkReadView(APIView):
    """
    Marks a specific notification as read.
    """
    permission_classes = [AllowAny]

    def post(self, request, pk):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        notification = Notification.objects.filter(pk=pk, user=request.user).first()
        if not notification:
            return Response(
                {"error": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({"status": "success", "is_read": True}, status=status.HTTP_200_OK)
