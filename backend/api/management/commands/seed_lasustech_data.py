from django.core.management.base import BaseCommand
from api.seed_data import BUILDINGS, EVENTS, LOST_ITEMS
from api.models import Building, Event, LostItem


class Command(BaseCommand):
    help = 'Seed LASUSTECH campus data with buildings, events, and lost items'

    def handle(self, *args, **options):
        self.stdout.write('Seeding buildings...')
        for b in BUILDINGS:
            Building.objects.get_or_create(code=b['code'], defaults=b)
            self.stdout.write(f'  Seeded: {b["name"]}')

        self.stdout.write('Seeding events...')
        for e in EVENTS:
            code = e.pop('building_code', None)
            building = Building.objects.filter(code=code).first() if code else None
            Event.objects.get_or_create(title=e['title'], building=building, defaults=e)
            self.stdout.write(f'  Seeded: {e["title"]}')

        self.stdout.write('Seeding lost items...')
        for item in LOST_ITEMS:
            code = item.pop('building_code', None)
            building = Building.objects.filter(code=code).first() if code else None
            LostItem.objects.get_or_create(
                title=item['title'],
                building=building,
                reported_at=item['reported_at'],
                defaults=item,
            )
            self.stdout.write(f'  Seeded: {item["title"]}')

        self.stdout.write(self.style.SUCCESS('Seeding complete.'))
