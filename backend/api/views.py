import os
import re
import json
import time as _time

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.models import User
from django.db import connection
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from openai import OpenAI
try:
    from sarvamai import SarvamAI as _SarvamAI
except ImportError:
    _SarvamAI = None

from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django_ratelimit.decorators import ratelimit

from .models import Profile, Building, Event, LostItem, Survey, Waitlist
from .routing import compute_route, CAMPUS_NODES
from .serializers import (
    BuildingSerializer,
    ChangePasswordSerializer,
    EventSerializer,
    LostItemSerializer,
    ProfileSerializer,
    RegisterSerializer,
    SurveySerializer,
    UserSerializer,
    WaitlistSerializer,
)


# ══════════════════════════════════════════════════════════════════════════
# Health
# ══════════════════════════════════════════════════════════════════════════

class HealthView(APIView):
    """
    GET /health/  (and /api/health/)
    Liveness/readiness probe. Public, unauthenticated, and never rate-limited.
    Verifies database connectivity and reports deployed app metadata.
    """
    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()  # bypass DRF auth entirely

    def get(self, request):
        db_ok = True
        try:
            connection.ensure_connection()
            connection.cursor().execute("SELECT 1")
        except Exception:
            db_ok = False

        payload = {
            'status':    'ok' if db_ok else 'degraded',
            'database':  'connected' if db_ok else 'unavailable',
            'env':       os.getenv('DJANGO_ENV', 'development'),
            'version':   getattr(settings, 'REST_FRAMEWORK', {}).get('VERSION', '1.0.0'),
            'timestamp': _time.strftime('%Y-%m-%dT%H:%M:%SZ', _time.gmtime()),
        }
        return Response(payload, status=status.HTTP_200_OK if db_ok else status.HTTP_503_SERVICE_UNAVAILABLE)


# ══════════════════════════════════════════════════════════════════════════
# Auth
# ══════════════════════════════════════════════════════════════════════════

@method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True), name='dispatch')
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer


@method_decorator(ratelimit(key='ip', rate='10/m', method='POST', block=True), name='dispatch')
class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access':  str(refresh.access_token),
                'user':    UserSerializer(user).data,
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class MeView(APIView):
    """GET /auth/me/ — returns the authenticated user + their profile."""

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    """POST /auth/change-password/"""

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password updated successfully.'})


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET / PATCH  /profile/"""
    serializer_class = ProfileSerializer

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile


class PasswordResetRequestView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        form = PasswordResetForm({'email': email})
        if form.is_valid():
            form.save(
                request=request,
                use_https=not settings.DEBUG,
                from_email=settings.DEFAULT_FROM_EMAIL,
                email_template_name='registration/password_reset_email.html',
            )
            return Response({'message': 'If that email exists you will receive a reset link.'})
        return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)


# ══════════════════════════════════════════════════════════════════════════
# Buildings
# ══════════════════════════════════════════════════════════════════════════

@method_decorator(ratelimit(key='ip', rate='30/m', method='GET', block=True), name='dispatch')
class BuildingListView(generics.ListAPIView):
    """
    GET /buildings/
    Query params: q (text search), category, tags (comma-separated)
    """
    serializer_class = BuildingSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        qs = Building.objects.all().order_by('name')
        q        = self.request.query_params.get('q', '').strip()
        category = self.request.query_params.get('category', '').strip()
        tags_raw = self.request.query_params.get('tags', '').strip()

        if q:
            qs = qs.filter(
                Q(name__icontains=q)        |
                Q(code__icontains=q)        |
                Q(description__icontains=q) |
                Q(tags__icontains=q)
            )
        if category and category != 'all':
            qs = qs.filter(category=category)
        if tags_raw:
            for tag in tags_raw.split(','):
                tag = tag.strip()
                if tag:
                    qs = qs.filter(tags__icontains=tag)
        return qs


class BuildingDetailView(generics.RetrieveAPIView):
    """GET /buildings/<pk-or-code>/

    Accepts either the numeric primary key (used by lists/maps) or the
    building `code` slug (used by the AI assistant and QR codes, which return
    routing-node slugs such as "library-complex").
    """
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer

    def get_object(self):
        lookup = self.kwargs[self.lookup_url_kwarg or 'pk']
        if str(lookup).isdigit():
            return get_object_or_404(Building, pk=int(lookup))
        return get_object_or_404(Building, code=lookup)
    permission_classes = (permissions.AllowAny,)


class BuildingSearchView(generics.ListAPIView):
    """
    GET /buildings/search/?q=...
    Convenience alias — identical logic to BuildingListView but always
    requires `q` and never paginates (returns up to 20 results).
    """
    serializer_class = BuildingSerializer
    permission_classes = (permissions.AllowAny,)
    pagination_class = None  # override global paginator for instant search

    def get_queryset(self):
        q        = self.request.query_params.get('q', '').strip()
        category = self.request.query_params.get('category', '').strip()

        qs = Building.objects.all().order_by('name')
        if q:
            qs = qs.filter(
                Q(name__icontains=q) |
                Q(code__icontains=q) |
                Q(description__icontains=q) |
                Q(tags__icontains=q)
            )
        if category and category != 'all':
            qs = qs.filter(category=category)
        return qs[:20]


# ══════════════════════════════════════════════════════════════════════════
# Events
# ══════════════════════════════════════════════════════════════════════════

class IsAdminOrReadOnly(permissions.BasePermission):
    """Read-only for everyone; write access only for staff/admin."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class EventViewSet(viewsets.ModelViewSet):
    """
    GET    /events/              — list (public, supports ?q=&category=)
    POST   /events/              — create (admin only)
    GET    /events/<id>/         — detail (public)
    PATCH  /events/<id>/         — partial update (admin only)
    PUT    /events/<id>/         — full update (admin only)
    DELETE /events/<id>/         — delete (admin only)
    """
    serializer_class = EventSerializer
    permission_classes = (IsAdminOrReadOnly,)

    def get_queryset(self):
        qs       = Event.objects.select_related('building').order_by('date_label', 'start_time')
        q        = self.request.query_params.get('q', '').strip()
        category = self.request.query_params.get('category', '').strip()

        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(description__icontains=q) |
                Q(location_name__icontains=q)
            )
        if category and category != 'all':
            qs = qs.filter(category=category)
        return qs


