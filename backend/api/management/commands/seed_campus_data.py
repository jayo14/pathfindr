from django.core.management.base import BaseCommand
from api.models import Building, Event

class Command(BaseCommand):
    help = 'Seeds the database with initial campus data'

    def handle(self, *args, **kwargs):
        buildings_data = [
            {
                "id_str": "ict-center",
                "name": "ICT Innovation Centre",
                "code": "ICT",
                "category": "facility",
                "latitude": 6.4672, "longitude": 3.5951,
                "description": "A modern technology hub for digital learning, coding labs, and project support across the campus.",
                "image_url": "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
                "tags": ["wifi", "innovation", "coding"],
                "departments": ["Computer Science Support Desk"],
                "facilities": ["High-speed Wi-Fi", "Digital Lab", "Student Workstations"],
                "opening_hours": "Mon - Fri · 8:00 AM - 6:00 PM",
            },
            {
                "id_str": "engineering-block",
                "name": "School of Engineering Block",
                "code": "ENG",
                "category": "faculty",
                "latitude": 6.4684, "longitude": 3.5968,
                "description": "Primary hub for engineering lectures, faculty offices, and student project reviews.",
                "image_url": "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80",
                "tags": ["lectures", "faculty", "workshops"],
                "departments": ["Mechanical Engineering", "Electrical Engineering"],
                "facilities": ["Lecture Hall", "Project Studio", "Faculty Lounge"],
                "opening_hours": "Mon - Sat · 8:00 AM - 5:00 PM",
            },
            {
                "id_str": "library-complex",
                "name": "Knowledge Resource Library",
                "code": "LIB",
                "category": "library",
                "latitude": 6.4661, "longitude": 3.5979,
                "description": "Quiet reading floors, digital archives, and research support spaces for the entire campus community.",
                "image_url": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
                "tags": ["study", "research", "archive"],
                "departments": ["Research Services"],
                "facilities": ["Reading Rooms", "E-library", "Research Desk"],
                "opening_hours": "Daily · 8:00 AM - 8:00 PM",
            },
        ]

        for b_data in buildings_data:
            Building.objects.update_or_create(
                code=b_data['code'],
                defaults={
                    'name': b_data['name'],
                    'category': b_data['category'],
                    'latitude': b_data['latitude'],
                    'longitude': b_data['longitude'],
                    'description': b_data['description'],
                    'image_url': b_data['image_url'],
                    'tags': b_data['tags'],
                    'departments': b_data['departments'],
                    'facilities': b_data['facilities'],
                    'opening_hours': b_data['opening_hours'],
                }
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded buildings'))

        # Seed events
        ict = Building.objects.get(code='ICT')
        eng = Building.objects.get(code='ENG')

        Event.objects.update_or_create(
            title="Campus Innovation Summit",
            defaults={
                'description': "Student founders, prototypes, and lightning talks from top campus builders.",
                'date_label': "Mar 18",
                'start_time': "10:00 AM",
                'location_name': "ICT Innovation Centre",
                'building': ict,
                'image_url': "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
                'category': "career"
            }
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded events'))
