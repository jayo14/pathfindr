from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Building, Event, LostItem, Survey, Waitlist

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['full_name', 'is_student', 'college', 'department', 'year_of_study', 'preferences', 'has_completed_onboarding']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        Profile.objects.create(user=user)
        return user

class BuildingSerializer(serializers.ModelSerializer):
    coordinate = serializers.SerializerMethodField()
    imageUrl = serializers.URLField(source='image_url', read_only=True)

    class Meta:
        model = Building
        fields = ['id', 'name', 'code', 'category', 'coordinate', 'description', 'image_url', 'imageUrl', 'tags', 'departments', 'facilities', 'opening_hours']

    def get_coordinate(self, obj):
        return {'latitude': obj.latitude, 'longitude': obj.longitude}

class EventSerializer(serializers.ModelSerializer):
    building_id = serializers.PrimaryKeyRelatedField(source='building', queryset=Building.objects.all(), allow_null=True, required=False)

    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'date_label', 'start_time', 'location_name', 'building_id', 'image_url', 'category']

class LostItemSerializer(serializers.ModelSerializer):
    building_id = serializers.PrimaryKeyRelatedField(source='building', queryset=Building.objects.all(), allow_null=True, required=False)
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = LostItem
        fields = ['id', 'title', 'description', 'status', 'location_name', 'building_id', 'image_url', 'reported_at', 'contact_hint', 'user']

class SurveySerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Survey
        fields = ['id', 'responses', 'created_at', 'user']

class WaitlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Waitlist
        fields = ['email', 'created_at']
