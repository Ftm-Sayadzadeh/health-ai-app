from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import NutritionIntake, WorkoutIntake
from .permissions import HasHealthProfile, IsNormalUser
from .serializers import NutritionIntakeSerializer, WorkoutIntakeSerializer


class ProgramIntakePermissionMixin:
    permission_classes = [IsAuthenticated, IsNormalUser, HasHealthProfile]


class IntakeDetailView(ProgramIntakePermissionMixin, APIView):
    model = None
    serializer_class = None

    def get(self, request):
        try:
            intake = self.model.objects.get(user=request.user)
        except self.model.DoesNotExist:
            return Response(
                {"detail": "Program intake not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(self.serializer_class(intake).data)

    def put(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            user = get_user_model().objects.select_for_update().get(pk=request.user.pk)
            intake, created = self.model.objects.update_or_create(
                user=user,
                defaults={
                    **serializer.validated_data,
                    "completed_at": timezone.now(),
                },
            )

        return Response(
            self.serializer_class(intake).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class NutritionIntakeView(IntakeDetailView):
    model = NutritionIntake
    serializer_class = NutritionIntakeSerializer


class WorkoutIntakeView(IntakeDetailView):
    model = WorkoutIntake
    serializer_class = WorkoutIntakeSerializer


class ProgramIntakeStatusView(ProgramIntakePermissionMixin, APIView):
    def get(self, request):
        nutrition = NutritionIntake.objects.filter(user=request.user).first()
        workout = WorkoutIntake.objects.filter(user=request.user).first()
        return Response(
            {
                "nutrition": {
                    "completed": nutrition is not None,
                    "updated_at": nutrition.updated_at if nutrition else None,
                },
                "workout": {
                    "completed": workout is not None,
                    "updated_at": workout.updated_at if workout else None,
                },
            }
        )
