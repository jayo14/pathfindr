from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Building, Event, LostItem, Survey, Waitlist


# ── Auth ──────────────────────────────────────────────────────────────────

class ProfileSerializer(serializers.ModelSerializer):
    hasCompletedOnboarding = serializers.BooleanField(
        source='has_completed_onboarding', read_only=True
    )
    isStudent = serializers.BooleanField(
        source='is_student', required=False
    )
    fullName = serializers.CharField(
        source='full_name', required=False, allow_blank=True
    )
    yearOfStudy = serializers.CharField(
        source='year_of_study', required=False, allow_blank=True, allow_null=True
    )

    class Meta:
        model = Profile
        fields = [
            'fullName', 'full_name',
            'isStudent', 'is_student',
            'college', 'department',
            'yearOfStudy', 'year_of_study',
            'preferences',
            'hasCompletedOnboarding', 'has_completed_onboarding',
        ]
        extra_kwargs = {
            'full_name': {'write_only': True, 'required': False},
            'is_student': {'write_only': True, 'required': False},
            'year_of_study': {'write_only': True, 'required': False},
        }


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        Profile.objects.get_or_create(user=user)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)


# ── Building ──────────────────────────────────────────────────────────────

class BuildingSerializer(serializers.ModelSerializer):
    coordinate = serializers.SerializerMethodField()
    imageUrl      = serializers.URLField(source='image_url',     read_only=True)
    openingHours  = serializers.CharField(source='opening_hours', read_only=True)

    class Meta:
        model = Building
        fields = [
            'id', 'name', 'code', 'category',
            'coordinate',
            'description',
            'image_url', 'imageUrl',
            'tags', 'departments', 'facilities',
            'opening_hours', 'openingHours',
        ]

    def get_coordinate(self, obj):
        return {'latitude': obj.latitude, 'longitude': obj.longitude}


# ── Event ─────────────────────────────────────────────────────────────────

class EventSerializer(serializers.ModelSerializer):
    buildingId   = serializers.PrimaryKeyRelatedField(
        source='building',
        queryset=Building.objects.all(),
        allow_null=True,
        required=False,
    )
    dateLabel    = serializers.CharField(source='date_label',    read_only=True)
    startTime    = serializers.CharField(source='start_time',    read_only=True)
    locationName = serializers.CharField(source='location_name', read_only=True)
    imageUrl     = serializers.URLField(source='image_url',      read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description',
            'date_label',   'dateLabel',
            'start_time',   'startTime',
            'location_name','locationName',
            'buildingId',
            'image_url',    'imageUrl',
            'category',
        ]
        extra_kwargs = {
            'date_label':    {'required': False},
            'start_time':    {'required': False},
            'location_name': {'required': False},
            'image_url':     {'required': False, 'allow_blank': True},
        }


# ── LostItem ──────────────────────────────────────────────────────────────

class LostItemSerializer(serializers.ModelSerializer):
    buildingId   = serializers.PrimaryKeyRelatedField(
        source='building',
        queryset=Building.objects.all(),
        allow_null=True,
        required=False,
    )
    locationName = serializers.CharField(source='location_name', read_only=True)
    reportedAt   = serializers.DateTimeField(source='reported_at', read_only=True)
    contactHint  = serializers.CharField(source='contact_hint',  read_only=True)
    imageUrl     = serializers.URLField(source='image_url', read_only=True, allow_null=True)

    # User is optional — guests can post without auth
    user = serializers.HiddenField(default=None)

    class Meta:
        model = LostItem
        fields = [
            'id', 'title', 'description', 'status',
            'location_name', 'locationName',
            'buildingId',
            'image_url', 'imageUrl',
            'reported_at', 'reportedAt',
            'contact_hint', 'contactHint',
            'user',
        ]
        extra_kwargs = {
            'location_name': {'required': True},
            'image_url':     {'required': False, 'allow_blank': True, 'allow_null': True},
            'contact_hint':  {'required': False, 'allow_blank': True},
        }

    def create(self, validated_data):
        # Inject authenticated user if present; otherwise leave as None
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['user'] = request.user
        else:
            validated_data['user'] = None
        return super().create(validated_data)


# ── Survey ────────────────────────────────────────────────────────────────

class SurveySerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Survey
        fields = ['id', 'responses', 'created_at', 'user']


# ── Waitlist ──────────────────────────────────────────────────────────────

class WaitlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Waitlist
        fields = ['email', 'created_at']
