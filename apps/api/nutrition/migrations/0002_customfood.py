import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("nutrition", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="CustomFood",
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
                ("food_name", models.CharField(max_length=120)),
                ("serving_description", models.CharField(max_length=120)),
                (
                    "calories",
                    models.PositiveIntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(10000),
                        ]
                    ),
                ),
                ("note", models.TextField(blank=True, default="", max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="custom_foods",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-updated_at", "-id"],
            },
        ),
        migrations.AddIndex(
            model_name="customfood",
            index=models.Index(
                fields=["user", "-updated_at"],
                name="nutrition_c_user_id_c271be_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="customfood",
            constraint=models.UniqueConstraint(
                fields=("user", "food_name", "serving_description", "calories"),
                name="unique_custom_food_per_user",
            ),
        ),
    ]
