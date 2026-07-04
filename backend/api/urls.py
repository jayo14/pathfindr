from django.contrib.auth import views as auth_views
from django.urls import path, include

from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from .views import (
    # Auth
    RegisterView,
    LoginView,
    MeView,
    ChangePasswordView,
    ProfileView,
    PasswordResetRequestView,
    # Buildings
    BuildingListView,
    BuildingDetailView,
    BuildingSearchView,
    # Events (ViewSet + alias)
    EventViewSet,
    EventListView,
    # Lost & Found (ViewSet)
    LostItemViewSet,
    # Campus aggregate
    CampusView,
    # Route
    RouteView,
    # Survey / Waitlist
    SurveyCreateView,
    WaitlistCreateView,
    # AI
    AIChatView,
)

# ── Router (ViewSets) ─────────────────────────────────────────────────────
router = DefaultRouter()
router.register(r'events',     EventViewSet,    basename='event')
router.register(r'lost-items', LostItemViewSet, basename='lost-item')

# ── URL patterns ──────────────────────────────────────────────────────────
urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────
    path('auth/register/',         RegisterView.as_view(),         name='register'),
    path('auth/login/',            LoginView.as_view(),            name='login'),
    path('auth/refresh/',          TokenRefreshView.as_view(),     name='token_refresh'),
    path('auth/me/',               MeView.as_view(),               name='me'),
    path('auth/change-password/',  ChangePasswordView.as_view(),   name='change_password'),
    path('auth/password-reset-request/', PasswordResetRequestView.as_view(),
         name='password_reset_request'),

    # Django built-in password-reset flow (email link)
    path('auth/password-reset/',
         auth_views.PasswordResetView.as_view(),      name='password_reset'),
    path('auth/password-reset/done/',
         auth_views.PasswordResetDoneView.as_view(),  name='password_reset_done'),
    path('auth/reset/<uidb64>/<token>/',
         auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('auth/reset/done/',
         auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),

    # ── Profile ────────────────────────────────────────────────────────────
    path('profile/', ProfileView.as_view(), name='profile'),

    # ── Buildings ──────────────────────────────────────────────────────────
    path('buildings/',           BuildingListView.as_view(),   name='buildings'),
    path('buildings/search/',    BuildingSearchView.as_view(), name='building-search'),
    path('buildings/<int:pk>/',  BuildingDetailView.as_view(), name='building-detail'),

    # ── Events (direct path, backed by EventListView alias) ───────────────
    # The router below also registers /events/ and /events/<pk>/ via EventViewSet.
    # The direct path is kept for explicit naming; the router urls take precedence
    # for detail routes.
    path('events/', EventListView, name='events'),

    # ── Campus aggregate (buildings + events + lost-items in one shot) ────
    path('campus/', CampusView.as_view(), name='campus'),

    # ── Route ──────────────────────────────────────────────────────────────
    path('route/', RouteView.as_view(), name='route'),

    # ── Survey / Waitlist ──────────────────────────────────────────────────
    path('surveys/',  SurveyCreateView.as_view(),  name='survey-create'),
    path('waitlist/', WaitlistCreateView.as_view(), name='waitlist'),

    # ── AI ─────────────────────────────────────────────────────────────────
    path('ai/chat/', AIChatView.as_view(), name='ai-chat'),

    # ── API schema / docs ──────────────────────────────────────────────────
    path('schema/', SpectacularAPIView.as_view(),                        name='schema'),
    path('docs/',   SpectacularSwaggerView.as_view(url_name='schema'),   name='swagger-ui'),

    # ── Router-generated routes (events + lost-items ViewSets) ────────────
    path('', include(router.urls)),
]
