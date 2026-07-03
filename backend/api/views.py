from .routing import compute_route
from rest_framework.decorators import api_view, permission_classes as pc
from rest_framework.permissions import AllowAny
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.db.models import Q
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import Profile, Building, Event, LostItem, Survey, Waitlist
from .serializers import (
    RegisterSerializer, UserSerializer, ProfileSerializer,
    BuildingSerializer, EventSerializer, LostItemSerializer, SurveySerializer,
    WaitlistSerializer
)

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
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user.profile

@method_decorator(ratelimit(key="ip", rate="20/m", method="GET", block=True), name="dispatch")
class BuildingListView(generics.ListAPIView):
    serializer_class = BuildingSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        queryset = Building.objects.all().order_by('name')
        q = self.request.query_params.get('q', '').strip()
        category = self.request.query_params.get('category', '').strip()

        if q:
            queryset = queryset.filter(
                Q(name__icontains=q) |
                Q(code__icontains=q) |
                Q(description__icontains=q) |
                Q(tags__icontains=q)
            )
        if category and category != 'all':
            queryset = queryset.filter(category=category)

        return queryset

@method_decorator(ratelimit(key="ip", rate="20/m", method="GET", block=True), name="dispatch")
class EventListView(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        queryset = Event.objects.all().order_by('title')
        q = self.request.query_params.get('q', '').strip()
        category = self.request.query_params.get('category', '').strip()

        if q:
            queryset = queryset.filter(
                Q(title__icontains=q) |
                Q(description__icontains=q)
            )
        if category and category != 'all':
            queryset = queryset.filter(category=category)

        return queryset

@method_decorator(ratelimit(key="ip", rate="10/m", method="POST", block=True), name="dispatch")
@method_decorator(ratelimit(key="ip", rate="30/m", method="GET", block=True), name="dispatch")
class LostItemViewSet(viewsets.ModelViewSet):
    queryset = LostItem.objects.all()
    serializer_class = LostItemSerializer

    def get_queryset(self):
        return LostItem.objects.all().order_by('-reported_at')

class SurveyCreateView(generics.CreateAPIView):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer


class BuildingDetailView(generics.RetrieveAPIView):
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer
    permission_classes = (permissions.AllowAny,)
class WaitlistCreateView(generics.CreateAPIView):
    queryset = Waitlist.objects.all()
    serializer_class = WaitlistSerializer
    permission_classes = (permissions.AllowAny,)
from django.contrib.auth.forms import PasswordResetForm
from django.conf import settings

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
                email_template_name='registration/password_reset_email.html'
            )
            return Response({'message': 'Password reset email sent if account exists.'}, status=status.HTTP_200_OK)
        return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

class RouteView(APIView):
    permission_classes = (AllowAny,)
    def get(self, request):
        try:
            orig_lat = float(request.query_params['orig_lat'])
            orig_lon = float(request.query_params['orig_lon'])
            dest_lat = float(request.query_params['dest_lat'])
            dest_lon = float(request.query_params['dest_lon'])
        except (KeyError, ValueError):
            return Response({"error": "Required: orig_lat, orig_lon, dest_lat, dest_lon"}, status=400)
        return Response(compute_route(orig_lat, orig_lon, dest_lat, dest_lon))

import os
import re
import json
import time as _time
from openai import OpenAI

AI_PROVIDER = os.getenv('AI_PROVIDER', 'openai')
AI_API_KEY = os.getenv('AI_API_KEY')
AI_BASE_URL = os.getenv('AI_BASE_URL', 'https://api.openai.com/v1')
AI_MODEL = os.getenv('AI_MODEL', 'gpt-4o-mini')

client = None
if AI_API_KEY:
    client = OpenAI(api_key=AI_API_KEY, base_url=AI_BASE_URL)

# ---------------------------------------------------------------------------
# Dynamic building context — rebuilt from the DB, cached for 60 s.
# ---------------------------------------------------------------------------
_ctx_cache: dict = {"text": None, "ts": 0.0}
_CTX_TTL = 60  # seconds


def _build_building_lines() -> str:
    from .models import Building as BuildingModel
    from .routing import nearest_node

    lines = []
    for b in BuildingModel.objects.only("name", "code", "category", "description", "latitude", "longitude"):
        slug = nearest_node(b.latitude, b.longitude)
        desc = b.description[:80].rstrip()
        lines.append(f"- {slug} (code:{b.code}): {b.name} ({b.category}) - {desc}")
    return "\n".join(lines)


