from rest_framework.permissions import BasePermission

from accounts.models import User


class IsNormalUser(BasePermission):
    message = "Plans are available only to normal users."

    def has_permission(self, request, view):
        return request.user.role == User.Role.NORMAL


class HasHealthProfile(BasePermission):
    message = "A completed health profile is required."

    def has_permission(self, request, view):
        return hasattr(request.user, "health_profile")
