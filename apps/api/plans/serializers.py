from rest_framework import serializers
from pathlib import Path

from .models import NutritionPlanMeal, NutritionPlanMealItem, Plan


MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024
ALLOWED_ATTACHMENT_TYPES = {
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".png": {"image/png"},
    ".webp": {"image/webp"},
    ".pdf": {"application/pdf"},
}


def validate_attachment_file(value):
    if len(Path(value.name).name) > 255:
        raise serializers.ValidationError("Attachment filename is too long.")
    suffix = Path(value.name).suffix.lower()
    content_type = (getattr(value, "content_type", "") or "").lower()
    if suffix not in ALLOWED_ATTACHMENT_TYPES or content_type not in ALLOWED_ATTACHMENT_TYPES[suffix]:
        raise serializers.ValidationError("Only JPG, JPEG, PNG, WEBP, and PDF files are allowed.")
    if value.size > MAX_ATTACHMENT_SIZE:
        raise serializers.ValidationError("Attachment cannot be larger than 10 MB.")
    return value


def validate_dates(attrs):
    starts_on = attrs.get("starts_on")
    ends_on = attrs.get("ends_on")
    if starts_on and ends_on and ends_on < starts_on:
        raise serializers.ValidationError(
            {"ends_on": "End date cannot be before start date."}
        )
    return attrs


class TrimmedPlanFieldsMixin:
    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title cannot be blank.")
        return value

    def validate_notes(self, value):
        return value.strip()

    def validate_external_provider_name(self, value):
        return value.strip()


class PlanSerializer(serializers.ModelSerializer):
    attachment = serializers.SerializerMethodField()

    def get_attachment(self, obj):
        if not obj.attachment:
            return None
        return {
            "original_name": obj.attachment_original_name,
            "content_type": obj.attachment_content_type,
            "size": obj.attachment_size,
            "download_url": f"/api/plans/{obj.pk}/attachment/",
        }

    class Meta:
        model = Plan
        fields = [
            "id",
            "plan_type",
            "source",
            "status",
            "title",
            "notes",
            "attachment",
            "external_provider_name",
            "starts_on",
            "ends_on",
            "activated_at",
            "archived_at",
            "created_at",
            "updated_at",
        ]


class PlanCreateSerializer(TrimmedPlanFieldsMixin, serializers.ModelSerializer):
    notes = serializers.CharField(max_length=5000, required=False, allow_blank=True, default="")
    attachment = serializers.FileField(required=False, allow_null=True, write_only=True, validators=[validate_attachment_file])

    class Meta:
        model = Plan
        fields = [
            "plan_type",
            "source",
            "title",
            "notes",
            "attachment",
            "external_provider_name",
            "starts_on",
            "ends_on",
        ]

    def validate(self, attrs):
        allowed_pair = (
            attrs.get("plan_type"),
            attrs.get("source"),
        ) in {
            (Plan.PlanType.NUTRITION, Plan.Source.EXTERNAL_SPECIALIST),
            (Plan.PlanType.WORKOUT, Plan.Source.SELF),
        }
        if not allowed_pair:
            raise serializers.ValidationError(
                {"source": "This plan type and source combination is not available."}
            )
        attrs = validate_dates(attrs)
        if not attrs.get("notes", "").strip() and not attrs.get("attachment"):
            raise serializers.ValidationError(
                {"notes": "Notes or an attachment is required."}
            )
        return attrs

    def create(self, validated_data):
        attachment = validated_data.get("attachment")
        if attachment:
            validated_data.update(
                attachment_original_name=Path(attachment.name).name,
                attachment_content_type=attachment.content_type,
                attachment_size=attachment.size,
            )
        return super().create(validated_data)


class PlanUpdateSerializer(TrimmedPlanFieldsMixin, serializers.ModelSerializer):
    notes = serializers.CharField(max_length=5000, required=False, allow_blank=True)
    attachment = serializers.FileField(required=False, allow_null=True, write_only=True, validators=[validate_attachment_file])
    remove_attachment = serializers.BooleanField(required=False, default=False, write_only=True)
    status = serializers.ChoiceField(
        choices=[Plan.Status.ACTIVE, Plan.Status.ARCHIVED]
    )

    class Meta:
        model = Plan
        fields = [
            "title",
            "notes",
            "attachment",
            "remove_attachment",
            "external_provider_name",
            "starts_on",
            "ends_on",
            "status",
        ]

    def validate(self, attrs):
        attrs = validate_dates(attrs)
        attachment = attrs.get("attachment")
        remove_attachment = attrs.get("remove_attachment", False)
        if attachment and remove_attachment:
            raise serializers.ValidationError(
                {"attachment": "Attachment cannot be replaced and removed together."}
            )
        existing_attachment = bool(self.instance and self.instance.attachment)
        will_have_attachment = bool(attachment) or (existing_attachment and not remove_attachment)
        notes = attrs.get("notes", self.instance.notes if self.instance else "").strip()
        if attrs.get("status") == Plan.Status.ACTIVE and not notes and not will_have_attachment:
            raise serializers.ValidationError(
                {"notes": "An active plan requires notes or an attachment."}
            )
        return attrs

    def update(self, instance, validated_data):
        remove_attachment = validated_data.pop("remove_attachment", False)
        new_attachment = validated_data.get("attachment")
        old_name = instance.attachment.name if instance.attachment else None
        old_storage = instance.attachment.storage if instance.attachment else None

        if remove_attachment:
            validated_data.update(
                attachment=None,
                attachment_original_name="",
                attachment_content_type="",
                attachment_size=0,
            )
        elif new_attachment:
            validated_data.update(
                attachment_original_name=Path(new_attachment.name).name,
                attachment_content_type=new_attachment.content_type,
                attachment_size=new_attachment.size,
            )

        instance = super().update(instance, validated_data)
        if old_name and old_storage and (remove_attachment or new_attachment):
            old_storage.delete(old_name)
        return instance


class NutritionPlanMealItemSerializer(serializers.ModelSerializer):
    meal_type = serializers.CharField(source="meal.meal_type", read_only=True)

    class Meta:
        model = NutritionPlanMealItem
        fields = [
            "id",
            "meal_type",
            "food_name",
            "serving_description",
            "calories",
            "note",
            "sort_order",
            "created_at",
            "updated_at",
        ]


class NutritionPlanMealItemWriteSerializer(serializers.Serializer):
    meal_type = serializers.ChoiceField(choices=NutritionPlanMeal.MealType.choices)
    food_name = serializers.CharField(max_length=120)
    serving_description = serializers.CharField(max_length=120)
    calories = serializers.IntegerField(
        min_value=0,
        max_value=10000,
        required=False,
        allow_null=True,
        default=None,
    )
    note = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        default="",
    )

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
