from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from .views import (
    AIChatView,
    PasswordResetRequestView,
    RegisterView, LoginView, ProfileView,
    BuildingListView, EventListView,
    LostItemViewSet, SurveyCreateView, BuildingDetailView, RouteView, WaitlistCreateView
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'lost-items', LostItemViewSet, basename='lost-item')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/password-reset-request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('buildings/', BuildingListView.as_view(), name='buildings'),
    path('buildings/<int:pk>/', BuildingDetailView.as_view(), name='building-detail'),
    path('events/', EventListView.as_view(), name='events'),
    path('surveys/', SurveyCreateView.as_view(), name='survey-create'),
    path('waitlist/', WaitlistCreateView.as_view(), name='waitlist'),
    path('route/', RouteView.as_view(), name='route'),
    path('ai/chat/', AIChatView.as_view(), name='ai-chat'),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('', include(router.urls)),
]
from django.contrib.auth import views as auth_views
from django.urls import path

# Password reset URLs
urlpatterns += [
    path('auth/password-reset/', auth_views.PasswordResetView.as_view(), name='password_reset'),
    path('auth/password-reset/done/', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
    path('auth/reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('auth/reset/done/', auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),
]
