"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import {
  CustomFood,
  FoodLogEntry,
  FoodLogEntryInput,
  MealType,
  PlannedFoodDraft,
  RecentFood,
  toPersianNumber,
} from "@/lib/nutrition";

const mealOptions: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "صبحانه" },
  { value: "lunch", label: "ناهار" },
  { value: "dinner", label: "شام" },
  { value: "snack", label: "میان‌وعده" },
  { value: "other", label: "سایر" },
];

type QuickTab = "recent" | "saved" | "manual";
type ReusableFood = Pick<
  FoodLogEntry,
  "food_name" | "serving_description" | "calories" | "note"
>;

export function FoodEntrySheet({
  entry,
  defaultMeal,
  plannedDraft,
  recentFoods,
  customFoods,
  quickListsLoading,
  recentFoodsError,
  customFoodsError,
  isSaving,
  error,
  onClose,
  onSave,
  onDelete,
}: {
  entry: FoodLogEntry | null;
  defaultMeal: MealType;
  plannedDraft: PlannedFoodDraft | null;
  recentFoods: RecentFood[];
  customFoods: CustomFood[];
  quickListsLoading: boolean;
  recentFoodsError: string | null;
  customFoodsError: string | null;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: FoodLogEntryInput, saveAsCustom: boolean) => Promise<void>;
  onDelete: (() => Promise<void>) | null;
}) {
  const [activeTab, setActiveTab] = useState<QuickTab>(entry || plannedDraft ? "manual" : "recent");
  const [selectedSource, setSelectedSource] = useState<"recent" | "custom" | "plan" | null>(plannedDraft ? "plan" : null);
  const [mealType, setMealType] = useState<MealType>(entry?.meal_type ?? plannedDraft?.meal_type ?? defaultMeal);
  const [foodName, setFoodName] = useState(entry?.food_name ?? plannedDraft?.food_name ?? "");
  const [serving, setServing] = useState(entry?.serving_description ?? plannedDraft?.serving_description ?? "");
  const [calories, setCalories] = useState(entry ? String(entry.calories) : plannedDraft?.calories === null || plannedDraft?.calories === undefined ? "" : String(plannedDraft.calories));
  const [note, setNote] = useState(entry?.note ?? plannedDraft?.note ?? "");
  const [saveForLater, setSaveForLater] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isSaving, onClose]);

  function selectReusable(food: ReusableFood, source: "recent" | "custom") {
    setFoodName(food.food_name);
    setServing(food.serving_description);
    setCalories(String(food.calories));
    setNote(food.note);
    setSelectedSource(source);
    setSaveForLater(false);
    setValidationError(null);
    setActiveTab("manual");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setValidationError(null);
    const calorieValue = Number(calories);
    if (!foodName.trim()) return setValidationError("نام غذا رو وارد کن.");
    if (!serving.trim()) return setValidationError("مقدار یا اندازه وعده رو وارد کن.");
    if (!calories || !Number.isInteger(calorieValue) || calorieValue < 0 || calorieValue > 10000) {
      return setValidationError("کالری باید عددی بین ۰ تا ۱۰٬۰۰۰ باشه.");
    }
    await onSave(
      {
        meal_type: mealType,
        food_name: foodName,
        serving_description: serving,
        calories: calorieValue,
        note,
      },
      !entry && selectedSource !== "custom" && saveForLater,
    );
  }

  const showTabs = !entry && !plannedDraft;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#25321f]/30 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="food-entry-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-[var(--border-soft)] bg-white p-5 shadow-[var(--shadow-lg)] sm:max-w-xl sm:rounded-2xl sm:p-6"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-bold text-[var(--brand-green)]">{entry ? "ویرایش ثبت روزانه" : "ثبت سریع"}</p>
            <h2 id="food-entry-title" className="mt-1 text-xl font-bold">{entry ? "ویرایش غذا" : "افزودن غذا"}</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{entry ? entry.food_name : "از غذاهای قبلی انتخاب کن یا مشخصات رو خودت بنویس."}</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} aria-label="بستن" className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-lg text-[var(--text-muted)] hover:bg-[var(--surface-soft)]">×</button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          {/* one meal selector row */}
          <fieldset>
            <legend className="field-label">برای کدوم وعده؟</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {mealOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={mealType === option.value}
                  onClick={() => setMealType(option.value)}
                  className={`rounded-full border px-4 py-2 text-xs font-bold transition ${mealType === option.value ? "border-[var(--brand-avocado)] bg-[var(--brand-avocado)] text-white" : "border-[var(--border-input)] bg-[var(--surface-input)] text-[var(--text-muted)] hover:border-[var(--border-lime)]"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* one tab selector row: recent / saved / manual */}
          {showTabs ? (
            <div role="tablist" aria-label="روش افزودن غذا" className="grid grid-cols-3 gap-1 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-1">
              {([
                ["recent", "اخیر"],
                ["saved", "ذخیره‌شده‌ها"],
                ["manual", "ورود دستی"],
              ] as const).map(([value, label]) => (
                <button key={value} type="button" role="tab" aria-selected={activeTab === value} onClick={() => setActiveTab(value)} className={`rounded-lg px-2 py-2.5 text-xs font-bold transition ${activeTab === value ? "bg-white text-[var(--brand-green)] shadow-[var(--shadow-xs)]" : "text-[var(--text-subtle)] hover:text-[var(--brand-green)]"}`}>{label}</button>
              ))}
            </div>
          ) : null}

          {/* recent tab: recent food cards only */}
          {showTabs && activeTab === "recent" ? (
            <ReusableFoodList
              foods={recentFoods}
              isLoading={quickListsLoading}
              error={recentFoodsError}
              emptyText="هنوز غذای قبلی برای نمایش نداری."
              onSelect={(food) => selectReusable(food, "recent")}
            />
          ) : null}

          {/* saved tab: saved food cards only */}
          {showTabs && activeTab === "saved" ? (
            <div>
              <ReusableFoodList
                foods={customFoods}
                isLoading={quickListsLoading}
                error={customFoodsError}
                emptyText="هنوز غذایی برای دفعات بعد ذخیره نکردی."
                onSelect={(food) => selectReusable(food, "custom")}
              />
              <div className="mt-3 text-center">
                <Link href="/nutrition/foods" className="text-xs font-bold text-[var(--brand-green)] underline decoration-[var(--brand-avocado)] decoration-2 underline-offset-4 hover:text-[var(--brand-avocado-hover)]">مدیریت غذاهای ذخیره‌شده</Link>
              </div>
            </div>
          ) : null}

          {/* manual tab: manual input form only */}
          {activeTab === "manual" ? (
            <>
              {selectedSource ? (
                <div className="notice notice-success">
                  <span className="font-bold">{selectedSource === "plan" ? "این مورد از برنامه روزانه پیش‌پر شده؛ قبل از ثبت واقعی بررسی و ویرایشش کن." : "مقادیر انتخاب‌شده رو قبل از ثبت بررسی و در صورت نیاز ویرایش کن."}</span>
                  {selectedSource !== "plan" ? <button type="button" onClick={() => setActiveTab(selectedSource === "custom" ? "saved" : "recent")} className="mt-1 block font-bold underline">تغییر انتخاب</button> : null}
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field-label">نام غذا
                  <input autoFocus value={foodName} onChange={(event) => setFoodName(event.target.value)} maxLength={120} className="field-input mt-2" placeholder="مثلا نان و پنیر" />
                </label>
                <label className="field-label">مقدار یا اندازه
                  <input value={serving} onChange={(event) => setServing(event.target.value)} maxLength={120} className="field-input mt-2" placeholder="مثلا یک بشقاب" />
                </label>
              </div>
              <label className="block field-label">کالری
                <input type="number" inputMode="numeric" min="0" max="10000" step="1" value={calories} onChange={(event) => setCalories(event.target.value)} dir="ltr" className="field-input mt-2 text-left" placeholder="0" />
                <span className="mt-1 block text-[0.68rem] font-normal text-[var(--text-subtle)]">کالری به‌صورت خودکار محاسبه نمی‌شه؛ عددی رو وارد کن که خودت داری.</span>
              </label>
              <label className="block field-label">یادداشت (اختیاری)
                <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} className="field-input mt-2 resize-none" />
                <span className="mt-1 block text-left text-[0.68rem] font-normal text-[var(--text-subtle)]" dir="ltr">{toPersianNumber(note.length)} / ۵۰۰</span>
              </label>
              {!entry && selectedSource !== "custom" && selectedSource !== "plan" ? (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border-lime)] bg-[var(--brand-avocado-soft)] px-4 py-3">
                  <input type="checkbox" checked={saveForLater} onChange={(event) => setSaveForLater(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand-avocado)]" />
                  <span>
                    <span className="block text-sm font-bold text-[var(--brand-green)]">ذخیره برای دفعات بعد</span>
                    <span className="mt-0.5 block text-[0.68rem] text-[var(--text-muted)]">این مقادیر به فهرست شخصی خودت اضافه می‌شن.</span>
                  </span>
                </label>
              ) : null}
            </>
          ) : null}

          {(validationError || error) ? <p role="alert" className="notice notice-error">{validationError || error}</p> : null}
          {confirmDelete ? (
            <div className="notice" style={{ backgroundColor: "var(--danger-soft)" }}>
              <p className="text-sm font-bold">این خوراکی از گزارش روز حذف بشه؟</p>
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={isSaving} onClick={onDelete ?? undefined} className="btn btn-danger btn-sm">حذف</button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-secondary btn-sm">انصراف</button>
              </div>
            </div>
          ) : null}

          {/* one sticky footer for submit / cancel / delete */}
          {activeTab === "manual" ? (
            <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center gap-2 border-t border-[var(--border-soft)] bg-white px-5 py-3 sm:-mx-6 sm:px-6">
              <button type="submit" disabled={isSaving} className="btn btn-primary min-w-40 flex-1">{isSaving ? "در حال ذخیره..." : entry ? "ذخیره تغییرات" : "ثبت غذا"}</button>
              <button type="button" onClick={onClose} disabled={isSaving} className="btn btn-secondary btn-sm">انصراف</button>
              {entry && !confirmDelete ? <button type="button" onClick={() => setConfirmDelete(true)} className="btn btn-danger btn-sm">حذف</button> : null}
            </div>
          ) : null}
        </form>
      </section>
    </div>
  );
}

function ReusableFoodList({
  foods,
  isLoading,
  error,
  emptyText,
  onSelect,
}: {
  foods: ReusableFood[];
  isLoading: boolean;
  error: string | null;
  emptyText: string;
  onSelect: (food: ReusableFood) => void;
}) {
  if (isLoading) return <p role="status" className="rounded-xl bg-[var(--surface-soft)] px-4 py-6 text-center text-xs font-bold text-[var(--text-muted)]">در حال آماده‌کردن انتخاب‌ها...</p>;
  if (error) return <p role="alert" className="notice notice-error px-4 py-4 text-center text-xs">{error}</p>;
  if (!foods.length) return <p className="rounded-xl bg-[var(--surface-soft)] px-4 py-6 text-center text-xs text-[var(--text-subtle)]">{emptyText}</p>;

  return (
    <div className="max-h-72 space-y-2 overflow-y-auto pl-1">
      {foods.map((food, index) => (
        <button key={`${food.food_name}-${food.serving_description}-${food.calories}-${index}`} type="button" onClick={() => onSelect(food)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3 text-right transition hover:border-[var(--border-lime)] hover:bg-[var(--brand-avocado-soft)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]">
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{food.food_name}</span>
            <span className="mt-0.5 block truncate text-[0.68rem] text-[var(--text-muted)]">{food.serving_description}</span>
            {food.note ? <span className="mt-1 block truncate text-[0.65rem] text-[var(--text-faint)]">{food.note}</span> : null}
          </span>
          <span className="chip chip-green shrink-0">{toPersianNumber(food.calories)} کالری</span>
        </button>
      ))}
    </div>
  );
}
