from django.urls import path

from .views import DestinationDetailView, DestinationListCreateView, DestinationSetDefaultView

app_name = 'destinations'

urlpatterns = [
    path('', DestinationListCreateView.as_view(), name='destination-list-create'),
    path('<uuid:destination_id>/', DestinationDetailView.as_view(), name='destination-detail'),
    path('<uuid:destination_id>/set-default/', DestinationSetDefaultView.as_view(), name='destination-set-default'),
]
