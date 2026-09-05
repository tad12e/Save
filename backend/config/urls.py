"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    # Versioned v1 API paths (primary namespace)
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/users/', include(('apps.users.urls', 'users-v1'), namespace='users-v1')),
    path('api/v1/clips/', include('apps.clips.urls')),
    path('api/v1/destinations/', include('apps.destinations.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
    # Legacy aliases
    path('api/auth/', include(('apps.users.urls', 'users-legacy'), namespace='users-legacy')),
    path('api/users/', include(('apps.users.urls', 'users-legacy-2'), namespace='users-legacy-2')),
    path('api/clips/', include(('apps.clips.urls', 'clips-legacy'), namespace='clips-legacy')),
    path('api/destinations/', include(('apps.destinations.urls', 'destinations-legacy'), namespace='destinations-legacy')),
    path('api/analytics/', include(('apps.analytics.urls', 'analytics-legacy'), namespace='analytics-legacy')),
    path('api/dashboard/', include(('apps.analytics.urls', 'dashboard-legacy'), namespace='dashboard-legacy')),
]
