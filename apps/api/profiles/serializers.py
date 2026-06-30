from datetime import date

from django.utils import timezone
from rest_framework import serializers

from .models import HealthProfile


def shift_years(value: date, years: int) -> date:
    try:
        return value.replace(year=value.year + years)
    except ValueError:
        return value.replace(year=value.year + years, day=28)


class HealthProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthProfile
        fields = [
            "display_name",
            "birth_date",
            "height_cm",
            "weight_kg",
            "goal",
            "activity_level",
            "food_preferences",
            "food_restrictions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_display_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Display name cannot be blank.")
        return value

    def validate_birth_date(self, value):
        today = timezone.localdate()
        latest_allowed = shift_years(today, -18)
        earliest_allowed = shift_years(today, -120)

        if value > latest_allowed:
            raise serializers.ValidationError("You must be at least 18 years old.")
        if value < earliest_allowed:
            raise serializers.ValidationError("Age cannot be more than 120 years.")
        return value

    def validate_food_preferences(self, value):
        return value.strip()

    def validate_food_restrictions(self, value):
        return value.strip()
