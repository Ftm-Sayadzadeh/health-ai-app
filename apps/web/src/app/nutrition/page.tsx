"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";

import { ApiError } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import {
  CustomFood,
  createFoodLogEntry,
  DailyFoodLog,
  deleteFoodLogEntry,
  FoodLogEntry,
  FoodLogEntryInput,
  formatNutritionDate,
  formatNutritionError,
  getCustomFoods,
  getDailyFoodLog,
  getRecentFoods,
  getTehranTodayKey,
  isDateKey,
  MealType,
  PlannedFoodDraft,
  RecentFood,
  shiftDateKey,
  toPersianNumber,
  updateFoodLogEntry,
} from "@/lib/nutrition";
import {
  getActiveNutritionPlanStructure,
  NutritionPlanItem,
  NutritionPlanStructure,
} from "@/lib/structured-nutrition-plan";

import { FoodEntrySheet } from "./_components/food-entry-sheet";
import { NutritionLoading, NutritionShell, useNutritionAccess } from "./_components/nutrition-ui";
import { PlannedMeals } from "./_components/planned-meals";

const meals: { type: MealType; label: string; hint: string }[] = [
  { type: "breakfast", label: "صبحانه", hint: "شروع روز" },
  { type: "lunch", label: "ناهار", hint: "وعده میانه روز" },
  { type: "dinner", label: "شام", hint: "وعده پایانی روز" },
  { type: "snack", label: "میان‌وعده", hint: "خوراکی‌های بین وعده‌ها" },
  { type: "other", label: "سایر", hint: "مواردی که در وعده‌های بالا نیست" },
];

export default function NutritionPage() {
  return (
    <Suspense fallback={<NutritionShell><NutritionLoading /></NutritionShell>}>
      <NutritionPageContent />
    </Suspense>
  );
}

function NutritionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getTehranTodayKey();
  const requestedDate = searchParams.get("date");
  const selectedDate = isDateKey(requestedDate) && requestedDate <= today ? requestedDate : today;
  const [dailyLog, setDailyLog] = useState<DailyFoodLog | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FoodLogEntry | null>(null);
  const [plannedDraft, setPlannedDraft] = useState<PlannedFoodDraft | null>(null);
  const [activeStructure, setActiveStructure] = useState<NutritionPlanStructure | null>(null);
  const [defaultMeal, setDefaultMeal] = useState<MealType>("breakfast");
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [quickListsLoading, setQuickListsLoading] = useState(false);
  const [recentFoodsError, setRecentFoodsError] = useState<string | null>(null);
  const [customFoodsError, setCustomFoodsError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [dailyResult, structureResult] = await Promise.allSettled([
      getDailyFoodLog(selectedDate),
      getActiveNutritionPlanStructure(),
    ]);
    if (dailyResult.status === "rejected") throw dailyResult.reason;
    setDailyLog(dailyResult.value);
    if (structureResult.status === "fulfilled") {
      setActiveStructure(structureResult.value.item_count ? structureResult.value : null);
    } else {
      if (structureResult.reason instanceof ApiError && structureResult.reason.status === 401) {
        throw structureResult.reason;
      }
      setActiveStructure(null);
    }
  }, [selectedDate]);
  const access = useNutritionAccess(load);

  const loadQuickFoods = useCallback(async () => {
    setQuickListsLoading(true);
    setRecentFoodsError(null);
    setCustomFoodsError(null);
    const [recentResult, customResult] = await Promise.allSettled([
      getRecentFoods(),
      getCustomFoods(),
    ]);
    const rejected = [recentResult, customResult].find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (rejected?.reason instanceof ApiError && rejected.reason.status === 401) {
      logout();
      router.replace("/login");
      return;
    }
    if (recentResult.status === "fulfilled") setRecentFoods(recentResult.value.results);
    else setRecentFoodsError("دریافت غذاهای اخیر ممکن نشد؛ ورود دستی همچنان در دسترسه.");
    if (customResult.status === "fulfilled") setCustomFoods(customResult.value.results);
    else setCustomFoodsError("دریافت غذاهای ذخیره‌شده ممکن نشد؛ ورود دستی همچنان در دسترسه.");
    setQuickListsLoading(false);
  }, [router]);

  function changeDate(value: string) {
    if (!isDateKey(value) || value > today) return;
    router.replace(`/nutrition?date=${value}`);
  }

  function openCreate(mealType: MealType) {
    setSelectedEntry(null);
    setPlannedDraft(null);
    setDefaultMeal(mealType);
    setActionError(null);
    setSheetOpen(true);
    void loadQuickFoods();
  }

  function openEdit(entry: FoodLogEntry) {
    setSelectedEntry(entry);
    setPlannedDraft(null);
    setDefaultMeal(entry.meal_type);
    setActionError(null);
    setSheetOpen(true);
  }

  function openPlannedItem(item: NutritionPlanItem) {
    setSelectedEntry(null);
    setPlannedDraft({
      meal_type: item.meal_type,
      food_name: item.food_name,
      serving_description: item.serving_description,
      calories: item.calories,
      note: item.note,
    });
    setDefaultMeal(item.meal_type);
    setActionError(null);
    setSheetOpen(true);
  }

  async function saveEntry(input: FoodLogEntryInput, saveAsCustom: boolean) {
    setIsSaving(true);
    setActionError(null);
    try {
      if (selectedEntry) await updateFoodLogEntry(selectedEntry.id, input);
      else await createFoodLogEntry(selectedDate, { ...input, save_as_custom: saveAsCustom });
      await load();
      setSheetOpen(false);
      setSelectedEntry(null);
      setPlannedDraft(null);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setActionError(formatNutritionError(caught));
    } finally {
      setIsSaving(false);
    }
  }

  async function removeEntry() {
    if (!selectedEntry) return;
    setIsSaving(true);
    setActionError(null);
    try {
      await deleteFoodLogEntry(selectedEntry.id);
      await load();
      setSheetOpen(false);
      setSelectedEntry(null);
      setPlannedDraft(null);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setActionError(formatNutritionError(caught));
    } finally {
      setIsSaving(false);
    }
  }

  if (access.isLoading) return <NutritionShell><NutritionLoading /></NutritionShell>;

  const entryCount = dailyLog?.entry_count ?? 0;
  const populatedMealCount = meals.filter((meal) =>
    (dailyLog?.entries ?? []).some((entry) => entry.meal_type === meal.type),
  ).length;
  const suggestedMeal = getSuggestedMealType();

  return (
    <NutritionShell>
      {/* compact top summary */}
      <section className="card-tint p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <span className="chip chip-green">امروز چی خوردی؟</span>
            <h1 className="mt-2 text-xl font-bold sm:text-2xl">{formatNutritionDate(selectedDate)}</h1>
            <p className="mt-1.5 text-[0.82rem] leading-6 text-[var(--text-muted)]">
              غذای روزت رو سریع ثبت کن؛ کالری‌ها بر اساس عددهایی هستن که خودت وارد کردی.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip chip-neutral">{toPersianNumber(entryCount)} مورد ثبت‌شده</span>
              <span className="chip chip-neutral">{toPersianNumber(populatedMealCount)} وعده دارای ثبت</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-soft)] bg-white/80 px-5 py-4 text-center md:min-w-52">
            <div>
              <p className="text-[0.7rem] font-bold text-[var(--text-muted)]">مجموع کالری روز</p>
              <p className="mt-0.5 text-2xl font-bold text-[var(--text-strong)]">
                {toPersianNumber(dailyLog?.total_calories ?? 0)} <span className="text-sm font-bold text-[var(--text-muted)]">کالری</span>
              </p>
              <p className="mt-0.5 text-[0.65rem] text-[var(--text-subtle)]">بر اساس عددهایی که خودت وارد کردی</p>
            </div>
            <button type="button" onClick={() => openCreate(suggestedMeal)} className="btn btn-primary">
              افزودن غذا
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-white/60 p-2">
          <button type="button" onClick={() => changeDate(shiftDateKey(selectedDate, -1))} className="btn btn-secondary btn-sm">روز قبل</button>
          <button type="button" onClick={() => changeDate(today)} disabled={selectedDate === today} className="btn btn-secondary btn-sm disabled:opacity-50">امروز</button>
          <button type="button" onClick={() => changeDate(shiftDateKey(selectedDate, 1))} disabled={selectedDate >= today} className="btn btn-secondary btn-sm disabled:opacity-50">روز بعد</button>
          <label className="mr-auto flex flex-wrap items-center justify-end gap-2 text-[0.68rem] font-bold text-[var(--text-muted)]">
            <span>انتخاب روز دیگر</span>
            <input aria-label="انتخاب تاریخ" type="date" max={today} value={selectedDate} onChange={(event) => changeDate(event.target.value)} dir="ltr" className="rounded-lg border border-[var(--border-lime)] bg-white px-3 py-2 text-xs outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]" />
          </label>
        </div>
      </section>

      {access.error ? <p role="alert" className="notice notice-error mt-4">دریافت گزارش روزانه ممکن نشد. دوباره تلاش کن.</p> : null}

      {activeStructure ? <PlannedMeals structure={activeStructure} onSelect={openPlannedItem} /> : null}

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        {meals.map((meal) => (
          <MealSection key={meal.type} meal={meal} entries={(dailyLog?.entries ?? []).filter((entry) => entry.meal_type === meal.type)} calories={dailyLog?.meal_totals[meal.type] ?? 0} onAdd={() => openCreate(meal.type)} onEdit={openEdit} />
        ))}
      </div>

      <div className="mt-5 flex justify-center">
        <Link href="/dashboard" className="text-xs font-bold text-[var(--brand-green)] hover:underline">بازگشت به داشبورد</Link>
      </div>

      {sheetOpen ? <FoodEntrySheet entry={selectedEntry} defaultMeal={defaultMeal} plannedDraft={plannedDraft} recentFoods={recentFoods} customFoods={customFoods} quickListsLoading={quickListsLoading} recentFoodsError={recentFoodsError} customFoodsError={customFoodsError} isSaving={isSaving} error={actionError} onClose={() => { setSheetOpen(false); setPlannedDraft(null); setActionError(null); }} onSave={saveEntry} onDelete={selectedEntry ? removeEntry : null} /> : null}
    </NutritionShell>
  );
}

