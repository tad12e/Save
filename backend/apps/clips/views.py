from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ClipCreateSerializer, ClipSerializer


class ClipCreateView(APIView):
    """
    POST /api/clips/

    Accepts a URL (and optional selected_text) from the Chrome extension,
    persists the clip immediately, and kicks off a Celery background job
    to scrape + process the content.

    Auth: JWT required (default DRF permission).
    """

    def post(self, request):
        serializer = ClipCreateSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        clip = serializer.save()

        response_serializer = ClipSerializer(clip)
        http_status = (
            status.HTTP_200_OK if getattr(clip, 'duplicate', False)
            else status.HTTP_201_CREATED
        )
        return Response(response_serializer.data, status=http_status)
