from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import api_key_views
from .views import (
    GoogleAuthView,
    LogoutView,
    ResendOTPView,
    SigninView,
    SignupView,
    UserMeView,
    UserSettingsView,
    VerifyOTPView,
)

app_name = 'users'

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('register/', SignupView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('signin/', SigninView.as_view(), name='signin'),
    path('login/', SigninView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', UserMeView.as_view(), name='me'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('social/google/', GoogleAuthView.as_view(), name='google-auth'),
    path('google/', GoogleAuthView.as_view(), name='google-auth-alias'),
    path('api-keys/', api_key_views.ApiKeyListCreateView.as_view(), name='api-key-list-create'),
    path('api-keys/<uuid:key_id>/', api_key_views.ApiKeyDetailView.as_view(), name='api-key-detail'),
    path('settings/', UserSettingsView.as_view(), name='user-settings'),
]
