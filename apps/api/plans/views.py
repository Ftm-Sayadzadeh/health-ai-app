from django.utils import timezone
from django.http import FileResponse
from django.db import transaction
from django.db.models import F, Max, Prefetch
from pathlib import Path
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import NutritionPlanMeal, NutritionPlanMealItem, Plan
from .permissions import HasHealthProfile, IsNormalUser
from .serializers import (
    NutritionPlanMealItemSerializer,
    NutritionPlanMealItemWriteSerializer,
    PlanCreateSerializer,
    PlanSerializer,
    PlanUpdateSerializer,
)


class PlanPermissionMixin:
    permission_classes = [IsAuthenticated, IsNormalUser, HasHealthProfile]
    parser_classes = [JSONParser, MultiPartParser, FormParser]


class PlanListCreateView(PlanPermissionMixin, APIView):
    def get(self, request):
        queryset = Plan.objects.filter(owner=request.user)
        plan_type = request.query_params.get("plan_type")
        plan_status = request.query_params.get("status")

        if plan_type and plan_type not in Plan.PlanType.values:
            return Response(
                {"plan_type": ["Invalid plan type."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if plan_status and plan_status not in Plan.Status.values:
            return Response(
                {"status": ["Invalid plan status."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if plan_type:
            queryset = queryset.filter(plan_type=plan_type)
        if plan_status:
            queryset = queryset.filter(status=plan_status)

        return Response({"results": PlanSerializer(queryset, many=True).data})

    def post(self, request):
        serializer = PlanCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        now = timezone.now()
        plan = serializer.save(
            owner=request.user,
            created_by=request.user,
            status=Plan.Status.ACTIVE,
            activated_at=now,
        )
        return Response(PlanSerializer(plan).data, status=status.HTTP_201_CREATED)


class PlanDetailView(PlanPermissionMixin, APIView):
    def get_plan(self, request, plan_id):
        return Plan.objects.filter(owner=request.user, pk=plan_id).first()

    def get(self, request, plan_id):
        plan = self.get_plan(request, plan_id)
        if plan is None:
            return Response(
                {"detail": "Plan not found."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(PlanSerializer(plan).data)

    def put(self, request, plan_id):
        plan = self.get_plan(request, plan_id)
        if plan is None:
            return Response(
                {"detail": "Plan not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = PlanUpdateSerializer(plan, data=request.data)
        serializer.is_valid(raise_exception=True)
        next_status = serializer.validated_data["status"]
        now = timezone.now()
        lifecycle = {}
        if next_status == Plan.Status.ARCHIVED and plan.status != Plan.Status.ARCHIVED:
            lifecycle["archived_at"] = now
        elif next_status == Plan.Status.ACTIVE and plan.status != Plan.Status.ACTIVE:
            lifecycle["activated_at"] = now
            lifecycle["archived_at"] = None

        plan = serializer.save(**lifecycle)
        return Response(PlanSerializer(plan).data)


class PlanAttachmentDownloadView(PlanPermissionMixin, APIView):
    def get(self, request, plan_id):
        plan = Plan.objects.filter(owner=request.user, pk=plan_id).first()
        if plan is None or not plan.attachment:
            return Response(
                {"detail": "Plan attachment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return FileResponse(
            plan.attachment.open("rb"),
            as_attachment=True,
            filename=Path(plan.attachment_original_name).name,
            content_type=plan.attachment_content_type,
        )


MEAL_TYPES = [value for value, _label in NutritionPlanMeal.MealType.choices]


def get_owned_nutrition_plan(request, plan_id):
    plan = Plan.objects.filter(owner=request.user, pk=plan_id).first()
    if plan is None:
        return None, Response(
            {"detail": "Plan not found."}, status=status.HTTP_404_NOT_FOUND
        )
    if plan.plan_type != Plan.PlanType.NUTRITION:
        return None, Response(
            {"plan": ["Structured meals are available only for nutrition plans."]},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return plan, None


def archived_plan_response(plan):
    if plan.status != Plan.Status.ARCHIVED:
        return None
    return Response(
        {"detail": "Archived plan structure is read-only."},
        status=status.HTTP_409_CONFLICT,
    )


def serialize_nutrition_structure(plan):
    meals = NutritionPlanMeal.objects.filter(plan=plan).prefetch_related(
        Prefetch(
            "items",
            queryset=NutritionPlanMealItem.objects.select_related("meal"),
        )
    )
    meals_by_type = {meal.meal_type: meal for meal in meals}
    result = []
    item_count = 0
    for meal_type in MEAL_TYPES:
        meal = meals_by_type.get(meal_type)
        items = list(meal.items.all()) if meal else []
        item_count += len(items)
        result.append(
            {
                "id": meal.id if meal else None,
                "meal_type": meal_type,
                "items": NutritionPlanMealItemSerializer(items, many=True).data,
            }
        )
    return {
        "plan": {
            "id": plan.id,
            "title": plan.title,
            "status": plan.status,
        },
        "editable": plan.status != Plan.Status.ARCHIVED,
        "item_count": item_count,
        "meals": result,
    }


class NutritionPlanStructureView(PlanPermissionMixin, APIView):
    def get(self, request, plan_id):
        plan, error = get_owned_nutrition_plan(request, plan_id)
        if error:
            return error
        return Response(serialize_nutrition_structure(plan))


class ActiveNutritionPlanStructureView(PlanPermissionMixin, APIView):
    def get(self, request):
        plan = (
            Plan.objects.filter(
                owner=request.user,
                plan_type=Plan.PlanType.NUTRITION,
                status=Plan.Status.ACTIVE,
            )
            .order_by(
                F("activated_at").desc(nulls_last=True),
                F("updated_at").desc(),
                F("id").desc(),
            )
            .first()
        )
        if plan is None:
            return Response(
                {"detail": "Active nutrition plan not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(serialize_nutrition_structure(plan))


class NutritionPlanMealItemCreateView(PlanPermissionMixin, APIView):
    def post(self, request, plan_id):
        plan, error = get_owned_nutrition_plan(request, plan_id)
        if error:
            return error
        if archived_error := archived_plan_response(plan):
            return archived_error

        serializer = NutritionPlanMealItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = dict(serializer.validated_data)
        meal_type = values.pop("meal_type")
        with transaction.atomic():
            meal, _created = NutritionPlanMeal.objects.get_or_create(
                plan=plan,
                meal_type=meal_type,
            )
            maximum = meal.items.aggregate(value=Max("sort_order"))["value"]
            item = NutritionPlanMealItem.objects.create(
                meal=meal,
                sort_order=0 if maximum is None else maximum + 1,
                **values,
            )
        return Response(
            NutritionPlanMealItemSerializer(item).data,
            status=status.HTTP_201_CREATED,
        )


class NutritionPlanMealItemDetailView(PlanPermissionMixin, APIView):
    @staticmethod
    def get_item(plan, item_id):
        return NutritionPlanMealItem.objects.filter(
            pk=item_id,
            meal__plan=plan,
        ).select_related("meal").first()

    def get(self, request, plan_id, item_id):
        plan, error = get_owned_nutrition_plan(request, plan_id)
        if error:
            return error
        item = self.get_item(plan, item_id)
        if item is None:
            return Response(
                {"detail": "Nutrition plan item not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(NutritionPlanMealItemSerializer(item).data)

    def put(self, request, plan_id, item_id):
        plan, error = get_owned_nutrition_plan(request, plan_id)
        if error:
            return error
        if archived_error := archived_plan_response(plan):
            return archived_error
        item = self.get_item(plan, item_id)
        if item is None:
            return Response(
                {"detail": "Nutrition plan item not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = NutritionPlanMealItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = dict(serializer.validated_data)
        meal_type = values.pop("meal_type")
        with transaction.atomic():
            old_meal = item.meal
            if old_meal.meal_type != meal_type:
                target_meal, _created = NutritionPlanMeal.objects.get_or_create(
                    plan=plan,
                    meal_type=meal_type,
                )
                maximum = target_meal.items.aggregate(value=Max("sort_order"))["value"]
                item.meal = target_meal
                item.sort_order = 0 if maximum is None else maximum + 1
            for field, value in values.items():
                setattr(item, field, value)
            item.save()
            if old_meal.pk != item.meal_id and not old_meal.items.exists():
                old_meal.delete()
        return Response(NutritionPlanMealItemSerializer(item).data)

    def delete(self, request, plan_id, item_id):
        plan, error = get_owned_nutrition_plan(request, plan_id)
        if error:
            return error
        if archived_error := archived_plan_response(plan):
            return archived_error
        item = self.get_item(plan, item_id)
        if item is None:
            return Response(
                {"detail": "Nutrition plan item not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        with transaction.atomic():
            meal = item.meal
            item.delete()
            if not meal.items.exists():
                meal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
