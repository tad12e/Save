from django.urls import path
from .views import (
    DestinationDetailView,
    DestinationListCreateView,
    DestinationSetDefaultView,
    DestinationAuthorizeView,
    DestinationTestPingView,
    GoogleOAuthCallbackView,
)

app_name = 'destinations'

urlpatterns = [
    path('', DestinationListCreateView.as_view(), name='destination-list-create'),
    path('authorize/', DestinationAuthorizeView.as_view(), name='destination-authorize'),
    path('oauth/callback/google/', GoogleOAuthCallbackView.as_view(), name='google-oauth-callback'),
    path('<uuid:destination_id>/', DestinationDetailView.as_view(), name='destination-detail'),
    path('<uuid:destination_id>/set-default/', DestinationSetDefaultView.as_view(), name='destination-set-default'),
    path('<uuid:destination_id>/test/', DestinationTestPingView.as_view(), name='destination-test-ping'),
]


