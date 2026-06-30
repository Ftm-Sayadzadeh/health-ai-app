from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import HealthProfile
from .serializers import HealthProfileSerializer


class HealthProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.health_profile
        except HealthProfile.DoesNotExist:
            return Response(
                {"detail": "Health profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(HealthProfileSerializer(profile).data)

    def put(self, request):
        serializer = HealthProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            user = get_user_model().objects.select_for_update().get(pk=request.user.pk)
            profile, created = HealthProfile.objects.update_or_create(
                user=user,
                defaults=serializer.validated_data,
            )

        return Response(
            HealthProfileSerializer(profile).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
