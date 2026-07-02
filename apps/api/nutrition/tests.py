from datetime import date, timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from accounts.models import User
from profiles.models import HealthProfile

from .models import FoodLogDay, FoodLogEntry


class NutritionAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = self.create_user_with_profile("09123456789")
        self.other_user = self.create_user_with_profile("09121111111")
        self.today = timezone.localdate()
        self.daily_url = reverse("daily-food-log", args=[self.today.isoformat()])
        self.create_url = reverse(
            "food-log-entry-create", args=[self.today.isoformat()]
        )
        self.payload = {
            "meal_type": FoodLogEntry.MealType.BREAKFAST,
            "food_name": "Bread and cheese",
            "serving_description": "One plate",
            "calories": 320,
            "note": "",
        }

    @staticmethod
    def create_user_with_profile(phone_number, role=User.Role.NORMAL):
        user = User.objects.create_user(phone_number=phone_number, role=role)
        HealthProfile.objects.create(
            user=user,
            display_name="Test user",
            birth_date=date(1990, 1, 1),
            height_cm="170.00",
            weight_kg="70.00",
            goal=HealthProfile.Goal.GENERAL_WELLNESS,
            activity_level=HealthProfile.ActivityLevel.MODERATE,
        )
        return user

    def authenticate(self, user=None):
        self.client.force_authenticate(user or self.user)

    def create_entry(self, payload=None):
        self.authenticate()
        return self.client.post(self.create_url, payload or self.payload, format="json")

    def test_endpoints_require_authentication(self):
        self.assertEqual(self.client.get(self.daily_url).status_code, 401)
        self.assertEqual(
            self.client.post(self.create_url, self.payload, format="json").status_code,
            401,
        )

    def test_only_normal_users_with_health_profile_are_allowed(self):
        coach = self.create_user_with_profile("09122222222", User.Role.COACH)
        self.authenticate(coach)
        self.assertEqual(self.client.get(self.daily_url).status_code, 403)

        incomplete_user = User.objects.create_user(phone_number="09123333333")
        self.authenticate(incomplete_user)
        self.assertEqual(self.client.get(self.daily_url).status_code, 403)

    def test_empty_valid_day_returns_zero_without_creating_row(self):
        self.authenticate()
        response = self.client.get(self.daily_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["date"], self.today.isoformat())
        self.assertEqual(response.json()["total_calories"], 0)
        self.assertEqual(response.json()["entry_count"], 0)
        self.assertEqual(response.json()["entries"], [])
        self.assertEqual(
            response.json()["meal_totals"],
            {meal_type: 0 for meal_type, _label in FoodLogEntry.MealType.choices},
        )
        self.assertEqual(FoodLogDay.objects.count(), 0)

    def test_rejects_malformed_invalid_and_future_dates(self):
        self.authenticate()
        dates = [
            "2026-7-2",
            "not-a-date",
            "2026-02-30",
            (self.today + timedelta(days=1)).isoformat(),
        ]
        for value in dates:
            with self.subTest(value=value):
                response = self.client.get(reverse("daily-food-log", args=[value]))
                self.assertEqual(response.status_code, 400)
                self.assertIn("date", response.json())

    def test_create_entry_creates_day_and_trims_text(self):
        response = self.create_entry(
            {
                **self.payload,
                "food_name": "  Bread and cheese  ",
                "serving_description": "  One plate  ",
                "note": "  Morning meal  ",
            }
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(FoodLogDay.objects.count(), 1)
        entry = FoodLogEntry.objects.get()
        self.assertEqual(entry.log_day.user, self.user)
        self.assertEqual(entry.food_name, "Bread and cheese")
        self.assertEqual(entry.serving_description, "One plate")
        self.assertEqual(entry.note, "Morning meal")

    def test_daily_and_meal_totals_are_derived_from_entries(self):
        self.create_entry()
        self.create_entry(
            {
                **self.payload,
                "meal_type": FoodLogEntry.MealType.SNACK,
                "food_name": "Nuts",
                "serving_description": "One handful",
                "calories": 300,
            }
        )

        response = self.client.get(self.daily_url)

        self.assertEqual(response.json()["total_calories"], 620)
        self.assertEqual(response.json()["entry_count"], 2)
        self.assertEqual(response.json()["meal_totals"]["breakfast"], 320)
        self.assertEqual(response.json()["meal_totals"]["snack"], 300)

    def test_logs_and_entry_details_are_owner_scoped(self):
        create_response = self.create_entry()
        detail_url = reverse("food-log-entry-detail", args=[create_response.json()["id"]])
        self.authenticate(self.other_user)

        daily_response = self.client.get(self.daily_url)
        self.assertEqual(daily_response.status_code, 200)
        self.assertEqual(daily_response.json()["entries"], [])
        self.assertEqual(self.client.get(detail_url).status_code, 404)
        self.assertEqual(
            self.client.put(detail_url, self.payload, format="json").status_code, 404
        )
        self.assertEqual(self.client.delete(detail_url).status_code, 404)

    def test_validates_required_fields_choices_ranges_and_lengths(self):
        self.authenticate()
        response = self.client.post(
            self.create_url,
            {
                "meal_type": "unknown",
                "food_name": "   ",
                "serving_description": "   ",
                "calories": 10001,
                "note": "x" * 501,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        for field in [
            "meal_type",
            "food_name",
            "serving_description",
            "calories",
            "note",
        ]:
            self.assertIn(field, response.json())

        negative_response = self.client.post(
            self.create_url,
            {**self.payload, "calories": -1},
            format="json",
        )
        self.assertEqual(negative_response.status_code, 400)
        self.assertIn("calories", negative_response.json())

    def test_accepts_calorie_boundaries_and_blank_note(self):
        zero_response = self.create_entry({**self.payload, "calories": 0, "note": ""})
        maximum_response = self.create_entry(
            {
                **self.payload,
                "food_name": "Large entry",
                "calories": 10000,
                "note": "",
            }
        )

        self.assertEqual(zero_response.status_code, 201)
        self.assertEqual(maximum_response.status_code, 201)

    def test_update_changes_entry_and_recalculates_meal_total(self):
        create_response = self.create_entry()
        detail_url = reverse("food-log-entry-detail", args=[create_response.json()["id"]])

        response = self.client.put(
            detail_url,
            {
                **self.payload,
                "meal_type": FoodLogEntry.MealType.DINNER,
                "food_name": "Updated meal",
                "calories": 450,
            },
            format="json",
        )
        daily_response = self.client.get(self.daily_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["food_name"], "Updated meal")
        self.assertEqual(daily_response.json()["total_calories"], 450)
        self.assertEqual(daily_response.json()["meal_totals"]["breakfast"], 0)
        self.assertEqual(daily_response.json()["meal_totals"]["dinner"], 450)

    def test_delete_last_entry_removes_empty_day(self):
        create_response = self.create_entry()
        detail_url = reverse("food-log-entry-detail", args=[create_response.json()["id"]])

        response = self.client.delete(detail_url)

        self.assertEqual(response.status_code, 204)
        self.assertEqual(FoodLogEntry.objects.count(), 0)
        self.assertEqual(FoodLogDay.objects.count(), 0)
