from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import me, request_otp, verify_otp_view


urlpatterns = [
    path("request-otp/", request_otp, name="request-otp"),
    path("verify-otp/", verify_otp_view, name="verify-otp"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", me, name="auth-me"),
]
