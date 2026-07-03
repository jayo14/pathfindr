import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_add_indexes"),
    ]

    operations = [
        migrations.CreateModel(
            name="CourseBuilding",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "course_code",
                    models.CharField(
                        db_index=True,
                        help_text="Normalised course code, e.g. 'CSC 302'",
                        max_length=20,
                        unique=True,
                    ),
                ),
                (
                    "course_name",
                    models.CharField(blank=True, max_length=255),
                ),
                (
                    "building",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="courses",
                        to="api.building",
                    ),
                ),
            ],
            options={
                "verbose_name": "Course \u2192 Building mapping",
                "verbose_name_plural": "Course \u2192 Building mappings",
            },
        ),
    ]
