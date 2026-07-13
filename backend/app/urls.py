from django.contrib import admin
from django.urls import path, include

from api.views import HealthView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('health/', HealthView.as_view(), name='health'),
]
