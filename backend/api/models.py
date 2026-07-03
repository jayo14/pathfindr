from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255)
    is_student = models.BooleanField(default=True)
    college = models.CharField(max_length=255, blank=True, null=True)
    department = models.CharField(max_length=255, blank=True, null=True)
    year_of_study = models.CharField(max_length=50, blank=True, null=True)
    preferences = models.JSONField(default=dict, blank=True)
    has_completed_onboarding = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} Profile"

class Building(models.Model):
    CATEGORY_CHOICES = [
        ('faculty', 'Faculty'),
        ('department', 'Department'),
        ('library', 'Library'),
        ('lab', 'Lab'),
        ('admin', 'Admin'),
        ('facility', 'Facility'),
        ('hostel', 'Hostel'),
    ]
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    latitude = models.FloatField()
    longitude = models.FloatField()
    description = models.TextField()
    image_url = models.URLField(max_length=500)
    tags = models.JSONField(default=list)
    departments = models.JSONField(default=list)
    facilities = models.JSONField(default=list)
    opening_hours = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class Event(models.Model):
    CATEGORY_CHOICES = [
        ('academic', 'Academic'),
        ('social', 'Social'),
        ('sports', 'Sports'),
        ('career', 'Career'),
    ]
    title = models.CharField(max_length=255)
    description = models.TextField()
    date_label = models.CharField(max_length=100)
    start_time = models.CharField(max_length=100)
    location_name = models.CharField(max_length=255)
    building = models.ForeignKey(Building, on_delete=models.SET_NULL, null=True, blank=True, related_name='events')
    image_url = models.URLField(max_length=500)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)

    def __str__(self):
        return self.title

class LostItem(models.Model):
    STATUS_CHOICES = [
        ('lost', 'Lost'),
        ('found', 'Found'),
    ]
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    location_name = models.CharField(max_length=255)
    building = models.ForeignKey(Building, on_delete=models.SET_NULL, null=True, blank=True, related_name='lost_items')
    image_url = models.URLField(max_length=500, blank=True, null=True)
    reported_at = models.DateTimeField(auto_now_add=True)
    contact_hint = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reported_items')

    def __str__(self):
        return self.title

class Survey(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='surveys')
    responses = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Survey from {self.user.username} at {self.created_at}"

class Waitlist(models.Model):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email


class CourseBuilding(models.Model):
    """
    Maps a course code (e.g. 'CSC 302') to the building where it is taught.

    This is a lightweight lookup table so the AI assistant can resolve
    student prompts like "I have CSC 302" to a concrete building_id without
    relying on the LLM to guess course locations.  Codes are stored
    normalised to uppercase with a single internal space (e.g. 'CSC 302').
    """
    course_code = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        help_text="Normalised course code, e.g. 'CSC 302'",
    )
    course_name = models.CharField(max_length=255, blank=True)
    building = models.ForeignKey(
        Building,
        on_delete=models.CASCADE,
        related_name="courses",
    )

    class Meta:
        verbose_name = "Course → Building mapping"
        verbose_name_plural = "Course → Building mappings"

    def __str__(self):
        return f"{self.course_code} → {self.building.name}"
