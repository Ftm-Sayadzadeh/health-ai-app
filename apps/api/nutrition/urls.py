from django.urls import path

from .views import (
    CustomFoodDetailView,
    CustomFoodListCreateView,
    DailyFoodLogView,
    FoodLogEntryCreateView,
    FoodLogEntryDetailView,
    RecentFoodListView,
)


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
    path(
        "custom-foods/",
        CustomFoodListCreateView.as_view(),
        name="custom-food-list-create",
    ),
    path(
        "custom-foods/<int:food_id>/",
        CustomFoodDetailView.as_view(),
        name="custom-food-detail",
    ),
    path("recent-foods/", RecentFoodListView.as_view(), name="recent-food-list"),
]
