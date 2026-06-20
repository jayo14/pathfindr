from django.contrib import admin
from .models import Profile, Building, Event, LostItem, Survey, Waitlist

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'is_student', 'college', 'has_completed_onboarding')
    search_fields = ('user__username', 'full_name', 'college')
    list_filter = ('is_student', 'has_completed_onboarding')

@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'category', 'opening_hours')
    search_fields = ('name', 'code', 'category')
    list_filter = ('category',)

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'date_label', 'start_time', 'location_name', 'category')
    search_fields = ('title', 'location_name', 'category')
    list_filter = ('category',)

@admin.register(LostItem)
class LostItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'location_name', 'reported_at', 'user')
    search_fields = ('title', 'location_name', 'status')
    list_filter = ('status', 'reported_at')

@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
    readonly_fields = ('created_at',)

@admin.register(Waitlist)
class WaitlistAdmin(admin.ModelAdmin):
    list_display = ('email', 'created_at')
    search_fields = ('email',)
