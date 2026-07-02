import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="HealthProfile",
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
                ("display_name", models.CharField(max_length=80)),
                ("birth_date", models.DateField()),
                (
                    "height_cm",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=5,
                        validators=[
                            django.core.validators.MinValueValidator(50),
                            django.core.validators.MaxValueValidator(250),
                        ],
                    ),
                ),
                (
                    "weight_kg",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=5,
                        validators=[
                            django.core.validators.MinValueValidator(20),
                            django.core.validators.MaxValueValidator(500),
                        ],
                    ),
                ),
                (
                    "goal",
                    models.CharField(
                        choices=[
                            ("lose_weight", "Lose weight"),
                            ("maintain_weight", "Maintain weight"),
                            ("gain_weight", "Gain weight"),
                            ("build_muscle", "Build muscle"),
                            ("general_wellness", "General wellness"),
                        ],
                        max_length=32,
                    ),
                ),
                (
                    "activity_level",
                    models.CharField(
                        choices=[
                            ("sedentary", "Sedentary"),
                            ("light", "Light"),
                            ("moderate", "Moderate"),
                            ("high", "High"),
                            ("very_high", "Very high"),
                        ],
                        max_length=32,
                    ),
                ),
                ("food_preferences", models.TextField(blank=True, default="", max_length=500)),
                ("food_restrictions", models.TextField(blank=True, default="", max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="health_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
