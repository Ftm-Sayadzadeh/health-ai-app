import re
import secrets
from importlib import import_module

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core.exceptions import ValidationError
from django.utils import timezone


IRAN_MOBILE_RE = re.compile(r"^\+989\d{9}$")
DIGIT_TRANSLATION = str.maketrans(
    "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩",
    "01234567890123456789",
)


class OTPError(Exception):
    pass


class OTPThrottleError(OTPError):
    pass


def normalize_phone_number(raw_phone_number: str) -> str:
    value = str(raw_phone_number or "").strip().translate(DIGIT_TRANSLATION)
    value = re.sub(r"[\s\-\(\)]", "", value)

    if value.startswith("09") and len(value) == 11:
        value = f"+98{value[1:]}"
    elif value.startswith("989") and len(value) == 12:
        value = f"+{value}"
    elif value.startswith("+989") and len(value) == 13:
        pass
    else:
        raise ValidationError("Enter a valid Iranian mobile number.")

    if not IRAN_MOBILE_RE.fullmatch(value):
        raise ValidationError("Enter a valid Iranian mobile number.")

    return value


def generate_otp() -> str:
    upper_bound = 10 ** settings.OTP_LENGTH
    return f"{secrets.randbelow(upper_bound):0{settings.OTP_LENGTH}d}"


def get_sms_provider():
    module_path, class_name = settings.SMS_PROVIDER_BACKEND.rsplit(".", 1)
    module = import_module(module_path)
    provider_class = getattr(module, class_name)
    return provider_class()


def create_otp_challenge(phone_number: str):
    from .models import OTPChallenge

    normalized_phone = normalize_phone_number(phone_number)
    now = timezone.now()
    latest_challenge = (
        OTPChallenge.objects.filter(
            phone_number=normalized_phone,
            purpose=OTPChallenge.PURPOSE_LOGIN,
        )
        .order_by("-last_sent_at")
        .first()
    )

    if latest_challenge and (
        now - latest_challenge.last_sent_at
    ).total_seconds() < settings.OTP_RESEND_THROTTLE_SECONDS:
        raise OTPThrottleError("Please wait before requesting another OTP.")

    otp = generate_otp()
    challenge = OTPChallenge.objects.create(
        phone_number=normalized_phone,
        code_hash=make_password(otp),
        expires_at=now + timezone.timedelta(seconds=settings.OTP_EXPIRY_SECONDS),
        last_sent_at=now,
        purpose=OTPChallenge.PURPOSE_LOGIN,
    )

    if not settings.DEBUG:
        get_sms_provider().send_otp(normalized_phone, otp)

    return challenge, otp


def verify_otp(phone_number: str, otp: str):
    from .models import OTPChallenge, User

    normalized_phone = normalize_phone_number(phone_number)
    challenge = (
        OTPChallenge.objects.filter(
            phone_number=normalized_phone,
            purpose=OTPChallenge.PURPOSE_LOGIN,
            consumed_at__isnull=True,
        )
        .order_by("-created_at")
        .first()
    )

    if challenge is None:
        raise OTPError("Invalid or expired OTP.")
    if challenge.is_expired:
        raise OTPError("Invalid or expired OTP.")
    if challenge.has_too_many_attempts:
        raise OTPError("Invalid or expired OTP.")

    if not check_password(otp, challenge.code_hash):
        challenge.attempt_count += 1
        challenge.save(update_fields=["attempt_count"])
        raise OTPError("Invalid or expired OTP.")

    challenge.consume()
    user, created = User.objects.get_or_create(
        phone_number=normalized_phone,
        defaults={"role": User.Role.NORMAL},
    )
    if created:
        user.set_unusable_password()
        user.save(update_fields=["password"])

    return user