function MealSection({ meal, entries, calories, onAdd, onEdit }: { meal: { type: MealType; label: string; hint: string }; entries: FoodLogEntry[]; calories: number; onAdd: () => void; onEdit: (entry: FoodLogEntry) => void }) {
  const hasEntries = entries.length > 0;
  return (
    <section className="card p-4">
      <div className={`flex items-center justify-between gap-3 ${hasEntries ? "border-b border-[var(--border-soft)] pb-3" : "pb-1"}`}>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold">{meal.label}</h2>
            <span className="chip chip-neutral">{toPersianNumber(entries.length)} مورد</span>
          </div>
          <p className="mt-0.5 text-[0.68rem] text-[var(--text-subtle)]">{meal.hint}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="text-base font-bold">{toPersianNumber(calories)}</p>
            <p className="text-[0.62rem] text-[var(--text-subtle)]">کالری</p>
          </div>
          {hasEntries ? (
            <button type="button" onClick={onAdd} className="btn btn-ghost btn-sm">افزودن</button>
          ) : null}
        </div>
      </div>
      <div className={hasEntries ? "mt-3 space-y-2" : "mt-2"}>
        {hasEntries ? (
          entries.map((entry) => (
            <button key={entry.id} type="button" onClick={() => onEdit(entry)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-right transition hover:border-[var(--border-lime)]">
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{entry.food_name}</span>
                <span className="mt-0.5 block truncate text-[0.68rem] text-[var(--text-muted)]">{entry.serving_description}</span>
                {entry.note ? <span className="mt-1 block truncate text-[0.65rem] text-[var(--text-faint)]">{entry.note}</span> : null}
              </span>
              <span className="chip chip-green shrink-0">{toPersianNumber(entry.calories)} کالری</span>
            </button>
          ))
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-[var(--surface-soft)] px-3.5 py-2.5">
            <p className="text-xs text-[var(--text-subtle)]">هنوز چیزی برای این وعده ثبت نشده.</p>
            <button type="button" onClick={onAdd} className="btn btn-ghost btn-sm shrink-0">افزودن</button>
          </div>
        )}
      </div>
    </section>
  );
}

function getSuggestedMealType(): MealType {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tehran", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 21) return "dinner";
  return "snack";
}
