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
import json
from openai import OpenAI

AI_PROVIDER = os.getenv('AI_PROVIDER', 'openai')
AI_API_KEY = os.getenv('AI_API_KEY')
AI_BASE_URL = os.getenv('AI_BASE_URL', 'https://api.openai.com/v1')
AI_MODEL = os.getenv('AI_MODEL', 'gpt-4o-mini')

client = None
if AI_API_KEY:
    client = OpenAI(api_key=AI_API_KEY, base_url=AI_BASE_URL)

BUILDING_CONTEXT = """
PathFindr is a campus navigation app for LASUSTECH (Lagos State University of Science and Technology).
Campus buildings:
- ict-center: ICT Innovation Centre (facility) - tech hub, Wi-Fi, coding labs
- engineering-block: School of Engineering Block (faculty) - lectures, Mechanical/Electrical Engineering
- library-complex: Knowledge Resource Library (library) - reading rooms, e-library, research
- admin-tower: Administrative Tower (admin) - registry, bursary, student affairs
- science-labs: Applied Science Laboratories (lab) - wet lab, biology, physics experiments
- student-hub: Student Hub (facility) - social space, cafeteria, student union

You are a helpful campus navigation assistant. When a user wants directions:
1. Identify the building they want to reach
2. Return JSON with: { "intent": "navigate", "building_id": "<id>", "response": "<friendly message>" }
When asked about a building: { "intent": "info", "building_id": "<id>", "response": "<description>" }
For general questions: { "intent": "general", "response": "<answer>" }
Always respond in JSON only. No markdown, no extra text.
"""

@method_decorator(ratelimit(key='ip', rate='10/m', method='POST', block=True), name='dispatch')
class AIChatView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        user_message = request.data.get('message', '')
        history = request.data.get('messages', [])

        # Try LLM first if API key is present
        if client:
            messages = [{"role": "system", "content": BUILDING_CONTEXT}]
            for msg in history[-6:]:  # Last 6 messages for context
                messages.append({"role": msg['role'], "content": msg['content']})
            messages.append({"role": "user", "content": user_message})

            try:
                completion = client.chat.completions.create(
                    model=AI_MODEL,
                    messages=messages,
                    temperature=0.3,
                    max_tokens=300,
                    response_format={"type": "json_object"}
                )
                raw = completion.choices[0].message.content
                parsed = json.loads(raw)

                intent = parsed.get('intent', 'general')
                response_content = parsed.get('response', '')
                building_id = parsed.get('building_id')

                route_data = None
                if intent == 'navigate' and building_id:
                    from .routing import CAMPUS_NODES
                    dest = CAMPUS_NODES.get(building_id)
                    if dest:
                        # Fixed user location for demo purposes
                        route_data = compute_route(6.4666, 3.5963, dest[0], dest[1])

                return Response({
                    "role": "assistant",
                    "content": response_content,
                    "buildingId": building_id,
                    "routeData": route_data,
                    "intent": intent
                })
            except Exception as e:
                # If LLM fails, fall through to keyword matching
                pass

        # Keyword matching fallback
        user_message_lower = user_message.lower()
        BUILDING_KEYWORDS = {
            'library': 'library-complex',
            'ict': 'ict-center',
            'engineering': 'engineering-block',
            'admin': 'admin-tower',
            'lab': 'science-labs',
            'student hub': 'student-hub',
        }

        detected_building = None
        for keyword, b_id in BUILDING_KEYWORDS.items():
            if keyword in user_message_lower:
                detected_building = b_id
                break

        if detected_building and any(k in user_message_lower for k in ['route', 'get to', 'find', 'where', 'go to', 'navigate']):
            from .routing import CAMPUS_NODES
            dest = CAMPUS_NODES.get(detected_building)
            route = compute_route(6.4666, 3.5963, dest[0], dest[1]) if dest else None

            building_name = detected_building.replace('-', ' ').title()
            try:
                building = Building.objects.filter(code__icontains=detected_building.split('-')[0].upper()[:3]).first()
                if building:
                    building_name = building.name
            except:
                pass

            return Response({
                'role': 'assistant',
                'content': f"I'll guide you to {building_name}! The route is {route.get('distanceMeters', 0)}m and takes about {route.get('durationMinutes', 1)} minutes walking.",
                'buildingId': detected_building,
                'routeData': route,
                'intent': 'navigate'
            })

        return Response({
            'role': 'assistant',
            'content': "I can help you navigate campus! Try asking 'How do I get to the library?' or 'Where is the ICT Centre?'",
            'intent': 'general'
        })
