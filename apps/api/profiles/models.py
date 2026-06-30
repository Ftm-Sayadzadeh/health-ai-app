from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class HealthProfile(models.Model):
    class Goal(models.TextChoices):
        LOSE_WEIGHT = "lose_weight", "Lose weight"
        MAINTAIN_WEIGHT = "maintain_weight", "Maintain weight"
        GAIN_WEIGHT = "gain_weight", "Gain weight"
        BUILD_MUSCLE = "build_muscle", "Build muscle"
        GENERAL_WELLNESS = "general_wellness", "General wellness"

    class ActivityLevel(models.TextChoices):
        SEDENTARY = "sedentary", "Sedentary"
        LIGHT = "light", "Light"
        MODERATE = "moderate", "Moderate"
        HIGH = "high", "High"
        VERY_HIGH = "very_high", "Very high"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="health_profile",
    )
    display_name = models.CharField(max_length=80)
    birth_date = models.DateField()
    height_cm = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(50), MaxValueValidator(250)],
    )
    weight_kg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(20), MaxValueValidator(500)],
    )
    goal = models.CharField(max_length=32, choices=Goal.choices)
    activity_level = models.CharField(max_length=32, choices=ActivityLevel.choices)
    food_preferences = models.TextField(blank=True, default="", max_length=500)
    food_restrictions = models.TextField(blank=True, default="", max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Health profile for {self.user_id}"
