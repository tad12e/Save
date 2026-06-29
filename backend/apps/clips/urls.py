from django.urls import path

from .views import ClipCreateView

app_name = 'clips'

urlpatterns = [
    path('', ClipCreateView.as_view(), name='clip-create'),
]
