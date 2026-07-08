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
            building = Building.objects.filter(code=e.get('building_code')).first()
            event_defaults = {k: v for k, v in e.items() if k != 'building_code'}
            Event.objects.get_or_create(title=e['title'], building=building, defaults=event_defaults)
            self.stdout.write(f'  Seeded: {e["title"]}')

        self.stdout.write('Seeding lost items...')
        for item in LOST_ITEMS:
            building = Building.objects.filter(code=item.get('building_code')).first()
            item_defaults = {k: v for k, v in item.items() if k != 'building_code'}
            LostItem.objects.get_or_create(
                title=item['title'],
                building=building,
                reported_at=item['reported_at'],
                defaults=item_defaults,
            )
            self.stdout.write(f'  Seeded: {item["title"]}')

        self.stdout.write(self.style.SUCCESS('Seeding complete.'))
