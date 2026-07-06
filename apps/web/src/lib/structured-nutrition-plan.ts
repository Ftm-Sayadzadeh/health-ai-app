import { ApiError, apiRequest } from "./api-client";
import type { MealType } from "./nutrition";
import { getAccessToken } from "./token-storage";

export type NutritionPlanItemInput = {
  meal_type: MealType;
  food_name: string;
  serving_description: string;
  calories: number | null;
  note: string;
};

export type NutritionPlanItem = NutritionPlanItemInput & {
  id: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type NutritionPlanMeal = {
  id: number | null;
  meal_type: MealType;
  items: NutritionPlanItem[];
};

export type NutritionPlanStructure = {
  plan: {
    id: number;
    title: string;
    status: "draft" | "active" | "archived";
  };
  editable: boolean;
  item_count: number;
  meals: NutritionPlanMeal[];
};

function requireAccessToken() {
  const token = getAccessToken();
  if (!token) throw new ApiError("توکن ورود پیدا نشد.", 401, null);
  return token;
}

export function getNutritionPlanStructure(planId: number) {
  return apiRequest<NutritionPlanStructure>(
    `/api/plans/${planId}/nutrition-structure/`,
    { token: requireAccessToken() },
  );
}

export function getActiveNutritionPlanStructure() {
  return apiRequest<NutritionPlanStructure>(
    "/api/plans/active-nutrition-structure/",
    { token: requireAccessToken() },
  );
}

export function createNutritionPlanItem(
  planId: number,
  input: NutritionPlanItemInput,
) {
  return apiRequest<NutritionPlanItem>(`/api/plans/${planId}/nutrition-items/`, {
    method: "POST",
    token: requireAccessToken(),
    body: input,
  });
}

export function updateNutritionPlanItem(
  planId: number,
  itemId: number,
  input: NutritionPlanItemInput,
) {
  return apiRequest<NutritionPlanItem>(
    `/api/plans/${planId}/nutrition-items/${itemId}/`,
    {
      method: "PUT",
      token: requireAccessToken(),
      body: input,
    },
  );
}

export function deleteNutritionPlanItem(planId: number, itemId: number) {
  return apiRequest<void>(`/api/plans/${planId}/nutrition-items/${itemId}/`, {
    method: "DELETE",
    token: requireAccessToken(),
  });
}

export function formatNutritionPlanError(error: unknown) {
  if (!(error instanceof ApiError)) return "درخواست انجام نشد. دوباره تلاش کن.";
  if (error.status === 409) return "برای تغییر وعده‌ها، اول برنامه بایگانی‌شده رو دوباره فعال کن.";
  if (error.details && typeof error.details === "object") {
    const details = error.details as Record<string, unknown>;
    if (details.food_name) return "نام غذا رو وارد کن.";
    if (details.serving_description) return "مقدار یا اندازه رو وارد کن.";
    if (details.calories) return "کالری باید خالی یا عددی بین ۰ تا ۱۰٬۰۰۰ باشه.";
    if (details.meal_type) return "نوع وعده رو انتخاب کن.";
    if (details.note) return "یادداشت واردشده بیش از حد طولانیه.";
  }
  return "ذخیره وعده برنامه انجام نشد. دوباره تلاش کن.";
}
