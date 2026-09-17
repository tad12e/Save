from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .olap_engine import DuckDBAnalyticsEngine
from .serializers import CardMetricSerializer, NotificationSerializer
from .services import DashboardAnalyticsService


class FullAnalyticsView(APIView):
    """
    Columnar OLAP Analytics Endpoint backed by DuckDB and Redis Caching.
    Returns complete multi-dimensional analytics:
    - 52-week activity contribution grid
    - Hourly distribution (6am-11pm) and peak saving window
    - Weekday vs weekend rhythm curve
    - 4-stage opportunity outcome funnel
    - 10-axis knowledge radar polygon
    - Content distribution donut & popular tags ranking
    - Executive KPIs, active streak & momentum velocity
    """
    permission_classes = [AllowAny]

    def get(self, request):
        timeframe = request.query_params.get('period', 'this_week')
        force_refresh = request.query_params.get('refresh', 'false').lower() == 'true'
        intent = request.query_params.get('intent', 'all')
        destination = request.query_params.get('destination', 'all')

        if not request.user or not request.user.is_authenticated:
            # Fallback demo analytics for guest users
            from django.contrib.auth import get_user_model
            User = get_user_model()
            demo_user = User.objects.first()
            if demo_user:
                data = DuckDBAnalyticsEngine.get_full_analytics(
                    demo_user, timeframe, force_refresh, intent=intent, destination=destination
                )
                return Response(data, status=status.HTTP_200_OK)
            return Response(
                {"error": "Authentication required to view analytics."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        data = DuckDBAnalyticsEngine.get_full_analytics(
            request.user, timeframe, force_refresh, intent=intent, destination=destination
        )
        return Response(data, status=status.HTTP_200_OK)


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


class ExtractDeadlineView(APIView):
    """
    AI-Powered Deadline & Opportunity Extraction Endpoint.
    Uses Gemini 1.5 Flash (Free Tier) with constrained Pydantic schema
    and zero-network Regex Quota Fallback.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        title = str(request.data.get('title', '')).strip()
        selected_text = str(request.data.get('selected_text', '')).strip()
        url = str(request.data.get('url', '')).strip()
        user_deadline = request.data.get('user_deadline')
        content_type = str(request.data.get('content_type', 'job')).strip()

        from .deadline_extractor import AIDeadlineExtractor
        result = AIDeadlineExtractor.extract(
            title=title,
            selected_text=selected_text,
            url=url,
            user_deadline=user_deadline,
            content_type=content_type,
        )

        return Response(result.model_dump(), status=status.HTTP_200_OK)
