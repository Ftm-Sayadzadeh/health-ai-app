from django.urls import include, path


urlpatterns = [
    path("api/auth/", include("accounts.urls")),
    path("api/health/", include("health.urls")),
    path("api/health-profile/", include("profiles.urls")),
    path("api/program-intakes/", include("programs.urls")),
    path("api/plans/", include("plans.urls")),
    path("api/nutrition/", include("nutrition.urls")),
]
