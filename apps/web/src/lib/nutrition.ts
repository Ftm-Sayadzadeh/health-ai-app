import { ApiError, apiRequest } from "./api-client";
import { getAccessToken } from "./token-storage";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "other";

export type FoodLogEntryInput = {
  meal_type: MealType;
  food_name: string;
  serving_description: string;
  calories: number;
  note: string;
};

export type FoodLogEntry = FoodLogEntryInput & {
  id: number;
  created_at: string;
  updated_at: string;
};

export type DailyFoodLog = {
  date: string;
  total_calories: number;
  entry_count: number;
  meal_totals: Record<MealType, number>;
  entries: FoodLogEntry[];
};

function requireAccessToken() {
  const token = getAccessToken();
  if (!token) throw new ApiError("توکن ورود پیدا نشد.", 401, null);
  return token;
}

export function getDailyFoodLog(date: string) {
  return apiRequest<DailyFoodLog>(`/api/nutrition/days/${date}/`, {
    token: requireAccessToken(),
  });
}

export function createFoodLogEntry(date: string, input: FoodLogEntryInput) {
  return apiRequest<FoodLogEntry>(`/api/nutrition/days/${date}/entries/`, {
    method: "POST",
    token: requireAccessToken(),
    body: input,
  });
}

export function updateFoodLogEntry(id: number, input: FoodLogEntryInput) {
  return apiRequest<FoodLogEntry>(`/api/nutrition/entries/${id}/`, {
    method: "PUT",
    token: requireAccessToken(),
    body: input,
  });
}

export function deleteFoodLogEntry(id: number) {
  return apiRequest<void>(`/api/nutrition/entries/${id}/`, {
    method: "DELETE",
    token: requireAccessToken(),
  });
}

export function getTehranTodayKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function shiftDateKey(date: string, days: number) {
  const shifted = new Date(`${date}T12:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

export function isDateKey(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function formatNutritionDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function toPersianNumber(value: number) {
  return value.toLocaleString("fa-IR");
}

export function formatNutritionError(error: unknown) {
  if (!(error instanceof ApiError)) return "درخواست انجام نشد. دوباره تلاش کن.";
  if (error.details && typeof error.details === "object") {
    const details = error.details as Record<string, unknown>;
    if (details.date) return "تاریخ انتخاب‌شده معتبر نیست.";
    if (details.food_name) return "نام غذا رو وارد کن.";
    if (details.serving_description) return "مقدار یا اندازه وعده رو وارد کن.";
    if (details.calories) return "کالری باید عددی بین ۰ تا ۱۰٬۰۰۰ باشه.";
    if (details.meal_type) return "نوع وعده رو انتخاب کن.";
    if (details.note) return "یادداشت واردشده بیش از حد طولانیه.";
  }
  return "ثبت اطلاعات انجام نشد. دوباره تلاش کن.";
}
