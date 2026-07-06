from django.urls import path

from .views import (
    ActiveNutritionPlanStructureView,
    NutritionPlanMealItemCreateView,
    NutritionPlanMealItemDetailView,
    NutritionPlanStructureView,
    PlanAttachmentDownloadView,
    PlanDetailView,
    PlanListCreateView,
)


urlpatterns = [
    path("", PlanListCreateView.as_view(), name="plan-list-create"),
    path(
        "active-nutrition-structure/",
        ActiveNutritionPlanStructureView.as_view(),
        name="active-nutrition-plan-structure",
    ),
    path("<int:plan_id>/", PlanDetailView.as_view(), name="plan-detail"),
    path(
        "<int:plan_id>/attachment/",
        PlanAttachmentDownloadView.as_view(),
        name="plan-attachment-download",
    ),
    path(
        "<int:plan_id>/nutrition-structure/",
        NutritionPlanStructureView.as_view(),
        name="nutrition-plan-structure",
    ),
    path(
        "<int:plan_id>/nutrition-items/",
        NutritionPlanMealItemCreateView.as_view(),
        name="nutrition-plan-item-create",
    ),
    path(
        "<int:plan_id>/nutrition-items/<int:item_id>/",
        NutritionPlanMealItemDetailView.as_view(),
        name="nutrition-plan-item-detail",
    ),
]
