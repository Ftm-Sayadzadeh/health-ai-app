from django.conf import settings
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RequestOTPSerializer, UserSerializer, VerifyOTPSerializer
from .services import OTPError, OTPThrottleError, create_otp_challenge, verify_otp


@api_view(["POST"])
@permission_classes([AllowAny])
def request_otp(request):
    serializer = RequestOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        _challenge, otp = create_otp_challenge(serializer.validated_data["phone_number"])
    except OTPThrottleError as exc:
        raise serializers.ValidationError({"phone_number": [str(exc)]}) from exc

    response_data = {
        "detail": "OTP sent.",
        "expires_in_seconds": settings.OTP_EXPIRY_SECONDS,
    }
    if settings.DEBUG:
        response_data["otp"] = otp

    return Response(response_data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp_view(request):
    serializer = VerifyOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        user = verify_otp(
            serializer.validated_data["phone_number"],
            serializer.validated_data["otp"],
        )
    except OTPError as exc:
        raise serializers.ValidationError({"otp": [str(exc)]}) from exc

    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)
