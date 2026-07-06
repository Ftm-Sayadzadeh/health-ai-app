import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("plans", "0002_plan_attachment_plan_attachment_content_type_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="NutritionPlanMeal",
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
                    "meal_type",
                    models.CharField(
                        choices=[
                            ("breakfast", "Breakfast"),
                            ("lunch", "Lunch"),
                            ("dinner", "Dinner"),
                            ("snack", "Snack"),
                            ("other", "Other"),
                        ],
                        max_length=16,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "plan",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="nutrition_meals",
                        to="plans.plan",
                    ),
                ),
            ],
            options={"ordering": ["id"]},
        ),
        migrations.CreateModel(
            name="NutritionPlanMealItem",
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
                        blank=True,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(10000),
                        ],
                    ),
                ),
                ("note", models.TextField(blank=True, default="", max_length=500)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "meal",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="plans.nutritionplanmeal",
                    ),
                ),
            ],
            options={"ordering": ["sort_order", "id"]},
        ),
        migrations.AddConstraint(
            model_name="nutritionplanmeal",
            constraint=models.UniqueConstraint(
                fields=("plan", "meal_type"),
                name="unique_nutrition_meal_per_plan",
            ),
        ),
    ]
