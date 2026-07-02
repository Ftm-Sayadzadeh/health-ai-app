from datetime import date
from tempfile import TemporaryDirectory

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase

from accounts.models import User
from profiles.models import HealthProfile

from .models import Plan


class PlanAPITests(APITestCase):
    def setUp(self):
        self.media_directory = TemporaryDirectory()
        self.settings_override = override_settings(MEDIA_ROOT=self.media_directory.name)
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.addCleanup(self.media_directory.cleanup)
        self.client = APIClient()
        self.user = self.create_user_with_profile("09123456789")
        self.other_user = self.create_user_with_profile("09121111111")
        self.list_url = reverse("plan-list-create")
        self.nutrition_payload = {
            "plan_type": Plan.PlanType.NUTRITION,
            "source": Plan.Source.EXTERNAL_SPECIALIST,
            "title": "Specialist nutrition plan",
            "notes": "User-entered plan notes",
            "external_provider_name": "Dr Test",
            "starts_on": "2026-07-01",
            "ends_on": "2026-08-01",
        }
        self.workout_payload = {
            "plan_type": Plan.PlanType.WORKOUT,
            "source": Plan.Source.SELF,
            "title": "My workout plan",
            "notes": "Three simple workout days",
            "external_provider_name": "",
            "starts_on": None,
            "ends_on": None,
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

    def create_plan(self, payload=None):
        self.authenticate()
        return self.client.post(
            self.list_url, payload or self.nutrition_payload, format="json"
        )

    def update_payload(self, plan, **overrides):
        return {
            "title": plan.title,
            "notes": plan.notes,
            "external_provider_name": plan.external_provider_name,
            "starts_on": plan.starts_on.isoformat() if plan.starts_on else None,
            "ends_on": plan.ends_on.isoformat() if plan.ends_on else None,
            "status": plan.status,
            **overrides,
        }

    def test_endpoints_require_authentication(self):
        self.assertEqual(self.client.get(self.list_url).status_code, 401)
        self.assertEqual(
            self.client.post(self.list_url, self.nutrition_payload, format="json").status_code,
            401,
        )

    def test_only_normal_users_with_health_profile_are_allowed(self):
        coach = self.create_user_with_profile("09122222222", User.Role.COACH)
        self.authenticate(coach)
        self.assertEqual(self.client.get(self.list_url).status_code, 403)

        incomplete_user = User.objects.create_user(phone_number="09123333333")
        self.authenticate(incomplete_user)
        self.assertEqual(self.client.get(self.list_url).status_code, 403)

    def test_creates_allowed_nutrition_and_workout_plans(self):
        nutrition_response = self.create_plan()
        workout_response = self.create_plan(self.workout_payload)

        self.assertEqual(nutrition_response.status_code, 201)
        self.assertEqual(workout_response.status_code, 201)
        self.assertEqual(Plan.objects.count(), 2)
        for plan in Plan.objects.all():
            self.assertEqual(plan.owner, self.user)
            self.assertEqual(plan.created_by, self.user)
            self.assertEqual(plan.status, Plan.Status.ACTIVE)
            self.assertIsNotNone(plan.activated_at)

    def test_rejects_unavailable_type_source_combinations(self):
        self.authenticate()
        payloads = [
            {**self.nutrition_payload, "source": Plan.Source.SYSTEM_FUTURE},
            {**self.workout_payload, "source": Plan.Source.COACH},
            {**self.nutrition_payload, "source": Plan.Source.SELF},
        ]
        for payload in payloads:
            with self.subTest(payload=payload):
                response = self.client.post(self.list_url, payload, format="json")
                self.assertEqual(response.status_code, 400)
                self.assertIn("source", response.json())

    def test_list_is_owner_scoped_ordered_and_filterable(self):
        self.create_plan()
        self.create_plan(self.workout_payload)
        Plan.objects.create(
            owner=self.other_user,
            created_by=self.other_user,
            plan_type=Plan.PlanType.NUTRITION,
            source=Plan.Source.EXTERNAL_SPECIALIST,
            status=Plan.Status.ARCHIVED,
            title="Other user's plan",
            notes="Private",
        )

        response = self.client.get(self.list_url, {"plan_type": "nutrition"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["results"]), 1)
        self.assertEqual(response.json()["results"][0]["title"], "Specialist nutrition plan")

    def test_invalid_list_filters_return_400(self):
        self.authenticate()
        self.assertEqual(
            self.client.get(self.list_url, {"plan_type": "unknown"}).status_code, 400
        )
        self.assertEqual(
            self.client.get(self.list_url, {"status": "unknown"}).status_code, 400
        )

    def test_detail_and_update_are_owner_scoped(self):
        plan = Plan.objects.create(
            owner=self.user,
            created_by=self.user,
            plan_type=Plan.PlanType.WORKOUT,
            source=Plan.Source.SELF,
            title="Owner plan",
            notes="Owner notes",
        )
        detail_url = reverse("plan-detail", args=[plan.pk])
        self.authenticate(self.other_user)

        self.assertEqual(self.client.get(detail_url).status_code, 404)
        self.assertEqual(
            self.client.put(detail_url, self.update_payload(plan), format="json").status_code,
            404,
        )

    def test_update_trims_fields_and_keeps_type_and_source_immutable(self):
        response = self.create_plan()
        plan = Plan.objects.get(pk=response.json()["id"])
        detail_url = reverse("plan-detail", args=[plan.pk])
        payload = self.update_payload(
            plan,
            title="  Updated title  ",
            notes="  Updated notes  ",
            external_provider_name="  Specialist  ",
            plan_type=Plan.PlanType.WORKOUT,
            source=Plan.Source.SELF,
        )

        response = self.client.put(detail_url, payload, format="json")
        plan.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(plan.title, "Updated title")
        self.assertEqual(plan.notes, "Updated notes")
        self.assertEqual(plan.external_provider_name, "Specialist")
        self.assertEqual(plan.plan_type, Plan.PlanType.NUTRITION)
        self.assertEqual(plan.source, Plan.Source.EXTERNAL_SPECIALIST)

    def test_archive_and_reactivate_manage_timestamps(self):
        response = self.create_plan()
        plan = Plan.objects.get(pk=response.json()["id"])
        detail_url = reverse("plan-detail", args=[plan.pk])
        initial_activation = plan.activated_at

        archive_response = self.client.put(
            detail_url,
            self.update_payload(plan, status=Plan.Status.ARCHIVED),
            format="json",
        )
        plan.refresh_from_db()
        self.assertEqual(archive_response.status_code, 200)
        self.assertIsNotNone(plan.archived_at)

        reactivate_response = self.client.put(
            detail_url,
            self.update_payload(plan, status=Plan.Status.ACTIVE),
            format="json",
        )
        plan.refresh_from_db()
        self.assertEqual(reactivate_response.status_code, 200)
        self.assertIsNone(plan.archived_at)
        self.assertGreaterEqual(plan.activated_at, initial_activation)

    def test_validates_required_text_lengths_dates_and_status(self):
        self.authenticate()
        invalid_create = self.client.post(
            self.list_url,
            {
                **self.nutrition_payload,
                "title": "   ",
                "notes": "x" * 5001,
                "external_provider_name": "x" * 121,
            },
            format="json",
        )
        self.assertEqual(invalid_create.status_code, 400)
        for field in ["title", "notes", "external_provider_name"]:
            self.assertIn(field, invalid_create.json())

        invalid_dates = self.client.post(
            self.list_url,
            {
                **self.nutrition_payload,
                "starts_on": "2026-08-01",
                "ends_on": "2026-07-01",
            },
            format="json",
        )
        self.assertEqual(invalid_dates.status_code, 400)
        self.assertIn("ends_on", invalid_dates.json())

        plan = Plan.objects.create(
            owner=self.user,
            created_by=self.user,
            plan_type=Plan.PlanType.WORKOUT,
            source=Plan.Source.SELF,
            title="Valid",
            notes="Valid notes",
        )
        invalid_update = self.client.put(
            reverse("plan-detail", args=[plan.pk]),
            self.update_payload(plan, status=Plan.Status.DRAFT),
            format="json",
        )
        self.assertEqual(invalid_update.status_code, 400)
        self.assertIn("status", invalid_update.json())

    def test_delete_is_not_available(self):
        plan = Plan.objects.create(
            owner=self.user,
            plan_type=Plan.PlanType.WORKOUT,
            source=Plan.Source.SELF,
            title="Plan",
            notes="Notes",
        )
        self.authenticate()
        self.assertEqual(
            self.client.delete(reverse("plan-detail", args=[plan.pk])).status_code,
            405,
        )

    def test_creates_plan_with_valid_image_or_pdf_attachment(self):
        self.authenticate()
        files = [
            ("doctor-plan.jpg", b"image-content", "image/jpeg"),
            ("doctor-plan.pdf", b"pdf-content", "application/pdf"),
        ]
        for index, (name, content, content_type) in enumerate(files):
            with self.subTest(name=name):
                upload = SimpleUploadedFile(name, content, content_type=content_type)
                response = self.client.post(
                    self.list_url,
                    {
                        **self.nutrition_payload,
                        "title": f"Attachment plan {index}",
                        "attachment": upload,
                    },
                    format="multipart",
                )
                self.assertEqual(response.status_code, 201)
                metadata = response.json()["attachment"]
                self.assertEqual(metadata["original_name"], name)
                self.assertEqual(metadata["content_type"], content_type)
                self.assertEqual(metadata["size"], len(content))
                self.assertEqual(
                    metadata["download_url"],
                    reverse("plan-attachment-download", args=[response.json()["id"]]),
                )
                self.assertEqual(
                    set(metadata),
                    {"original_name", "content_type", "size", "download_url"},
                )

    def test_allows_upload_only_active_plan(self):
        self.authenticate()
        response = self.client.post(
            self.list_url,
            {
                **self.nutrition_payload,
                "notes": "",
                "attachment": SimpleUploadedFile(
                    "plan.pdf", b"pdf-content", content_type="application/pdf"
                ),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["notes"], "")

    def test_rejects_invalid_or_oversized_attachment(self):
        self.authenticate()
        invalid_file = SimpleUploadedFile(
            "plan.txt", b"not allowed", content_type="text/plain"
        )
        invalid_response = self.client.post(
            self.list_url,
            {**self.nutrition_payload, "attachment": invalid_file},
            format="multipart",
        )
        self.assertEqual(invalid_response.status_code, 400)
        self.assertIn("attachment", invalid_response.json())

        oversized_file = SimpleUploadedFile(
            "plan.pdf",
            b"x" * (10 * 1024 * 1024 + 1),
            content_type="application/pdf",
        )
        oversized_response = self.client.post(
            self.list_url,
            {**self.nutrition_payload, "attachment": oversized_file},
            format="multipart",
        )
        self.assertEqual(oversized_response.status_code, 400)
        self.assertIn("attachment", oversized_response.json())

    def test_attachment_download_is_owner_scoped(self):
        self.authenticate()
        response = self.client.post(
            self.list_url,
            {
                **self.nutrition_payload,
                "attachment": SimpleUploadedFile(
                    "private.pdf", b"private-content", content_type="application/pdf"
                ),
            },
            format="multipart",
        )
        download_url = reverse("plan-attachment-download", args=[response.json()["id"]])

        own_response = self.client.get(download_url)
        self.assertEqual(own_response.status_code, 200)
        self.assertEqual(b"".join(own_response.streaming_content), b"private-content")

        self.authenticate(self.other_user)
        self.assertEqual(self.client.get(download_url).status_code, 404)

    def test_replaces_and_removes_attachment(self):
        self.authenticate()
        create_response = self.client.post(
            self.list_url,
            {
                **self.nutrition_payload,
                "attachment": SimpleUploadedFile(
                    "first.pdf", b"first", content_type="application/pdf"
                ),
            },
            format="multipart",
        )
        plan = Plan.objects.get(pk=create_response.json()["id"])
        detail_url = reverse("plan-detail", args=[plan.pk])

        replace_response = self.client.put(
            detail_url,
            {
                **self.update_payload(plan),
                "starts_on": "2026-07-01",
                "ends_on": "2026-08-01",
                "attachment": SimpleUploadedFile(
                    "replacement.png", b"second", content_type="image/png"
                ),
            },
            format="multipart",
        )
        self.assertEqual(replace_response.status_code, 200)
        self.assertEqual(
            replace_response.json()["attachment"]["original_name"], "replacement.png"
        )

        plan.refresh_from_db()
        remove_response = self.client.put(
            detail_url,
            {**self.update_payload(plan), "remove_attachment": True},
            format="json",
        )
        self.assertEqual(remove_response.status_code, 200)
        self.assertIsNone(remove_response.json()["attachment"])
