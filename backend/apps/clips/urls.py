from django.urls import path

from .views import ClipCreateView, ClipDetailView

app_name = 'clips'

urlpatterns = [
    path('', ClipCreateView.as_view(), name='clip-create'),
    path('<uuid:clip_id>/', ClipDetailView.as_view(), name='clip-detail'),
]
