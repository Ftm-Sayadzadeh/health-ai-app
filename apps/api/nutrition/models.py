from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class FoodLogDay(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="food_log_days",
    )
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "date"], name="unique_food_log_day_per_user"
            )
        ]
        indexes = [models.Index(fields=["user", "-date"])]

    def __str__(self):
        return f"Food log for {self.user_id} on {self.date}"


class FoodLogEntry(models.Model):
    class MealType(models.TextChoices):
        BREAKFAST = "breakfast", "Breakfast"
        LUNCH = "lunch", "Lunch"
        DINNER = "dinner", "Dinner"
        SNACK = "snack", "Snack"
        OTHER = "other", "Other"

    log_day = models.ForeignKey(
        FoodLogDay,
        on_delete=models.CASCADE,
        related_name="entries",
    )
    meal_type = models.CharField(max_length=16, choices=MealType.choices)
    food_name = models.CharField(max_length=120)
    serving_description = models.CharField(max_length=120)
    calories = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10000)]
    )
    note = models.TextField(blank=True, default="", max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at", "id"]

    def __str__(self):
        return f"{self.food_name} ({self.calories} kcal)"
