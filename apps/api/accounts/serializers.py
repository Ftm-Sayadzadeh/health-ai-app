from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import User
from .services import normalize_phone_number


class PhoneNumberSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=32)

    def validate_phone_number(self, value):
        try:
            return normalize_phone_number(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc


class RequestOTPSerializer(PhoneNumberSerializer):
    pass


class VerifyOTPSerializer(PhoneNumberSerializer):
    otp = serializers.RegexField(r"^\d{6}$", min_length=6, max_length=6)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "phone_number", "role"]