def build_building_context(follow_up_context: dict | None = None) -> str:
    """
    Return the enriched system prompt string.

    follow_up_context — optional dict with keys `building_id` and
    `building_name` echoed back by the client from a prior turn.  When
    present it is injected into the prompt so the LLM can resolve
    pronouns like "near there" or "from there" without the user repeating
    the building name.
    """
    now = _time.monotonic()
    if _ctx_cache["text"] is None or (now - _ctx_cache["ts"]) > _CTX_TTL:
        try:
            building_lines = _build_building_lines()
        except Exception:
            building_lines = _ctx_cache.get("text") or "- (building data temporarily unavailable)"
        _ctx_cache["text"] = building_lines
        _ctx_cache["ts"] = now

    building_lines = _ctx_cache["text"]

    # Compose context-awareness section
    context_section = ""
    if follow_up_context and follow_up_context.get("building_id"):
        b_name = follow_up_context.get("building_name", follow_up_context["building_id"])
        context_section = (
            f"\n\nCONVERSATION CONTEXT: The user was most recently talking about "
            f"'{b_name}' (id: {follow_up_context['building_id']}). "
            "Resolve any relative references such as 'there', 'that place', 'from there', "
            "'near there', or 'what about that one' against this building unless the new "
            "message clearly refers to a different location."
        )

    return (
        "PathFindr is a campus navigation app for LASUSTECH "
        "(Lagos State University of Science and Technology).\n"
        "Campus buildings (format: slug (code:CODE): Name (category) - description):\n"
        + building_lines
        + context_section
        + "\n\n"
        "You are a helpful, concise campus navigation assistant.\n"
        "Rules:\n"
        "1. When a user wants directions to a building, return:\n"
        '   {"intent":"navigate","building_id":"<slug>","response":"<friendly 1-sentence message>",'
        '"follow_up_context":{"building_id":"<slug>","building_name":"<Name>"}}\n'
        "2. When asked about a building (info / what is / opening hours / facilities), return:\n"
        '   {"intent":"info","building_id":"<slug>","response":"<description>",'
        '"follow_up_context":{"building_id":"<slug>","building_name":"<Name>"}}\n'
        "3. For general questions that do not involve a specific building, return:\n"
        '   {"intent":"general","response":"<answer>"}\n'
        "4. If the message mentions a building by its CODE (e.g. ICT, ENG, LIB), match it to "
        "the slug that has code:<CODE> in the building list above.\n"
        "5. The `follow_up_context` field MUST be included whenever intent is navigate or info, "
        "so the next turn can resolve relative references.\n"
        "Always respond in valid JSON only. No markdown, no extra text outside the JSON object."
    )


# ---------------------------------------------------------------------------
# Course-code resolver — runs before the LLM call, zero extra latency.
# ---------------------------------------------------------------------------
_COURSE_CODE_RE = re.compile(
    r'\b([A-Z]{2,4})\s*(\d{3})\b',
    re.IGNORECASE,
)


def resolve_course_codes(text: str) -> list[dict]:
    """
    Scan `text` for course-code patterns (e.g. 'CSC 302', 'CSC302').
    Returns a list of dicts: [{course_code, building_id, building_name, building_code}]
    for each match that has a CourseBuilding row.
    """
    from .models import CourseBuilding

    results = []
    seen = set()
    for m in _COURSE_CODE_RE.finditer(text):
        raw = f"{m.group(1).upper()} {m.group(2)}"
        if raw in seen:
            continue
        seen.add(raw)
        try:
            cb = (
                CourseBuilding.objects
                .select_related("building")
                .get(course_code=raw)
            )
            from .routing import nearest_node
            slug = nearest_node(cb.building.latitude, cb.building.longitude)
            results.append({
                "course_code": raw,
                "building_id": slug,
                "building_name": cb.building.name,
                "building_code": cb.building.code,
            })
        except CourseBuilding.DoesNotExist:
            pass
    return results


