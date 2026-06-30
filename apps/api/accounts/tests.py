from unittest.mock import patch

from django.conf import settings
from django.contrib.auth.hashers import check_password
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OTPChallenge, User
from .services import normalize_phone_number


class PhoneNormalizationTests(TestCase):
    def test_normalizes_local_mobile_format(self):
        self.assertEqual(normalize_phone_number("09123456789"), "+989123456789")

    def test_normalizes_plus_iran_mobile_format(self):
        self.assertEqual(normalize_phone_number("+989123456789"), "+989123456789")

    def test_normalizes_iran_mobile_without_plus_format(self):
        self.assertEqual(normalize_phone_number("989123456789"), "+989123456789")

    def test_request_rejects_invalid_phone_number(self):
        response = APIClient().post(
            reverse("request-otp"),
            {"phone_number": "12345"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)


class OTPFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.phone_number = "09123456789"
        self.normalized_phone = "+989123456789"

    @override_settings(DEBUG=True)
    def test_otp_request_creates_challenge(self):
        response = self.client.post(
            reverse("request-otp"),
            {"phone_number": self.phone_number},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(OTPChallenge.objects.count(), 1)
        self.assertEqual(OTPChallenge.objects.get().phone_number, self.normalized_phone)

    @override_settings(DEBUG=True)
    def test_otp_request_stores_code_hashed_not_plaintext(self):
        response = self.client.post(
            reverse("request-otp"),
            {"phone_number": self.phone_number},
            format="json",
        )
        otp = response.json()["otp"]
        challenge = OTPChallenge.objects.get()

        self.assertNotEqual(challenge.code_hash, otp)
        self.assertTrue(check_password(otp, challenge.code_hash))

    @override_settings(DEBUG=True)
    def test_debug_response_includes_otp(self):
        response = self.client.post(
            reverse("request-otp"),
            {"phone_number": self.phone_number},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("otp", response.json())

    @override_settings(DEBUG=False)
    @patch("accounts.sms.NullSMSProvider.send_otp")
    def test_production_response_does_not_include_otp(self, mock_send_otp):
        response = self.client.post(
            reverse("request-otp"),
            {"phone_number": self.phone_number},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("otp", response.json())
        mock_send_otp.assert_called_once()

    @override_settings(DEBUG=True)
    def test_resend_throttle_blocks_repeated_request_within_60_seconds(self):
        first_response = self.client.post(
            reverse("request-otp"),
            {"phone_number": self.phone_number},
            format="json",
        )
        second_response = self.client.post(
            reverse("request-otp"),
            {"phone_number": self.phone_number},
            format="json",
        )

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(second_response.status_code, 400)

    @override_settings(DEBUG=True)
    def test_valid_otp_verify_returns_access_and_refresh_tokens(self):
        otp = self._request_otp()

        response = self.client.post(
            reverse("verify-otp"),
            {"phone_number": self.phone_number, "otp": otp},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.json())
        self.assertIn("refresh", response.json())

    @override_settings(DEBUG=True)
    def test_valid_otp_verify_creates_normal_user_if_missing(self):
        otp = self._request_otp()

        response = self.client.post(
            reverse("verify-otp"),
            {"phone_number": self.phone_number, "otp": otp},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        user = User.objects.get(phone_number=self.normalized_phone)
        self.assertEqual(user.role, User.Role.NORMAL)
        self.assertEqual(response.json()["user"]["role"], User.Role.NORMAL)

    @override_settings(DEBUG=True)
    def test_otp_is_consumed_after_successful_verify(self):
        otp = self._request_otp()

        response = self.client.post(
            reverse("verify-otp"),
            {"phone_number": self.phone_number, "otp": otp},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(OTPChallenge.objects.get().consumed_at)

    @override_settings(DEBUG=True)
    def test_reusing_consumed_otp_fails(self):
        otp = self._request_otp()

        first_response = self.client.post(
            reverse("verify-otp"),
            {"phone_number": self.phone_number, "otp": otp},
            format="json",
        )
        second_response = self.client.post(
            reverse("verify-otp"),
            {"phone_number": self.phone_number, "otp": otp},
            format="json",
        )

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(second_response.status_code, 400)

    @override_settings(DEBUG=True)
    def test_wrong_otp_returns_400(self):
        self._request_otp()

        response = self.client.post(
            reverse("verify-otp"),
            {"phone_number": self.phone_number, "otp": "000000"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    @override_settings(DEBUG=True)
    def test_wrong_otp_increments_attempt_count(self):
        self._request_otp()

        self.client.post(
            reverse("verify-otp"),
            {"phone_number": self.phone_number, "otp": "000000"},
            format="json",
        )

        self.assertEqual(OTPChallenge.objects.get().attempt_count, 1)

    @override_settings(DEBUG=True)
    def test_expired_otp_returns_400(self):
        otp = self._request_otp()
        OTPChallenge.objects.update(expires_at=timezone.now() - timezone.timedelta(seconds=1))

        response = self.client.post(
            reverse("verify-otp"),
            {"phone_number": self.phone_number, "otp": otp},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    @override_settings(DEBUG=True)
    def test_too_many_attempts_returns_400(self):
        otp = self._request_otp()
        OTPChallenge.objects.update(attempt_count=settings.OTP_MAX_ATTEMPTS)

        response = self.client.post(
            reverse("verify-otp"),
            {"phone_number": self.phone_number, "otp": otp},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_me_returns_401_without_token(self):
        response = self.client.get(reverse("auth-me"))

        self.assertEqual(response.status_code, 401)

    def test_me_returns_current_user_with_valid_access_token(self):
        user = User.objects.create_user(phone_number=self.phone_number)
        access_token = RefreshToken.for_user(user).access_token

        response = self.client.get(
            reverse("auth-me"),
            HTTP_AUTHORIZATION=f"Bearer {access_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "id": user.id,
                "phone_number": self.normalized_phone,
                "role": User.Role.NORMAL,
                "has_health_profile": False,
            },
        )

    def _request_otp(self):
        response = self.client.post(
            reverse("request-otp"),
            {"phone_number": self.phone_number},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        return response.json()["otp"]
