from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models


def normalize_existing_intakes(apps, schema_editor):
    NutritionIntake = apps.get_model("programs", "NutritionIntake")
    NutritionIntake.objects.filter(preferred_meal_count__lt=2).update(preferred_meal_count=2)
    NutritionIntake.objects.filter(preferred_meal_count__gt=6).update(preferred_meal_count=6)
    NutritionIntake.objects.filter(dietary_style="pescatarian").update(dietary_style="other")

    cooking_map = {
        "under_15": "very_low",
        "15_30": "moderate",
        "30_60": "enough",
        "over_60": "enough",
    }
    for old_value, new_value in cooking_map.items():
        NutritionIntake.objects.filter(cooking_time_availability=old_value).update(
            cooking_time_availability=new_value
        )

    NutritionIntake.objects.filter(eating_out_frequency="daily").update(
        eating_out_frequency="most_days"
    )


class Migration(migrations.Migration):
    dependencies = [("programs", "0001_initial")]

    operations = [
        migrations.RenameField(
            model_name="nutritionintake",
            old_name="cooking_time",
            new_name="cooking_time_availability",
        ),
        migrations.RenameField(
            model_name="workoutintake",
            old_name="session_duration_minutes",
            new_name="preferred_session_duration",
        ),
        migrations.AddField(
            model_name="nutritionintake",
            name="meal_pattern",
            field=models.CharField(
                choices=[("regular", "Regular meals"), ("irregular", "Irregular meals"), ("skips_breakfast", "Skips breakfast"), ("night_eating", "Night eating"), ("other", "Other")],
                default="regular",
                max_length=24,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="nutritionintake",
            name="cooking_frequency",
            field=models.CharField(
                choices=[("rarely", "Rarely"), ("few_times_weekly", "A few times weekly"), ("most_days", "Most days")],
                default="few_times_weekly",
                max_length=24,
            ),
            preserve_default=False,
        ),
        migrations.AddField(model_name="nutritionintake", name="food_restrictions", field=models.TextField(blank=True, default="", max_length=500)),
        migrations.AddField(model_name="nutritionintake", name="favorite_foods_or_cuisines", field=models.TextField(blank=True, default="", max_length=500)),
        migrations.AddField(model_name="nutritionintake", name="notes", field=models.TextField(blank=True, default="", max_length=1000)),
        migrations.AddField(
            model_name="workoutintake",
            name="intensity_preference",
            field=models.CharField(
                choices=[("light", "Light"), ("moderate", "Moderate"), ("challenging", "Challenging")],
                default="moderate",
                max_length=16,
            ),
            preserve_default=False,
        ),
        migrations.AddField(model_name="workoutintake", name="preferred_workout_time", field=models.CharField(blank=True, choices=[("morning", "Morning"), ("midday", "Midday"), ("evening", "Evening"), ("flexible", "Flexible")], default="", max_length=16)),
        migrations.AddField(model_name="workoutintake", name="disliked_exercises", field=models.TextField(blank=True, default="", max_length=500)),
        migrations.AddField(model_name="workoutintake", name="notes", field=models.TextField(blank=True, default="", max_length=1000)),
        migrations.RunPython(normalize_existing_intakes, migrations.RunPython.noop),
        migrations.AlterField(model_name="nutritionintake", name="preferred_meal_count", field=models.PositiveSmallIntegerField(validators=[MinValueValidator(2), MaxValueValidator(6)])),
        migrations.AlterField(model_name="nutritionintake", name="dietary_style", field=models.CharField(choices=[("none", "No specific style"), ("vegetarian", "Vegetarian"), ("vegan", "Vegan"), ("low_carb", "Low carb"), ("high_protein", "High protein preference"), ("other", "Other")], max_length=24)),
        migrations.AlterField(model_name="nutritionintake", name="cooking_time_availability", field=models.CharField(choices=[("very_low", "Very low"), ("moderate", "Moderate"), ("enough", "Enough time")], max_length=16)),
        migrations.AlterField(model_name="nutritionintake", name="eating_out_frequency", field=models.CharField(choices=[("rarely", "Rarely"), ("weekly_1_2", "1 to 2 times weekly"), ("weekly_3_5", "3 to 5 times weekly"), ("most_days", "Most days")], max_length=16)),
        migrations.AlterField(model_name="workoutintake", name="equipment_access", field=models.CharField(choices=[("none", "No equipment"), ("basic", "Basic home equipment"), ("dumbbells_bands", "Dumbbells or bands"), ("full_gym", "Full gym")], max_length=16)),
    ]
