from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import F, Q
from pathlib import Path
from uuid import uuid4


def plan_attachment_upload_to(instance, filename):
    suffix = Path(filename).suffix.lower()
    return f"plans/{instance.owner_id}/{uuid4().hex}{suffix}"


class Plan(models.Model):
    class PlanType(models.TextChoices):
        NUTRITION = "nutrition", "Nutrition"
        WORKOUT = "workout", "Workout"

    class Source(models.TextChoices):
        SELF = "self", "Self"
        COACH = "coach", "Coach"
        ADMIN = "admin", "Admin"
        EXTERNAL_SPECIALIST = "external_specialist", "External specialist"
        SYSTEM_FUTURE = "system_future", "Future system"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        ARCHIVED = "archived", "Archived"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="plans",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_plans",
        null=True,
        blank=True,
    )
    plan_type = models.CharField(max_length=16, choices=PlanType.choices)
    source = models.CharField(max_length=24, choices=Source.choices)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    title = models.CharField(max_length=120)
    notes = models.TextField(max_length=5000)
    attachment = models.FileField(
        upload_to=plan_attachment_upload_to,
        null=True,
        blank=True,
    )
    attachment_original_name = models.CharField(max_length=255, blank=True, default="")
    attachment_content_type = models.CharField(max_length=100, blank=True, default="")
    attachment_size = models.PositiveBigIntegerField(default=0)
    external_provider_name = models.CharField(max_length=120, blank=True, default="")
    starts_on = models.DateField(null=True, blank=True)
    ends_on = models.DateField(null=True, blank=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["owner", "plan_type", "status"]),
            models.Index(fields=["owner", "updated_at"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(ends_on__isnull=True)
                    | Q(starts_on__isnull=True)
                    | Q(ends_on__gte=F("starts_on"))
                ),
                name="plan_dates_in_order",
            )
        ]

    def __str__(self):
        return f"{self.plan_type}: {self.title}"


class NutritionPlanMeal(models.Model):
    class MealType(models.TextChoices):
        BREAKFAST = "breakfast", "Breakfast"
        LUNCH = "lunch", "Lunch"
        DINNER = "dinner", "Dinner"
        SNACK = "snack", "Snack"
        OTHER = "other", "Other"

    plan = models.ForeignKey(
        Plan,
        on_delete=models.CASCADE,
        related_name="nutrition_meals",
    )
    meal_type = models.CharField(max_length=16, choices=MealType.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(
                fields=["plan", "meal_type"],
                name="unique_nutrition_meal_per_plan",
            )
        ]

    def __str__(self):
        return f"{self.plan_id}: {self.meal_type}"


class NutritionPlanMealItem(models.Model):
    meal = models.ForeignKey(
        NutritionPlanMeal,
        on_delete=models.CASCADE,
        related_name="items",
    )
    food_name = models.CharField(max_length=120)
    serving_description = models.CharField(max_length=120)
    calories = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10000)],
    )
    note = models.TextField(blank=True, default="", max_length=500)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.meal_id}: {self.food_name}"
