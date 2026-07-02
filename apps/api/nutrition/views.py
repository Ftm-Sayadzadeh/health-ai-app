import re
from datetime import date

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FoodLogDay, FoodLogEntry
from .permissions import HasHealthProfile, IsNormalUser
from .serializers import FoodLogEntrySerializer


MEAL_TYPES = [choice for choice, _label in FoodLogEntry.MealType.choices]


def parse_log_date(value):
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise serializers.ValidationError({"date": "Date must use YYYY-MM-DD format."})
    try:
        parsed = date.fromisoformat(value)
    except ValueError as error:
        raise serializers.ValidationError({"date": "Date is invalid."}) from error
    if parsed > timezone.localdate():
        raise serializers.ValidationError({"date": "Future food logs are not allowed."})
    return parsed


def serialize_daily_log(user, log_date):
    log_day = (
        FoodLogDay.objects.filter(user=user, date=log_date)
        .prefetch_related("entries")
        .first()
    )
    entries = list(log_day.entries.all()) if log_day else []
    meal_totals = {meal_type: 0 for meal_type in MEAL_TYPES}
    for entry in entries:
        meal_totals[entry.meal_type] += entry.calories

    return {
        "date": log_date.isoformat(),
        "total_calories": sum(meal_totals.values()),
        "entry_count": len(entries),
        "meal_totals": meal_totals,
        "entries": FoodLogEntrySerializer(entries, many=True).data,
    }


class NutritionPermissionMixin:
    permission_classes = [IsAuthenticated, IsNormalUser, HasHealthProfile]


class DailyFoodLogView(NutritionPermissionMixin, APIView):
    def get(self, request, log_date):
        return Response(serialize_daily_log(request.user, parse_log_date(log_date)))


class FoodLogEntryCreateView(NutritionPermissionMixin, APIView):
    def post(self, request, log_date):
        parsed_date = parse_log_date(log_date)
        serializer = FoodLogEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            log_day, _created = FoodLogDay.objects.get_or_create(
                user=request.user, date=parsed_date
            )
            entry = serializer.save(log_day=log_day)
        return Response(
            FoodLogEntrySerializer(entry).data,
            status=status.HTTP_201_CREATED,
        )


class FoodLogEntryDetailView(NutritionPermissionMixin, APIView):
    def get_entry(self, request, entry_id):
        return FoodLogEntry.objects.filter(
            pk=entry_id, log_day__user=request.user
        ).select_related("log_day").first()

    def get(self, request, entry_id):
        entry = self.get_entry(request, entry_id)
        if entry is None:
            return Response(
                {"detail": "Food log entry not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(FoodLogEntrySerializer(entry).data)

    def put(self, request, entry_id):
        entry = self.get_entry(request, entry_id)
        if entry is None:
            return Response(
                {"detail": "Food log entry not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = FoodLogEntrySerializer(entry, data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(FoodLogEntrySerializer(serializer.save()).data)

    def delete(self, request, entry_id):
        entry = self.get_entry(request, entry_id)
        if entry is None:
            return Response(
                {"detail": "Food log entry not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        log_day = entry.log_day
        with transaction.atomic():
            entry.delete()
            if not log_day.entries.exists():
                log_day.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