# ══════════════════════════════════════════════════════════════════════════
# Lost & Found
# ══════════════════════════════════════════════════════════════════════════

class LostItemPermission(permissions.BasePermission):
    """
    • Anyone can GET list / retrieve.
    • Anyone (incl. unauthenticated) can POST (guest reports).
    • PATCH / DELETE only by the item owner or staff.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # Staff can always modify
        if request.user and request.user.is_staff:
            return True
        # Owner can modify their own items
        return obj.user is not None and obj.user == request.user


@method_decorator(ratelimit(key='ip', rate='30/m', method='GET',  block=True), name='dispatch')
@method_decorator(ratelimit(key='ip', rate='10/m', method='POST', block=True), name='dispatch')
class LostItemViewSet(viewsets.ModelViewSet):
    """
    GET    /lost-items/          — list all (public)
    POST   /lost-items/          — create (public, guest-friendly)
    GET    /lost-items/<id>/     — detail (public)
    PATCH  /lost-items/<id>/     — update status/contact (owner or staff)
    PUT    /lost-items/<id>/     — full update (owner or staff)
    DELETE /lost-items/<id>/     — delete (owner or staff)
    """
    serializer_class = LostItemSerializer
    permission_classes = (LostItemPermission,)

    def get_queryset(self):
        qs     = LostItem.objects.select_related('building').order_by('-reported_at')
        status = self.request.query_params.get('status', '').strip()
        q      = self.request.query_params.get('q', '').strip()

        if status in ('lost', 'found'):
            qs = qs.filter(status=status)
        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(location_name__icontains=q) |
                Q(description__icontains=q)
            )
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


# ══════════════════════════════════════════════════════════════════════════
# Campus aggregate
# ══════════════════════════════════════════════════════════════════════════

class CampusView(APIView):
    """
    GET /campus/
    Returns {buildings, events, lostItems, updatedAt} in one shot.
    Matches the CachedCampusData shape the mobile app expects.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        buildings  = Building.objects.all().order_by('name')
        events     = Event.objects.select_related('building').order_by('date_label', 'start_time')
        lost_items = LostItem.objects.select_related('building').order_by('-reported_at')

        return Response({
            'buildings':  BuildingSerializer(buildings,  many=True, context={'request': request}).data,
            'events':     EventSerializer(events,        many=True, context={'request': request}).data,
            'lostItems':  LostItemSerializer(lost_items, many=True, context={'request': request}).data,
            'updatedAt':  _time.strftime('%Y-%m-%dT%H:%M:%SZ', _time.gmtime()),
        })


# ══════════════════════════════════════════════════════════════════════════
# Route
# ══════════════════════════════════════════════════════════════════════════

