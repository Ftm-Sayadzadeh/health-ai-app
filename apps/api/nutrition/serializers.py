from rest_framework import serializers

from .models import FoodLogEntry


class FoodLogEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodLogEntry
        fields = [
            "id",
            "meal_type",
            "food_name",
            "serving_description",
            "calories",
            "note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_food_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Food name cannot be blank.")
        return value

    def validate_serving_description(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Serving description cannot be blank.")
        return value

    def validate_note(self, value):
        return value.strip()
