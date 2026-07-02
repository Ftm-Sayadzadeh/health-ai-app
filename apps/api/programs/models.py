from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class NutritionIntake(models.Model):
    class DietaryStyle(models.TextChoices):
        NONE = "none", "No specific style"
        VEGETARIAN = "vegetarian", "Vegetarian"
        VEGAN = "vegan", "Vegan"
        LOW_CARB = "low_carb", "Low carb"
        HIGH_PROTEIN = "high_protein", "High protein preference"
        OTHER = "other", "Other"

    class MealPattern(models.TextChoices):
        REGULAR = "regular", "Regular meals"
        IRREGULAR = "irregular", "Irregular meals"
        SKIPS_BREAKFAST = "skips_breakfast", "Skips breakfast"
        NIGHT_EATING = "night_eating", "Night eating"
        OTHER = "other", "Other"

    class CookingTimeAvailability(models.TextChoices):
        VERY_LOW = "very_low", "Very low"
        MODERATE = "moderate", "Moderate"
        ENOUGH = "enough", "Enough time"

    class CookingFrequency(models.TextChoices):
        RARELY = "rarely", "Rarely"
        FEW_TIMES_WEEKLY = "few_times_weekly", "A few times weekly"
        MOST_DAYS = "most_days", "Most days"

    class BudgetLevel(models.TextChoices):
        ECONOMICAL = "economical", "Economical"
        MODERATE = "moderate", "Moderate"
        FLEXIBLE = "flexible", "Flexible"

    class EatingOutFrequency(models.TextChoices):
        RARELY = "rarely", "Rarely"
        WEEKLY_1_2 = "weekly_1_2", "1 to 2 times weekly"
        WEEKLY_3_5 = "weekly_3_5", "3 to 5 times weekly"
        MOST_DAYS = "most_days", "Most days"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="nutrition_intake",
    )
    preferred_meal_count = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(2), MaxValueValidator(6)]
    )
    meal_pattern = models.CharField(max_length=24, choices=MealPattern.choices)
    dietary_style = models.CharField(max_length=24, choices=DietaryStyle.choices)
    cooking_time_availability = models.CharField(
        max_length=16, choices=CookingTimeAvailability.choices
    )
    cooking_frequency = models.CharField(max_length=24, choices=CookingFrequency.choices)
    budget_level = models.CharField(max_length=16, choices=BudgetLevel.choices)
    eating_out_frequency = models.CharField(
        max_length=16, choices=EatingOutFrequency.choices
    )
    food_allergies = models.TextField(blank=True, default="", max_length=500)
    food_restrictions = models.TextField(blank=True, default="", max_length=500)
    disliked_foods = models.TextField(blank=True, default="", max_length=500)
    favorite_foods_or_cuisines = models.TextField(blank=True, default="", max_length=500)
    notes = models.TextField(blank=True, default="", max_length=1000)
    completed_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Nutrition intake for {self.user_id}"


class WorkoutIntake(models.Model):
    class WorkoutLocation(models.TextChoices):
        HOME = "home", "Home"
        GYM = "gym", "Gym"
        OUTDOOR = "outdoor", "Outdoor"
        MIXED = "mixed", "Mixed"

    class ExperienceLevel(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"

    class EquipmentAccess(models.TextChoices):
        NONE = "none", "No equipment"
        BASIC = "basic", "Basic home equipment"
        DUMBBELLS_BANDS = "dumbbells_bands", "Dumbbells or bands"
        FULL_GYM = "full_gym", "Full gym"

    class WorkoutStyle(models.TextChoices):
        NO_PREFERENCE = "no_preference", "No preference"
        STRENGTH = "strength", "Strength"
        CARDIO = "cardio", "Cardio"
        MOBILITY = "mobility", "Mobility"
        MIXED = "mixed", "Mixed"

    class IntensityPreference(models.TextChoices):
        LIGHT = "light", "Light"
        MODERATE = "moderate", "Moderate"
        CHALLENGING = "challenging", "Challenging"

    class PreferredWorkoutTime(models.TextChoices):
        MORNING = "morning", "Morning"
        MIDDAY = "midday", "Midday"
        EVENING = "evening", "Evening"
        FLEXIBLE = "flexible", "Flexible"

    SESSION_DURATION_CHOICES = [(20, "20"), (30, "30"), (45, "45"), (60, "60"), (90, "90")]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workout_intake",
    )
    workout_location = models.CharField(max_length=16, choices=WorkoutLocation.choices)
    available_days_per_week = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(7)]
    )
    preferred_session_duration = models.PositiveSmallIntegerField(
        choices=SESSION_DURATION_CHOICES
    )
    experience_level = models.CharField(max_length=16, choices=ExperienceLevel.choices)
    equipment_access = models.CharField(max_length=16, choices=EquipmentAccess.choices)
    preferred_workout_style = models.CharField(max_length=20, choices=WorkoutStyle.choices)
    intensity_preference = models.CharField(
        max_length=16, choices=IntensityPreference.choices
    )
    preferred_workout_time = models.CharField(
        max_length=16, choices=PreferredWorkoutTime.choices, blank=True, default=""
    )
    injuries_or_limitations = models.TextField(blank=True, default="", max_length=1000)
    disliked_exercises = models.TextField(blank=True, default="", max_length=500)
    notes = models.TextField(blank=True, default="", max_length=1000)
    completed_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Workout intake for {self.user_id}"
