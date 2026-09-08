from django.urls import path

from . import import_views
from .views import (
    ClipContentView,
    ClipCreateView,
    ClipDetailView,
    ClipClustersView,
    CustomPageListCreateView,
    CustomPageDetailView,
    DashboardView,
    SimilaritySearchView,
    github_selection_save,
    AudioRecognizeView,
)

app_name = 'clips'

urlpatterns = [
    path('', ClipCreateView.as_view(), name='clip-create'),
    path('dashboard/', DashboardView.as_view(), name='clip-dashboard'),
    path('clusters/', ClipClustersView.as_view(), name='clip-clusters'),
    path('pages/', CustomPageListCreateView.as_view(), name='custom-page-list-create'),
    path('pages/<uuid:pk>/', CustomPageDetailView.as_view(), name='custom-page-detail'),
    path('similar/', SimilaritySearchView.as_view(), name='clip-similar'),
    path('recognize-audio/', AudioRecognizeView.as_view(), name='recognize-audio'),
    path('github-selection/', github_selection_save, name='github-selection-save'),
    # Bulk Import endpoints
    path('import/upload/', import_views.BulkImportUploadView.as_view(), name='bulk-import-upload'),
    path('import/history/', import_views.BulkImportHistoryView.as_view(), name='bulk-import-history'),
    path('import/<uuid:job_id>/', import_views.BulkImportStatusView.as_view(), name='bulk-import-status'),
    # Individual clip endpoints
    path('<uuid:clip_id>/', ClipDetailView.as_view(), name='clip-detail'),
    path('<uuid:clip_id>/content/', ClipContentView.as_view(), name='clip-content'),
]

