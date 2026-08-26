from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import GoogleAuthView, ResendOTPView, SigninView, SignupView, UserMeView, VerifyOTPView

app_name = 'users'

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('register/', SignupView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('signin/', SigninView.as_view(), name='signin'),
    path('login/', SigninView.as_view(), name='login'),
    path('me/', UserMeView.as_view(), name='me'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('social/google/', GoogleAuthView.as_view(), name='google-auth'),
    path('google/', GoogleAuthView.as_view(), name='google-auth-alias'),
]