@method_decorator(ratelimit(key='ip', rate='10/m', method='POST', block=True), name='dispatch')
class AIChatView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        user_message = request.data.get('message', '')
        history = request.data.get('messages', [])
        # Optional: client echoes back the follow_up_context from the last assistant turn
        follow_up_context = request.data.get('follow_up_context') or None

        # ── Pre-processing: resolve any course codes in the user message ──────
        course_hints = resolve_course_codes(user_message)
        augmented_message = user_message
        if course_hints:
            hint_parts = [
                f"{h['course_code']} is taught at {h['building_name']} (id: {h['building_id']})"
                for h in course_hints
            ]
            augmented_message = (
                user_message
                + "\n[System hint: "
                + "; ".join(hint_parts)
                + "]"
            )

        # ── LLM path ──────────────────────────────────────────────────────────
        if client:
            system_prompt = build_building_context(follow_up_context)
            messages = [{"role": "system", "content": system_prompt}]
            for msg in history[-6:]:
                messages.append({"role": msg['role'], "content": msg['content']})
            messages.append({"role": "user", "content": augmented_message})

            try:
                completion = client.chat.completions.create(
                    model=AI_MODEL,
                    messages=messages,
                    temperature=0.3,
                    max_tokens=400,
                    response_format={"type": "json_object"},
                )
                raw = completion.choices[0].message.content
                parsed = json.loads(raw)

                intent = parsed.get('intent', 'general')
                response_content = parsed.get('response', '')
                building_id = parsed.get('building_id')
                new_follow_up = parsed.get('follow_up_context')  # may be None for general

                # If the LLM didn't populate follow_up_context but we resolved a
                # course code, synthesise it so the client always gets a context back.
                if not new_follow_up and course_hints:
                    h = course_hints[0]
                    new_follow_up = {
                        "building_id": h["building_id"],
                        "building_name": h["building_name"],
                    }

                route_data = None
                if intent == 'navigate' and building_id:
                    from .routing import CAMPUS_NODES
                    dest = CAMPUS_NODES.get(building_id)
                    if dest:
                        route_data = compute_route(6.4666, 3.5963, dest[0], dest[1])

                return Response({
                    "role": "assistant",
                    "content": response_content,
                    "buildingId": building_id,
                    "routeData": route_data,
                    "intent": intent,
                    "followUpContext": new_follow_up,
                })
            except Exception:
                # Fall through to keyword matching if LLM fails
                pass

        # ── Keyword-matching fallback (no API key or LLM error) ───────────────
        user_message_lower = user_message.lower()

        # If we resolved a course code, treat it as a navigate intent directly
        if course_hints:
            h = course_hints[0]
            from .routing import CAMPUS_NODES
            dest = CAMPUS_NODES.get(h["building_id"])
            route = compute_route(6.4666, 3.5963, dest[0], dest[1]) if dest else None
            return Response({
                'role': 'assistant',
                'content': (
                    f"{h['course_code']} is in {h['building_name']}. "
                    f"{'Head there now — the route is ready.' if route else 'I could not compute a live route right now.'}"
                ),
                'buildingId': h['building_id'],
                'routeData': route,
                'intent': 'navigate',
                'followUpContext': {
                    'building_id': h['building_id'],
                    'building_name': h['building_name'],
                },
            })

        BUILDING_KEYWORDS = {
            'library': 'library-complex',
            'ict': 'ict-center',
            'engineering': 'engineering-block',
            'admin': 'admin-tower',
            'lab': 'science-labs',
            'student hub': 'student-hub',
        }

        detected_building = None
        # If follow_up_context is present, "near there" / "from there" inherit it
        if follow_up_context and follow_up_context.get('building_id'):
            if any(p in user_message_lower for p in ['near there', 'from there', 'what about', 'parking']):
                detected_building = follow_up_context['building_id']

        if not detected_building:
            for keyword, b_id in BUILDING_KEYWORDS.items():
                if keyword in user_message_lower:
                    detected_building = b_id
                    break

        if detected_building and any(
            k in user_message_lower
            for k in ['route', 'get to', 'find', 'where', 'go to', 'navigate', 'near there', 'parking']
        ):
            from .routing import CAMPUS_NODES
            dest = CAMPUS_NODES.get(detected_building)
            route = compute_route(6.4666, 3.5963, dest[0], dest[1]) if dest else None

            building_name = detected_building.replace('-', ' ').title()
            try:
                b_obj = Building.objects.filter(code__icontains=detected_building.split('-')[0].upper()[:3]).first()
                if b_obj:
                    building_name = b_obj.name
            except Exception:
                pass

            return Response({
                'role': 'assistant',
                'content': (
                    f"I'll guide you to {building_name}! "
                    f"The route is {route.get('distanceMeters', 0)}m and takes about "
                    f"{route.get('durationMinutes', 1)} minute(s) walking."
                ),
                'buildingId': detected_building,
                'routeData': route,
                'intent': 'navigate',
                'followUpContext': {
                    'building_id': detected_building,
                    'building_name': building_name,
                },
            })

        return Response({
            'role': 'assistant',
            'content': (
                "I can help you navigate campus! Try asking "
                "'How do I get to the library?' or 'Where is the ICT Centre?'"
            ),
            'intent': 'general',
            'followUpContext': None,
        })
