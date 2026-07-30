from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Destination
from .serializers import DestinationCreateSerializer, DestinationSerializer


class DestinationListCreateView(APIView):
    def get(self, request):
        destinations = Destination.objects.filter(user=request.user, is_active=True)
        return Response(DestinationSerializer(destinations, many=True).data)

    def post(self, request):
        serializer = DestinationCreateSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        destination = serializer.save()
        return Response(
            DestinationSerializer(destination).data,
            status=status.HTTP_201_CREATED,
        )


class DestinationDetailView(APIView):
    def get_object(self, request, destination_id):
        return Destination.objects.get(pk=destination_id, user=request.user)

    def patch(self, request, destination_id):
        destination = self.get_object(request, destination_id)
        serializer = DestinationCreateSerializer(
            destination,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        destination = serializer.save()
        return Response(DestinationSerializer(destination).data)

    def delete(self, request, destination_id):
        destination = self.get_object(request, destination_id)
        destination.is_active = False
        destination.is_default = False
        destination.save(update_fields=['is_active', 'is_default'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class DestinationSetDefaultView(APIView):
    def post(self, request, destination_id):
        destination = Destination.objects.get(pk=destination_id, user=request.user, is_active=True)
        destination.is_default = True
        destination.save(update_fields=['is_default'])
        return Response(DestinationSerializer(destination).data)
