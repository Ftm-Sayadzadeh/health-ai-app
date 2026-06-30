from datetime import date, timedelta

from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User

from .models import HealthProfile
from .serializers import shift_years


class HealthProfileAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(phone_number="09123456789")
        self.other_user = User.objects.create_user(phone_number="09121111111")
        self.url = reverse("health-profile-detail")
        self.payload = {
            "display_name": "Sara",
            "birth_date": "1995-06-15",
            "height_cm": "168.50",
            "weight_kg": "62.25",
            "goal": HealthProfile.Goal.GENERAL_WELLNESS,
            "activity_level": HealthProfile.ActivityLevel.MODERATE,
            "food_preferences": "Vegetarian meals",
            "food_restrictions": "",
        }

    def test_endpoint_requires_authentication(self):
        get_response = self.client.get(self.url)
        put_response = self.client.put(self.url, self.payload, format="json")

        self.assertEqual(get_response.status_code, 401)
        self.assertEqual(put_response.status_code, 401)

    def test_get_returns_404_when_profile_is_missing(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "Health profile not found."})

    def test_put_creates_profile_for_authenticated_user(self):
        self.client.force_authenticate(self.user)

        response = self.client.put(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, 201)
        profile = HealthProfile.objects.get()
        self.assertEqual(profile.user, self.user)
        self.assertEqual(response.json()["height_cm"], "168.50")
        self.assertEqual(response.json()["weight_kg"], "62.25")
        self.assertEqual(response.json()["food_restrictions"], "")

    def test_put_updates_profile_without_creating_duplicate(self):
        self.client.force_authenticate(self.user)
        self.client.put(self.url, self.payload, format="json")
        updated_payload = {**self.payload, "display_name": "Sara Updated", "weight_kg": "64.00"}

        response = self.client.put(self.url, updated_payload, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(HealthProfile.objects.count(), 1)
        self.assertEqual(response.json()["display_name"], "Sara Updated")
        self.assertEqual(response.json()["weight_kg"], "64.00")

    def test_profile_is_isolated_to_authenticated_owner(self):
        self.client.force_authenticate(self.user)
        self.client.put(self.url, self.payload, format="json")
        self.client.force_authenticate(self.other_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 404)
        self.assertEqual(HealthProfile.objects.get().user, self.user)

    def test_required_fields_are_enforced(self):
        self.client.force_authenticate(self.user)

        response = self.client.put(self.url, {}, format="json")

        self.assertEqual(response.status_code, 400)
        for field in [
            "display_name",
            "birth_date",
            "height_cm",
            "weight_kg",
            "goal",
            "activity_level",
        ]:
            self.assertIn(field, response.json())

    def test_optional_text_fields_accept_blank_values(self):
        self.client.force_authenticate(self.user)
        payload = {**self.payload, "food_preferences": "", "food_restrictions": ""}

        response = self.client.put(self.url, payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["food_preferences"], "")
        self.assertEqual(response.json()["food_restrictions"], "")

    def test_rejects_invalid_measurements_and_choices(self):
        self.client.force_authenticate(self.user)
        payload = {
            **self.payload,
            "height_cm": "49.99",
            "weight_kg": "500.01",
            "goal": "unknown",
            "activity_level": "unknown",
        }

        response = self.client.put(self.url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("height_cm", response.json())
        self.assertIn("weight_kg", response.json())
        self.assertIn("goal", response.json())
        self.assertIn("activity_level", response.json())

    def test_rejects_birth_date_younger_than_18(self):
        self.client.force_authenticate(self.user)
        birth_date = shift_years(timezone.localdate(), -18) + timedelta(days=1)
        payload = {**self.payload, "birth_date": birth_date.isoformat()}

        response = self.client.put(self.url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("birth_date", response.json())

    def test_rejects_birth_date_older_than_120(self):
        self.client.force_authenticate(self.user)
        birth_date = shift_years(timezone.localdate(), -121).isoformat()

        response = self.client.put(
            self.url,
            {**self.payload, "birth_date": birth_date},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("birth_date", response.json())

    def test_accepts_exact_age_boundaries(self):
        self.client.force_authenticate(self.user)

        for years, expected_status in [(18, 201), (120, 200)]:
            with self.subTest(years=years):
                response = self.client.put(
                    self.url,
                    {
                        **self.payload,
                        "birth_date": shift_years(timezone.localdate(), -years).isoformat(),
                    },
                    format="json",
                )
                self.assertEqual(response.status_code, expected_status)

    def test_rejects_optional_text_over_500_characters(self):
        self.client.force_authenticate(self.user)

        response = self.client.put(
            self.url,
            {**self.payload, "food_preferences": "x" * 501},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("food_preferences", response.json())


class HealthProfileAuthStateTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(phone_number="09123456789")

    def test_me_reports_profile_state_before_and_after_creation(self):
        self.client.force_authenticate(self.user)

        before_response = self.client.get(reverse("auth-me"))
        HealthProfile.objects.create(
            user=self.user,
            display_name="Sara",
            birth_date=date(1995, 6, 15),
            height_cm="168.50",
            weight_kg="62.25",
            goal=HealthProfile.Goal.GENERAL_WELLNESS,
            activity_level=HealthProfile.ActivityLevel.MODERATE,
        )
        after_response = self.client.get(reverse("auth-me"))

        self.assertFalse(before_response.json()["has_health_profile"])
        self.assertTrue(after_response.json()["has_health_profile"])

    @override_settings(DEBUG=True)
    def test_otp_verification_includes_profile_state(self):
        HealthProfile.objects.create(
            user=self.user,
            display_name="Sara",
            birth_date=date(1995, 6, 15),
            height_cm="168.50",
            weight_kg="62.25",
            goal=HealthProfile.Goal.GENERAL_WELLNESS,
            activity_level=HealthProfile.ActivityLevel.MODERATE,
        )
        otp_response = self.client.post(
            reverse("request-otp"),
            {"phone_number": self.user.phone_number},
            format="json",
        )

        verify_response = self.client.post(
            reverse("verify-otp"),
            {
                "phone_number": self.user.phone_number,
                "otp": otp_response.json()["otp"],
            },
            format="json",
        )

        self.assertEqual(verify_response.status_code, 200)
        self.assertTrue(verify_response.json()["user"]["has_health_profile"])
