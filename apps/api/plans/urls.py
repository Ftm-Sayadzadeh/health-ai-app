from django.urls import path

from .views import PlanAttachmentDownloadView, PlanDetailView, PlanListCreateView


urlpatterns = [
    path("", PlanListCreateView.as_view(), name="plan-list-create"),
    path("<int:plan_id>/", PlanDetailView.as_view(), name="plan-detail"),
    path(
        "<int:plan_id>/attachment/",
        PlanAttachmentDownloadView.as_view(),
        name="plan-attachment-download",
    ),
]
