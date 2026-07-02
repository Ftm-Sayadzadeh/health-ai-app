from rest_framework import serializers

from .models import CustomFood, FoodLogEntry


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


class FoodLogEntryCreateSerializer(FoodLogEntrySerializer):
    save_as_custom = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta(FoodLogEntrySerializer.Meta):
        fields = [*FoodLogEntrySerializer.Meta.fields, "save_as_custom"]


class CustomFoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomFood
        fields = [
            "id",
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

    def validate(self, attrs):
        request = self.context["request"]
        current = self.instance
        values = {
            "food_name": attrs.get("food_name", getattr(current, "food_name", None)),
            "serving_description": attrs.get(
                "serving_description",
                getattr(current, "serving_description", None),
            ),
            "calories": attrs.get("calories", getattr(current, "calories", None)),
        }
        duplicate = CustomFood.objects.filter(user=request.user, **values)
        if current is not None:
            duplicate = duplicate.exclude(pk=current.pk)
        if duplicate.exists():
            raise serializers.ValidationError(
                {"food_name": "This custom food is already saved."}
            )
        return attrs
