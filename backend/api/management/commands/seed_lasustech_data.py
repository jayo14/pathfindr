from django.core.management.base import BaseCommand
from api.seed_data import BUILDINGS, EVENTS, LOST_ITEMS, COURSES
from api.models import Building, Event, LostItem, CourseBuilding


class Command(BaseCommand):
    help = 'Seed LASUSTECH campus data with buildings, events, lost items and course mappings'

    def handle(self, *args, **options):
        self.stdout.write('Seeding buildings...')
        for b in BUILDINGS:
            obj, created = Building.objects.get_or_create(code=b['code'], defaults=b)
            if created:
                self.stdout.write(f'  Seeded: {b["name"]} ({b["code"]})')
            else:
                self.stdout.write(f'  Exists: {b["name"]} ({b["code"]})')

        self.stdout.write('Seeding events...')
        for e in EVENTS:
            building = Building.objects.filter(code=e.get('building_code')).first()
            event_defaults = {k: v for k, v in e.items() if k != 'building_code'}
            obj, created = Event.objects.get_or_create(
                title=e['title'], building=building, defaults=event_defaults
            )
            self.stdout.write(f'  {"Seeded" if created else "Exists"}: {e["title"]}')

        self.stdout.write('Seeding lost items...')
        for item in LOST_ITEMS:
            building = Building.objects.filter(code=item.get('building_code')).first()
            item_defaults = {k: v for k, v in item.items() if k != 'building_code'}
            obj, created = LostItem.objects.get_or_create(
                title=item['title'],
                building=building,
                reported_at=item['reported_at'],
                defaults=item_defaults,
            )
            self.stdout.write(f'  {"Seeded" if created else "Exists"}: {item["title"]}')

        self.stdout.write('Seeding course -> building mappings...')
        for c in COURSES:
            building = Building.objects.filter(code=c.get('building_code')).first()
            if building is None:
                self.stdout.write(self.style.WARNING(
                    f'  Skipped {c["course_code"]}: building {c.get("building_code")} not found'
                ))
                continue
            obj, created = CourseBuilding.objects.get_or_create(
                course_code=c['course_code'],
                defaults={'course_name': c.get('course_name', ''), 'building': building},
            )
            self.stdout.write(f'  {"Seeded" if created else "Exists"}: {c["course_code"]}')

        self.stdout.write(self.style.SUCCESS('Seeding complete.'))
