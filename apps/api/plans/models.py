from django.conf import settings
from django.db import models
from django.db.models import F, Q
from pathlib import Path
from uuid import uuid4


def plan_attachment_upload_to(instance, filename):
    suffix = Path(filename).suffix.lower()
    return f"plans/{instance.owner_id}/{uuid4().hex}{suffix}"


class Plan(models.Model):
    class PlanType(models.TextChoices):
        NUTRITION = "nutrition", "Nutrition"
        WORKOUT = "workout", "Workout"

    class Source(models.TextChoices):
        SELF = "self", "Self"
        COACH = "coach", "Coach"
        ADMIN = "admin", "Admin"
        EXTERNAL_SPECIALIST = "external_specialist", "External specialist"
        SYSTEM_FUTURE = "system_future", "Future system"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        ARCHIVED = "archived", "Archived"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="plans",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_plans",
        null=True,
        blank=True,
    )
    plan_type = models.CharField(max_length=16, choices=PlanType.choices)
    source = models.CharField(max_length=24, choices=Source.choices)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    title = models.CharField(max_length=120)
    notes = models.TextField(max_length=5000)
    attachment = models.FileField(
        upload_to=plan_attachment_upload_to,
        null=True,
        blank=True,
    )
    attachment_original_name = models.CharField(max_length=255, blank=True, default="")
    attachment_content_type = models.CharField(max_length=100, blank=True, default="")
    attachment_size = models.PositiveBigIntegerField(default=0)
    external_provider_name = models.CharField(max_length=120, blank=True, default="")
    starts_on = models.DateField(null=True, blank=True)
    ends_on = models.DateField(null=True, blank=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["owner", "plan_type", "status"]),
            models.Index(fields=["owner", "updated_at"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(ends_on__isnull=True)
                    | Q(starts_on__isnull=True)
                    | Q(ends_on__gte=F("starts_on"))
                ),
                name="plan_dates_in_order",
            )
        ]

    def __str__(self):
        return f"{self.plan_type}: {self.title}"
