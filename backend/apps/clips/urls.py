from django.urls import path

from .views import (
    ClipCreateView,
    ClipDetailView,
    DashboardView,
    SimilaritySearchView,
    github_selection_save,
)

app_name = 'clips'

urlpatterns = [
    path('', ClipCreateView.as_view(), name='clip-create'),
    path('dashboard/', DashboardView.as_view(), name='clip-dashboard'),
    path('similar/', SimilaritySearchView.as_view(), name='clip-similar'),
    path('github-selection/', github_selection_save, name='github-selection-save'),
    path('<uuid:clip_id>/', ClipDetailView.as_view(), name='clip-detail'),
]
