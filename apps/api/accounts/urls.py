from django.urls import path

from .views import me, request_otp, verify_otp_view


urlpatterns = [
    path("request-otp/", request_otp, name="request-otp"),
    path("verify-otp/", verify_otp_view, name="verify-otp"),
    path("me/", me, name="auth-me"),
]
