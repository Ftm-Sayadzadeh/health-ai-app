from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        NORMAL = "normal", "Normal"
        COACH = "coach", "Coach"
        ADMIN = "admin", "Admin"

    phone_number = models.CharField(max_length=16, unique=True)
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.NORMAL)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.phone_number


class OTPChallenge(models.Model):
    PURPOSE_LOGIN = "login"

    phone_number = models.CharField(max_length=16, db_index=True)
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    attempt_count = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    last_sent_at = models.DateTimeField(default=timezone.now)
    purpose = models.CharField(max_length=32, default=PURPOSE_LOGIN)

    class Meta:
        indexes = [
            models.Index(fields=["phone_number", "purpose", "consumed_at"]),
            models.Index(fields=["last_sent_at"]),
        ]

    def __str__(self):
        return f"{self.phone_number} {self.purpose}"

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    @property
    def is_consumed(self):
        return self.consumed_at is not None

    @property
    def has_too_many_attempts(self):
        return self.attempt_count >= settings.OTP_MAX_ATTEMPTS

    def consume(self):
        self.consumed_at = timezone.now()
        self.save(update_fields=["consumed_at"])
