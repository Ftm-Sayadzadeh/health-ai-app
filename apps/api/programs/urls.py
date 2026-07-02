from django.urls import path

from .views import NutritionIntakeView, ProgramIntakeStatusView, WorkoutIntakeView


urlpatterns = [
    path("status/", ProgramIntakeStatusView.as_view(), name="program-intake-status"),
    path("nutrition/", NutritionIntakeView.as_view(), name="nutrition-intake-detail"),
    path("workout/", WorkoutIntakeView.as_view(), name="workout-intake-detail"),
]
