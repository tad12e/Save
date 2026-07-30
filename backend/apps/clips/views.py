from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Clip
from .serializers import ClipCreateSerializer, ClipSerializer


class ClipCreateView(APIView):
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


class ClipDetailView(APIView):
    def get(self, request, clip_id):
        clip = Clip.objects.select_related('destination').get(pk=clip_id, user=request.user)
        return Response(ClipSerializer(clip).data)
