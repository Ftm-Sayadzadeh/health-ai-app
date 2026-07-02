from datetime import date

from django.urls import reverse
from rest_framework.test import APIClient, APITestCase

from accounts.models import User
from profiles.models import HealthProfile

from .models import NutritionIntake, WorkoutIntake


class ProgramIntakeAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = self.create_user_with_profile("09123456789")
        self.other_user = self.create_user_with_profile("09121111111")
        self.nutrition_url = reverse("nutrition-intake-detail")
        self.workout_url = reverse("workout-intake-detail")
        self.status_url = reverse("program-intake-status")
        self.nutrition_payload = {
            "preferred_meal_count": 3,
            "meal_pattern": NutritionIntake.MealPattern.REGULAR,
            "dietary_style": NutritionIntake.DietaryStyle.NONE,
            "cooking_time_availability": NutritionIntake.CookingTimeAvailability.MODERATE,
            "cooking_frequency": NutritionIntake.CookingFrequency.FEW_TIMES_WEEKLY,
            "budget_level": NutritionIntake.BudgetLevel.MODERATE,
            "eating_out_frequency": NutritionIntake.EatingOutFrequency.WEEKLY_1_2,
            "food_allergies": "",
            "food_restrictions": "",
            "disliked_foods": "olives",
            "favorite_foods_or_cuisines": "Persian food",
            "notes": "",
        }
        self.workout_payload = {
            "workout_location": WorkoutIntake.WorkoutLocation.HOME,
            "available_days_per_week": 3,
            "preferred_session_duration": 45,
            "experience_level": WorkoutIntake.ExperienceLevel.BEGINNER,
            "equipment_access": WorkoutIntake.EquipmentAccess.BASIC,
            "preferred_workout_style": WorkoutIntake.WorkoutStyle.MIXED,
            "intensity_preference": WorkoutIntake.IntensityPreference.MODERATE,
            "preferred_workout_time": WorkoutIntake.PreferredWorkoutTime.EVENING,
            "injuries_or_limitations": "",
            "disliked_exercises": "",
            "notes": "",
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

    def test_endpoints_require_authentication(self):
        for url in [self.status_url, self.nutrition_url, self.workout_url]:
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 401)

    def test_only_normal_users_with_health_profile_are_allowed(self):
        coach = self.create_user_with_profile("09122222222", User.Role.COACH)
        self.client.force_authenticate(coach)
        self.assertEqual(self.client.get(self.status_url).status_code, 403)

        incomplete_user = User.objects.create_user(phone_number="09123333333")
        self.client.force_authenticate(incomplete_user)
        self.assertEqual(self.client.get(self.status_url).status_code, 403)

    def test_missing_intakes_return_404(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get(self.nutrition_url).status_code, 404)
        self.assertEqual(self.client.get(self.workout_url).status_code, 404)

    def test_nutrition_intake_create_update_and_trim(self):
        self.client.force_authenticate(self.user)
        response = self.client.put(
            self.nutrition_url,
            {**self.nutrition_payload, "food_allergies": "  peanuts  "},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["food_allergies"], "peanuts")
        self.assertIsNotNone(response.json()["completed_at"])

        response = self.client.put(
            self.nutrition_url,
            {**self.nutrition_payload, "preferred_meal_count": 4},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(NutritionIntake.objects.count(), 1)
        self.assertEqual(response.json()["preferred_meal_count"], 4)

    def test_workout_intake_create_update_and_blank_optional_text(self):
        self.client.force_authenticate(self.user)
        response = self.client.put(self.workout_url, self.workout_payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["injuries_or_limitations"], "")

        response = self.client.put(
            self.workout_url,
            {**self.workout_payload, "available_days_per_week": 5},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(WorkoutIntake.objects.count(), 1)
        self.assertEqual(response.json()["available_days_per_week"], 5)

    def test_intakes_are_isolated_to_the_authenticated_owner(self):
        self.client.force_authenticate(self.user)
        self.client.put(self.nutrition_url, self.nutrition_payload, format="json")
        self.client.force_authenticate(self.other_user)
        self.assertEqual(self.client.get(self.nutrition_url).status_code, 404)

    def test_status_reports_independent_completion(self):
        self.client.force_authenticate(self.user)
        empty_response = self.client.get(self.status_url)
        self.assertEqual(empty_response.status_code, 200)
        self.assertFalse(empty_response.json()["nutrition"]["completed"])
        self.assertFalse(empty_response.json()["workout"]["completed"])

        self.client.put(self.nutrition_url, self.nutrition_payload, format="json")
        response = self.client.get(self.status_url)
        self.assertTrue(response.json()["nutrition"]["completed"])
        self.assertIsNotNone(response.json()["nutrition"]["updated_at"])
        self.assertFalse(response.json()["workout"]["completed"])

    def test_nutrition_validation_rejects_ranges_choices_and_long_text(self):
        self.client.force_authenticate(self.user)
        response = self.client.put(
            self.nutrition_url,
            {
                **self.nutrition_payload,
                "preferred_meal_count": 7,
                "dietary_style": "unknown",
                "food_allergies": "x" * 501,
                "meal_pattern": "unknown",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("preferred_meal_count", response.json())
        self.assertIn("dietary_style", response.json())
        self.assertIn("meal_pattern", response.json())
        self.assertIn("food_allergies", response.json())

    def test_workout_validation_rejects_ranges_choices_and_long_text(self):
        self.client.force_authenticate(self.user)
        response = self.client.put(
            self.workout_url,
            {
                **self.workout_payload,
                "available_days_per_week": 0,
                "preferred_session_duration": 35,
                "workout_location": "unknown",
                "injuries_or_limitations": "x" * 1001,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("available_days_per_week", response.json())
        self.assertIn("preferred_session_duration", response.json())
        self.assertIn("workout_location", response.json())
        self.assertIn("injuries_or_limitations", response.json())

    def test_all_optional_text_fields_accept_blank_values(self):
        self.client.force_authenticate(self.user)
        nutrition_response = self.client.put(
            self.nutrition_url,
            {
                **self.nutrition_payload,
                "food_allergies": "",
                "food_restrictions": "",
                "disliked_foods": "",
                "favorite_foods_or_cuisines": "",
                "notes": "",
            },
            format="json",
        )
        workout_response = self.client.put(
            self.workout_url,
            {
                **self.workout_payload,
                "preferred_workout_time": "",
                "injuries_or_limitations": "",
                "disliked_exercises": "",
                "notes": "",
            },
            format="json",
        )
        self.assertEqual(nutrition_response.status_code, 201)
        self.assertEqual(workout_response.status_code, 201)

    def test_complete_payload_is_required(self):
        self.client.force_authenticate(self.user)
        nutrition_response = self.client.put(
            self.nutrition_url,
            {key: value for key, value in self.nutrition_payload.items() if key != "meal_pattern"},
            format="json",
        )
        workout_response = self.client.put(
            self.workout_url,
            {key: value for key, value in self.workout_payload.items() if key != "intensity_preference"},
            format="json",
        )
        self.assertEqual(nutrition_response.status_code, 400)
        self.assertIn("meal_pattern", nutrition_response.json())
        self.assertEqual(workout_response.status_code, 400)
        self.assertIn("intensity_preference", workout_response.json())
