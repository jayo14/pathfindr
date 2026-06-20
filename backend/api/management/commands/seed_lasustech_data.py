from django.core.management.base import BaseCommand
from api.models import Building, Event

BUILDINGS = [
    {"name": "ICT Innovation Centre", "code": "ICT", "category": "facility", "latitude": 6.4672, "longitude": 3.5951, "description": "A modern technology hub for digital learning, coding labs, and project support.", "image_url": "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80", "tags": ["wifi","innovation","coding"], "departments": ["Computer Science Support Desk"], "facilities": ["High-speed Wi-Fi","Digital Lab","Student Workstations"], "opening_hours": "Mon - Fri 8:00 AM - 6:00 PM"},
    {"name": "School of Engineering Block", "code": "ENG", "category": "faculty", "latitude": 6.4684, "longitude": 3.5968, "description": "Primary hub for engineering lectures, faculty offices, and project reviews.", "image_url": "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80", "tags": ["lectures","faculty","workshops"], "departments": ["Mechanical Engineering","Electrical Engineering"], "facilities": ["Lecture Hall","Project Studio","Faculty Lounge"], "opening_hours": "Mon - Sat 8:00 AM - 5:00 PM"},
    {"name": "Knowledge Resource Library", "code": "LIB", "category": "library", "latitude": 6.4661, "longitude": 3.5979, "description": "Quiet reading floors, digital archives, and research support spaces.", "image_url": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80", "tags": ["study","research","archive"], "departments": ["Research Services"], "facilities": ["Reading Rooms","E-library","Research Desk"], "opening_hours": "Daily 8:00 AM - 8:00 PM"},
    {"name": "Administrative Tower", "code": "ADM", "category": "admin", "latitude": 6.4655, "longitude": 3.5946, "description": "Central offices handling records, student affairs, and campus operations.", "image_url": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80", "tags": ["student affairs","records","payments"], "departments": ["Registry","Bursary"], "facilities": ["Reception","Records Office","Help Desk"], "opening_hours": "Mon - Fri 8:30 AM - 4:30 PM"},
    {"name": "Applied Science Laboratories", "code": "LAB", "category": "lab", "latitude": 6.4676, "longitude": 3.5988, "description": "Specialized labs supporting environmental, biological, and physical science.", "image_url": "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=1200&q=80", "tags": ["experiments","practical"], "departments": ["Applied Sciences"], "facilities": ["Wet Lab","Safety Station","Technician Office"], "opening_hours": "Mon - Fri 9:00 AM - 5:00 PM"},
]

class Command(BaseCommand):
    help = 'Seed LASUSTECH campus data'
    def handle(self, *args, **kwargs):
        for b in BUILDINGS:
            Building.objects.get_or_create(code=b['code'], defaults=b)
            self.stdout.write(f"Seeded: {b['name']}")
