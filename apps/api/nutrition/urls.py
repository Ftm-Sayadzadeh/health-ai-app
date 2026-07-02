from django.urls import path

from .views import DailyFoodLogView, FoodLogEntryCreateView, FoodLogEntryDetailView


urlpatterns = [
    path("days/<str:log_date>/", DailyFoodLogView.as_view(), name="daily-food-log"),
    path(
        "days/<str:log_date>/entries/",
        FoodLogEntryCreateView.as_view(),
        name="food-log-entry-create",
    ),
    path(
        "entries/<int:entry_id>/",
        FoodLogEntryDetailView.as_view(),
        name="food-log-entry-detail",
    ),
]
