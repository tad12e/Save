from django.urls import path
from .views import (
    DestinationDetailView,
    DestinationListCreateView,
    DestinationSetDefaultView,
    DestinationAuthorizeView,
    DestinationTestPingView,
    GoogleOAuthCallbackView,
    SpotifyOAuthCallbackView,
    SpotifyPlaylistsView,
    SpotifyTrackActionView,
    SpotifySearchTrackView,
    SetMusicProviderView,
    CategoryRoutingRulesView,
)

app_name = 'destinations'

urlpatterns = [
    path('', DestinationListCreateView.as_view(), name='destination-list-create'),
    path('authorize/', DestinationAuthorizeView.as_view(), name='destination-authorize'),
    path('category-rules/', CategoryRoutingRulesView.as_view(), name='category-rules'),
    path('set-music-provider/', SetMusicProviderView.as_view(), name='set-music-provider'),
    path('oauth/callback/google/', GoogleOAuthCallbackView.as_view(), name='google-oauth-callback'),
    path('oauth/callback/spotify/', SpotifyOAuthCallbackView.as_view(), name='spotify-oauth-callback'),
    path('spotify/playlists/', SpotifyPlaylistsView.as_view(), name='spotify-playlists'),
    path('spotify/add-track/', SpotifyTrackActionView.as_view(), name='spotify-add-track'),
    path('spotify/search/', SpotifySearchTrackView.as_view(), name='spotify-search-track'),
    path('<uuid:destination_id>/', DestinationDetailView.as_view(), name='destination-detail'),
    path('<uuid:destination_id>/set-default/', DestinationSetDefaultView.as_view(), name='destination-set-default'),
    path('<uuid:destination_id>/test/', DestinationTestPingView.as_view(), name='destination-test-ping'),
]