class RouteView(APIView):
    """
    GET /route/?orig_lat=&orig_lon=&dest_lat=&dest_lon=
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        try:
            orig_lat = float(request.query_params['orig_lat'])
            orig_lon = float(request.query_params['orig_lon'])
            dest_lat = float(request.query_params['dest_lat'])
            dest_lon = float(request.query_params['dest_lon'])
        except (KeyError, ValueError):
            return Response(
                {'error': 'Required query params: orig_lat, orig_lon, dest_lat, dest_lon'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(compute_route(orig_lat, orig_lon, dest_lat, dest_lon))


# ══════════════════════════════════════════════════════════════════════════
# Survey / Waitlist
# ══════════════════════════════════════════════════════════════════════════

class SurveyCreateView(generics.CreateAPIView):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer


class WaitlistCreateView(generics.CreateAPIView):
    queryset = Waitlist.objects.all()
    serializer_class = WaitlistSerializer
    permission_classes = (permissions.AllowAny,)

    def create(self, request, *args, **kwargs):
        email = (request.data or {}).get('email')
        existing = Waitlist.objects.filter(email__iexact=email).first() if email else None
        if existing is not None:
            serializer = self.get_serializer(existing)
            return Response(
                {**serializer.data, 'detail': 'This email is already on the waitlist.'},
                status=status.HTTP_200_OK,
            )
        return super().create(request, *args, **kwargs)


# ══════════════════════════════════════════════════════════════════════════
# AI Chat
# ══════════════════════════════════════════════════════════════════════════

AI_PROVIDER      = os.getenv('AI_PROVIDER', 'openai')          # 'openai' | 'sarvam'
AI_API_KEY       = os.getenv('AI_API_KEY')                        # OpenAI key
AI_BASE_URL      = os.getenv('AI_BASE_URL', 'https://api.openai.com/v1')
AI_MODEL         = os.getenv('AI_MODEL', 'gpt-4o-mini')
AI_SARVAM_KEY    = os.getenv('AI_SUBSCRIPTION_KEY') or os.getenv('AI_API_KEY')
AI_SARVAM_MODEL  = os.getenv('AI_MODEL', 'sarvam-105b')

_ai_client  = None   # OpenAI-compatible client
_sarvam_client = None  # SarvamAI client

if AI_PROVIDER == 'sarvam' and AI_SARVAM_KEY and _SarvamAI:
    _sarvam_client = _SarvamAI(api_subscription_key=AI_SARVAM_KEY)
elif AI_API_KEY:
    _ai_client = OpenAI(api_key=AI_API_KEY, base_url=AI_BASE_URL)

_ctx_cache: dict = {'text': None, 'ts': 0.0}
_CTX_TTL = 60


def _build_building_lines() -> str:
    from .routing import nearest_node
    lines = []
    for b in Building.objects.only('name', 'code', 'category', 'description', 'latitude', 'longitude'):
        slug = nearest_node(b.latitude, b.longitude)
        desc = b.description[:80].rstrip()
        lines.append(f'- {slug} (code:{b.code}): {b.name} ({b.category}) - {desc}')
    return '\n'.join(lines)


def build_building_context(follow_up_context=None) -> str:
    now = _time.monotonic()
    if _ctx_cache['text'] is None or (now - _ctx_cache['ts']) > _CTX_TTL:
        try:
            building_lines = _build_building_lines()
        except Exception:
            building_lines = _ctx_cache.get('text') or '- (building data temporarily unavailable)'
        _ctx_cache['text'] = building_lines
        _ctx_cache['ts']   = now

    context_section = ''
    if follow_up_context and follow_up_context.get('building_id'):
        b_name = follow_up_context.get('building_name', follow_up_context['building_id'])
        context_section = (
            f"\n\nCONVERSATION CONTEXT: The user was most recently talking about "
            f"'{b_name}' (id: {follow_up_context['building_id']}). "
            "Resolve relative references such as 'there', 'near there', 'from there' against this building."
        )

    return (
        "PathFindr is a campus navigation app for LASUSTECH "
        "(Lagos State University of Science and Technology).\n"
        "Campus buildings:\n" + _ctx_cache['text'] + context_section + "\n\n"
        "You are a helpful, concise campus navigation assistant.\n"
        "Rules:\n"
        "1. Navigate intent → return JSON: "
        '{"intent":"navigate","building_id":"<slug>","response":"<message>",'
        '"follow_up_context":{"building_id":"<slug>","building_name":"<Name>"}}\n'
        "2. Info intent → return JSON: "
        '{"intent":"info","building_id":"<slug>","response":"<description>",'
        '"follow_up_context":{"building_id":"<slug>","building_name":"<Name>"}}\n'
        "3. General → return JSON: "
        '{"intent":"general","response":"<answer>"}\n'
        "Always respond in valid JSON only."
    )


_COURSE_CODE_RE = re.compile(r'\b([A-Z]{2,4})\s*(\d{3})\b', re.IGNORECASE)


def resolve_course_codes(text: str) -> list:
    from .models import CourseBuilding
    from .routing import nearest_node
    results, seen = [], set()
    for m in _COURSE_CODE_RE.finditer(text):
        raw = f"{m.group(1).upper()} {m.group(2)}"
        if raw in seen:
            continue
        seen.add(raw)
        try:
            cb   = CourseBuilding.objects.select_related('building').get(course_code=raw)
            slug = nearest_node(cb.building.latitude, cb.building.longitude)
            results.append({
                'course_code':   raw,
                'building_id':   slug,
                'building_name': cb.building.name,
                'building_code': cb.building.code,
            })
        except Exception:
            pass
    return results


@method_decorator(ratelimit(key='ip', rate='10/m', method='POST', block=True), name='dispatch')
class AIChatView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        user_message     = request.data.get('message', '')
        history          = request.data.get('messages', [])
        follow_up_context = request.data.get('follow_up_context') or None

        course_hints    = resolve_course_codes(user_message)
        augmented_msg   = user_message
        if course_hints:
            hints = '; '.join(
                f"{h['course_code']} is at {h['building_name']} (id:{h['building_id']})"
                for h in course_hints
            )
            augmented_msg = f"{user_message}\n[System hint: {hints}]"

        ai_resp = self._call_llm(history, augmented_msg, follow_up_context)
        if ai_resp is not None:
            return Response(ai_resp)

        # LLM unavailable/unusable — fall back to deterministic campus routing.
        return Response(self._rule_based_reply(user_message, follow_up_context, course_hints))

    # ── Helpers ────────────────────────────────────────────────────────────
    def _call_llm(self, history, augmented_msg, follow_up_context):
        """Call the LLM and return a normalised dict, or None if unusable."""
        if not (_sarvam_client or _ai_client):
            return None

        system_prompt = build_building_context(follow_up_context)
        llm_messages = [{'role': 'system', 'content': system_prompt}]
        for msg in history[-6:]:
            llm_messages.append({'role': msg['role'], 'content': msg['content']})
        llm_messages.append({'role': 'user', 'content': augmented_msg})

        try:
            if _sarvam_client:
                completion = _sarvam_client.chat.completions(
                    model=AI_SARVAM_MODEL, messages=llm_messages,
                )
            else:
                # OpenAI-compatible SDK (also drives Sarvam's /v1 endpoint).
                # reasoning_effort='low' keeps Sarvam's thinking tokens from
                # eating the whole budget and leaving an empty reply.
                completion = _ai_client.chat.completions.create(
                    model=AI_MODEL,
                    messages=llm_messages,
                    temperature=0.2,
                    max_tokens=2000,
                    response_format={'type': 'json_object'},
                    extra_body={'reasoning_effort': 'low'},
                )
            parsed  = json.loads(completion.choices[0].message.content or '{}')
            content = (parsed.get('response') or '').strip()
            if not content:
                return None

            intent      = parsed.get('intent', 'general')
            building_id = parsed.get('building_id')
            new_ctx     = parsed.get('follow_up_context')

            route_data = None
            if intent == 'navigate' and building_id:
                dest = CAMPUS_NODES.get(building_id)
                if dest:
                    route_data = compute_route(6.4666, 3.5963, dest[0], dest[1])

            return {
                'role':            'assistant',
                'content':         content,
                'buildingId':      building_id,
                'routeData':       route_data,
                'intent':          intent,
                'followUpContext': new_ctx,
            }
        except Exception as exc:
            print(f"[AIChatView] LLM call failed, using fallback: {exc}")
            return None

    def _rule_based_reply(self, user_message, follow_up_context, course_hints):
        """Deterministic campus assistant used when the LLM is unavailable."""
        lower  = user_message.lower()
        origin = (6.4666, 3.5963)

        if course_hints:
            h    = course_hints[0]
            dest = CAMPUS_NODES.get(h['building_id'])
            route = compute_route(*origin, dest[0], dest[1]) if dest else None
            return {
                'role': 'assistant',
                'content': f"{h['course_code']} is taught at {h['building_name']}. Route ready.",
                'buildingId': h['building_id'], 'routeData': route,
                'intent': 'navigate',
                'followUpContext': {'building_id': h['building_id'], 'building_name': h['building_name']},
            }

        KEYWORDS = {
            'library': 'library-complex', 'ict': 'ict-center',
            'engineering': 'engineering-block', 'admin': 'admin-tower',
            'lab': 'science-labs', 'student hub': 'student-hub',
            'restroom': 'student-hub', 'toilet': 'student-hub',
            'wifi': 'student-hub', 'food': 'student-hub',
            'cafeteria': 'student-hub', 'canteen': 'student-hub',
            'activities': 'student-hub',
        }
        INFO_WORDS = ['about', 'what is', 'tell me', 'info', 'facilities',
                      'description', 'where is', 'located', 'details']
        NAV_WORDS  = ['route', 'get to', 'find', 'go to', 'navigate',
                      'direction', 'how do i', 'how to', 'walk']

        matches = [(kw, bid) for kw, bid in KEYWORDS.items() if kw in lower]

        # Follow-up references like "near there" / "from there".
        if not matches and follow_up_context and follow_up_context.get('building_id'):
            if any(p in lower for p in ['near there', 'from there', 'what about', 'parking']):
                matches = [('', follow_up_context['building_id'])]

        # Source -> destination routing, e.g. "from the library to the labs".
        if len(matches) >= 2 and matches[0][1] != matches[-1][1]:
            src_bid, dst_bid = matches[0][1], matches[-1][1]
            src, dst = CAMPUS_NODES.get(src_bid), CAMPUS_NODES.get(dst_bid)
            if src and dst:
                route    = compute_route(src[0], src[1], dst[0], dst[1])
                src_name = Building.objects.filter(code=src_bid).first()
                dst_name = Building.objects.filter(code=dst_bid).first()
                return {
                    'role': 'assistant',
                    'content': (f"Route from {src_name.name if src_name else src_bid} "
                                f"to {dst_name.name if dst_name else dst_bid}: "
                                f"{route.get('distanceMeters', 0)}m, "
                                f"~{route.get('durationMinutes', 1)} min."),
                    'buildingId': dst_bid, 'routeData': route,
                    'intent': 'navigate',
                    'followUpContext': {'building_id': dst_bid,
                                        'building_name': dst_name.name if dst_name else dst_bid},
                }

        if matches:
            bid = matches[-1][1]
            b   = Building.objects.filter(code=bid).first()
            name = b.name if b else bid.replace('-', ' ').title()

            if any(w in lower for w in INFO_WORDS):
                return {
                    'role': 'assistant',
                    'content': f"{name}: {b.description}" if b else f"{name} is on campus.",
                    'buildingId': bid, 'intent': 'info',
                    'followUpContext': {'building_id': bid, 'building_name': name},
                }

            if any(w in lower for w in NAV_WORDS) or bid in [m[1] for m in matches]:
                dest  = CAMPUS_NODES.get(bid)
                route = compute_route(*origin, dest[0], dest[1]) if dest else None
                return {
                    'role': 'assistant',
                    'content': (f"Guiding you to {name}! Route: "
                                f"{route.get('distanceMeters', 0)}m, "
                                f"~{route.get('durationMinutes', 1)} min."),
                    'buildingId': bid, 'routeData': route,
                    'intent': 'navigate',
                    'followUpContext': {'building_id': bid, 'building_name': name},
                }

        if any(w in lower for w in ['hi', 'hello', 'hey', 'good morning',
                                    'good afternoon', 'help']):
            return {
                'role': 'assistant',
                'content': ("Hi! I'm your LASUSTECH campus guide. Ask me to navigate to a "
                            "building (e.g. \"How do I get to the library?\") or tell you about a place."),
                'intent': 'general',
            }

        return {
            'role': 'assistant',
            'content': ("I can help you find and navigate to campus buildings like the library, "
                        "ICT centre, engineering block, admin tower, science labs and student hub. "
                        'Try "How do I get to the library?".'),
            'intent': 'general',
        }

# ── Compatibility alias ───────────────────────────────────────────────────
# urls.py imports EventListView; we expose it as the EventViewSet list action
# so the same ModelViewSet powers both the router and any direct path() usage.
EventListView = EventViewSet.as_view({'get': 'list', 'post': 'create'})
