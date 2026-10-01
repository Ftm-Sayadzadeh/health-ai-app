import { ApiError } from "./api-client";
import { ActivityLevel, HealthGoal, HealthProfileInput } from "./health-profile";

export type ProfileDraft = Omit<HealthProfileInput, "goal" | "activity_level"> & {
  goal: HealthGoal | "";
  activity_level: ActivityLevel | "";
};

export type ProfileValidationErrors = Partial<Record<keyof ProfileDraft, string>>;

export const goalOptions: Array<{ value: HealthGoal; label: string; detail: string }> = [
  { value: "general_wellness", label: "سلامت عمومی", detail: "ساختن عادت‌های سالم‌تر" },
  { value: "lose_weight", label: "کاهش وزن", detail: "حرکت به سمت وزن کمتر" },
  { value: "maintain_weight", label: "حفظ وزن", detail: "ثابت نگه‌داشتن مسیر فعلی" },
  { value: "gain_weight", label: "افزایش وزن", detail: "حرکت به سمت وزن بیشتر" },
  { value: "build_muscle", label: "عضله‌سازی", detail: "تمرکز روی رشد و قدرت" },
];

export const activityOptions: Array<{
  value: ActivityLevel;
  label: string;
  detail: string;
}> = [
  { value: "sedentary", label: "کم‌تحرک", detail: "بیشتر روز نشسته یا بدون ورزش" },
  { value: "light", label: "فعالیت سبک", detail: "تحرک یا ورزش سبک در هفته" },
  { value: "moderate", label: "فعالیت متوسط", detail: "ورزش منظم چند روز در هفته" },
  { value: "high", label: "فعالیت زیاد", detail: "ورزش سنگین یا فعالیت روزانه زیاد" },
  { value: "very_high", label: "فعالیت خیلی زیاد", detail: "تمرین حرفه‌ای یا کار بدنی سنگین" },
];

export const emptyProfileDraft: ProfileDraft = {
  display_name: "",
  birth_date: "",
  height_cm: "",
  weight_kg: "",
  goal: "",
  activity_level: "",
  food_preferences: "",
  food_restrictions: "",
};

const fieldLabels: Record<string, string> = {
  display_name: "نام دلخواه",
  birth_date: "تاریخ تولد",
  height_cm: "قد",
  weight_kg: "وزن",
  goal: "هدف اصلی",
  activity_level: "میزان فعالیت",
  food_preferences: "ترجیحات غذایی",
  food_restrictions: "محدودیت‌های غذایی",
};

export function dateYearsAgo(years: number) {
  const today = new Date();
  const targetYear = today.getFullYear() - years;
  const lastDay = new Date(targetYear, today.getMonth() + 1, 0).getDate();
  const day = Math.min(today.getDate(), lastDay);
  return [
    targetYear,
    String(today.getMonth() + 1).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

export function formatPersianDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "";

  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "full" }).format(
    new Date(year, month - 1, day),
  );
}

export function validateHealthProfile(profile: ProfileDraft): ProfileValidationErrors {
  const errors: ProfileValidationErrors = {};
  const height = Number(profile.height_cm);
  const weight = Number(profile.weight_kg);

  if (!profile.display_name.trim()) {
    errors.display_name = "یه نام یا اسم دلخواه وارد کن تا باهاش صدات کنیم.";
  }
  if (!profile.birth_date) {
    errors.birth_date = "تاریخ تولدت رو وارد کن.";
  } else if (profile.birth_date > dateYearsAgo(18)) {
    errors.birth_date = "برای ساخت پروفایل باید حداقل ۱۸ سال داشته باشی.";
  } else if (profile.birth_date < dateYearsAgo(120)) {
    errors.birth_date = "تاریخ تولد واردشده معتبر نیست.";
  }
  if (!profile.height_cm || !Number.isFinite(height) || height < 50 || height > 250) {
    errors.height_cm = "قد رو بین ۵۰ تا ۲۵۰ سانتی‌متر وارد کن.";
  }
  if (!profile.weight_kg || !Number.isFinite(weight) || weight < 20 || weight > 500) {
    errors.weight_kg = "وزن رو بین ۲۰ تا ۵۰۰ کیلوگرم وارد کن.";
  }
  if (!profile.goal) {
    errors.goal = "هدفی که الان برات مهم‌تره رو انتخاب کن.";
  }
  if (!profile.activity_level) {
    errors.activity_level = "نزدیک‌ترین سطح فعالیت به روزهای معمولت رو انتخاب کن.";
  }
  if (profile.food_preferences.length > 500) {
    errors.food_preferences = "ترجیحات غذایی باید حداکثر ۵۰۰ نویسه باشد.";
  }
  if (profile.food_restrictions.length > 500) {
    errors.food_restrictions = "محدودیت‌های غذایی باید حداکثر ۵۰۰ نویسه باشد.";
  }

  return errors;
}

function translateBackendMessage(message: string) {
  if (message.includes("required") || message.includes("blank")) {
    return "این مقدار الزامی است.";
  }
  if (message.includes("valid choice")) {
    return "یکی از گزینه‌های معتبر را انتخاب کنید.";
  }
  if (message.includes("at least 18")) {
    return "سن باید حداقل ۱۸ سال باشد.";
  }
  if (message.includes("more than 120")) {
    return "سن نمی‌تواند بیشتر از ۱۲۰ سال باشد.";
  }
  if (message.includes("greater than or equal")) {
    const value = message.match(/[\d.]+/)?.[0];
    return `مقدار باید حداقل ${value ?? "حد مجاز"} باشد.`;
  }
  if (message.includes("less than or equal")) {
    const value = message.match(/[\d.]+/)?.[0];
    return `مقدار باید حداکثر ${value ?? "حد مجاز"} باشد.`;
  }
  if (message.includes("no more than 500")) {
    return "متن باید حداکثر ۵۰۰ نویسه باشد.";
  }
  return "مقدار واردشده معتبر نیست.";
}

export function formatHealthProfileApiError(error: ApiError) {
  if (!error.details || typeof error.details !== "object") {
    return { message: error.message, field: null };
  }

  const entries = Object.entries(error.details as Record<string, unknown>);
  const messages = entries.flatMap(([field, value]) => {
    const values = Array.isArray(value) ? value : [value];
    return values
      .filter((item): item is string => typeof item === "string")
      .map((item) => `${fieldLabels[field] ?? field}: ${translateBackendMessage(item)}`);
  });

  return {
    message: messages.length ? messages.join(" • ") : error.message,
    field: entries[0]?.[0] ?? null,
  };
}
