"""
Management command: seed_course_data
-------------------------------------
Populates the CourseBuilding table with LASUSTECH Computer Science course
codes mapped to their teaching buildings.  Safe to run multiple times —
uses update_or_create so existing rows are updated in place.

Usage:
    python manage.py seed_course_data
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import Building, CourseBuilding

# ---------------------------------------------------------------------------
# Course → building_code mapping
# building_code must match an existing Building.code value (seeded by
# seed_campus_data or seed_lasustech_data).
# ---------------------------------------------------------------------------
COURSE_DATA = [
    # ── Computer Science (100 level) ──────────────────────────────────────
    {"code": "CSC 101", "name": "Introduction to Computing",          "building_code": "ICT"},
    {"code": "CSC 102", "name": "Computer Programming I",             "building_code": "ICT"},
    {"code": "CSC 103", "name": "Logic and Discrete Mathematics",     "building_code": "ICT"},
    # ── Computer Science (200 level) ──────────────────────────────────────
    {"code": "CSC 201", "name": "Computer Programming II",            "building_code": "ICT"},
    {"code": "CSC 202", "name": "Data Structures & Algorithms",       "building_code": "ICT"},
    {"code": "CSC 203", "name": "Computer Organisation",              "building_code": "ENG"},
    {"code": "CSC 204", "name": "Operating Systems I",                "building_code": "ICT"},
    # ── Computer Science (300 level) ──────────────────────────────────────
    {"code": "CSC 301", "name": "Algorithms & Complexity",            "building_code": "ICT"},
    {"code": "CSC 302", "name": "Software Engineering",               "building_code": "ENG"},
    {"code": "CSC 303", "name": "Computer Networks",                  "building_code": "ICT"},
    {"code": "CSC 304", "name": "Database Systems",                   "building_code": "ICT"},
    {"code": "CSC 305", "name": "Theory of Computation",              "building_code": "ICT"},
    # ── Computer Science (400 level) ──────────────────────────────────────
    {"code": "CSC 401", "name": "Artificial Intelligence",            "building_code": "ICT"},
    {"code": "CSC 402", "name": "Computer Graphics",                  "building_code": "ICT"},
    {"code": "CSC 403", "name": "Information Security",               "building_code": "ICT"},
    {"code": "CSC 404", "name": "Human–Computer Interaction",         "building_code": "ICT"},
    {"code": "CSC 405", "name": "Final Year Project",                 "building_code": "ENG"},
    # ── Electrical / Electronic Engineering ───────────────────────────────
    {"code": "EEE 301", "name": "Circuit Theory",                     "building_code": "ENG"},
    {"code": "EEE 302", "name": "Electronics I",                      "building_code": "ENG"},
    {"code": "EEE 401", "name": "Power Systems",                      "building_code": "ENG"},
    # ── General courses across faculties ──────────────────────────────────
    {"code": "MTH 101", "name": "General Mathematics I",              "building_code": "ENG"},
    {"code": "MTH 201", "name": "Linear Algebra",                     "building_code": "ENG"},
    {"code": "PHY 101", "name": "General Physics I",                  "building_code": "LAB"},
    {"code": "CHM 101", "name": "General Chemistry I",                "building_code": "LAB"},
    {"code": "GST 101", "name": "Use of English",                     "building_code": "ADM"},
]


class Command(BaseCommand):
    help = "Seed CourseBuilding table with LASUSTECH CS/engineering course codes"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing CourseBuilding rows before seeding",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["clear"]:
            deleted, _ = CourseBuilding.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Cleared {deleted} existing course mappings"))

        created_count = 0
        updated_count = 0
        skipped_count = 0

        for entry in COURSE_DATA:
            raw_code = entry["code"].strip().upper()
            # Normalise: collapse multiple spaces → single space
            normalised = " ".join(raw_code.split())

            try:
                building = Building.objects.get(code=entry["building_code"])
            except Building.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(
                        f"  Skipping {normalised}: building code '{entry['building_code']}' "
                        "not found — run seed_campus_data first"
                    )
                )
                skipped_count += 1
                continue

            _, created = CourseBuilding.objects.update_or_create(
                course_code=normalised,
                defaults={
                    "course_name": entry["name"],
                    "building": building,
                },
            )
            if created:
                created_count += 1
                self.stdout.write(f"  Created  {normalised:12s} → {building.name}")
            else:
                updated_count += 1
                self.stdout.write(f"  Updated  {normalised:12s} → {building.name}")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone — {created_count} created, {updated_count} updated, {skipped_count} skipped"
            )
        )
