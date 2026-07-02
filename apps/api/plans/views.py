from django.utils import timezone
from django.http import FileResponse
from pathlib import Path
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Plan
from .permissions import HasHealthProfile, IsNormalUser
from .serializers import PlanCreateSerializer, PlanSerializer, PlanUpdateSerializer


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
