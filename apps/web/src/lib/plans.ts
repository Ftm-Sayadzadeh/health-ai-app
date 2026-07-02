import { ApiError, apiDownload, apiRequest } from "./api-client";
import { getAccessToken } from "./token-storage";

export type PlanType = "nutrition" | "workout";
export type PlanSource = "self" | "coach" | "admin" | "external_specialist" | "system_future";
export type PlanStatus = "draft" | "active" | "archived";

export type Plan = {
  id: number;
  plan_type: PlanType;
  source: PlanSource;
  status: PlanStatus;
  title: string;
  notes: string;
  attachment: PlanAttachment | null;
  external_provider_name: string;
  starts_on: string | null;
  ends_on: string | null;
  activated_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PlanAttachment = {
  original_name: string;
  content_type: string;
  size: number;
  download_url: string;
};

export type CreatePlanInput = {
  plan_type: PlanType;
  source: "self" | "external_specialist";
  title: string;
  notes: string;
  external_provider_name: string;
  starts_on: string | null;
  ends_on: string | null;
  attachment?: File | null;
};

export type UpdatePlanInput = Omit<CreatePlanInput, "plan_type" | "source"> & {
  status: "active" | "archived";
  remove_attachment?: boolean;
};

function requireAccessToken() {
  const token = getAccessToken();
  if (!token) throw new ApiError("توکن ورود پیدا نشد.", 401, null);
  return token;
}

export function getPlans() {
  return apiRequest<{ results: Plan[] }>("/api/plans/", {
    token: requireAccessToken(),
  });
}

export function createPlan(input: CreatePlanInput) {
  return apiRequest<Plan>("/api/plans/", {
    method: "POST",
    token: requireAccessToken(),
    body: serializePlanInput(input),
  });
}

export function getPlan(id: number) {
  return apiRequest<Plan>(`/api/plans/${id}/`, {
    token: requireAccessToken(),
  });
}

export function updatePlan(id: number, input: UpdatePlanInput) {
  return apiRequest<Plan>(`/api/plans/${id}/`, {
    method: "PUT",
    token: requireAccessToken(),
    body: serializePlanInput(input),
  });
}

function serializePlanInput(input: CreatePlanInput | UpdatePlanInput) {
  if (!input.attachment && !("remove_attachment" in input && input.remove_attachment)) {
    const json = { ...input };
    delete json.attachment;
    return json;
  }

  const formData = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (key === "attachment") {
      if (value instanceof File) formData.append(key, value);
    } else if (value === null && (key === "starts_on" || key === "ends_on")) {
      formData.append(key, "");
    } else if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  });
  return formData;
}

export async function downloadPlanAttachment(attachment: PlanAttachment) {
  const token = requireAccessToken();
  const blob = await apiDownload(attachment.download_url, token);
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = attachment.original_name;
    anchor.click();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function formatPlanApiError(error: unknown) {
  if (!(error instanceof ApiError)) return "درخواست انجام نشد. دوباره تلاش کن.";
  if (error.status === 413) return "حجم فایل بیشتر از حد مجازه.";
  if (error.details && typeof error.details === "object") {
    const details = error.details as Record<string, unknown>;
    if (details.attachment) return "فایل باید JPG، PNG، WEBP یا PDF و حداکثر ۱۰ مگابایت باشه.";
    if (details.ends_on) return "تاریخ پایان نمی‌تونه قبل از تاریخ شروع باشه.";
    if (details.notes) return "برای برنامه یادداشت بنویس یا یک فایل اضافه کن.";
    if (details.title) return "عنوان برنامه رو بررسی کن.";
  }
  return "ذخیره برنامه انجام نشد. دوباره تلاش کن.";
}
