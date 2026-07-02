from rest_framework import serializers

from .models import NutritionIntake, WorkoutIntake


class TrimmedOptionalTextMixin:
    def validate(self, attrs):
        for field_name in self.optional_text_fields:
            if field_name in attrs:
                attrs[field_name] = attrs[field_name].strip()
        return super().validate(attrs)


class NutritionIntakeSerializer(TrimmedOptionalTextMixin, serializers.ModelSerializer):
    optional_text_fields = (
        "food_allergies",
        "food_restrictions",
        "disliked_foods",
        "favorite_foods_or_cuisines",
        "notes",
    )

    class Meta:
        model = NutritionIntake
        fields = [
            "preferred_meal_count",
            "meal_pattern",
            "dietary_style",
            "cooking_time_availability",
            "cooking_frequency",
            "budget_level",
            "eating_out_frequency",
            "food_allergies",
            "food_restrictions",
            "disliked_foods",
            "favorite_foods_or_cuisines",
            "notes",
            "completed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["completed_at", "created_at", "updated_at"]


class WorkoutIntakeSerializer(TrimmedOptionalTextMixin, serializers.ModelSerializer):
    optional_text_fields = ("injuries_or_limitations", "disliked_exercises", "notes")

    class Meta:
        model = WorkoutIntake
        fields = [
            "workout_location",
            "available_days_per_week",
            "preferred_session_duration",
            "experience_level",
            "equipment_access",
            "preferred_workout_style",
            "intensity_preference",
            "preferred_workout_time",
            "injuries_or_limitations",
            "disliked_exercises",
            "notes",
            "completed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["completed_at", "created_at", "updated_at"]
