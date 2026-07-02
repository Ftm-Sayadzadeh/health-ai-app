"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";

import { ApiError } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import {
  createFoodLogEntry,
  DailyFoodLog,
  deleteFoodLogEntry,
  FoodLogEntry,
  FoodLogEntryInput,
  formatNutritionDate,
  formatNutritionError,
  getDailyFoodLog,
  getTehranTodayKey,
  isDateKey,
  MealType,
  shiftDateKey,
  toPersianNumber,
  updateFoodLogEntry,
} from "@/lib/nutrition";

import { FoodEntrySheet } from "./_components/food-entry-sheet";
import { NutritionLoading, NutritionShell, useNutritionAccess } from "./_components/nutrition-ui";

const meals: { type: MealType; label: string; hint: string }[] = [
  { type: "breakfast", label: "صبحانه", hint: "شروع روز" },
  { type: "lunch", label: "ناهار", hint: "وعده میانه روز" },
  { type: "dinner", label: "شام", hint: "وعده پایانی روز" },
  { type: "snack", label: "میان‌وعده", hint: "خوراکی‌های بین وعده‌ها" },
  { type: "other", label: "سایر", hint: "مواردی که در وعده‌های بالا نیست" },
];

export default function NutritionPage() {
  return <Suspense fallback={<NutritionShell><NutritionLoading /></NutritionShell>}><NutritionPageContent /></Suspense>;
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
  const [defaultMeal, setDefaultMeal] = useState<MealType>("breakfast");
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setDailyLog(await getDailyFoodLog(selectedDate));
  }, [selectedDate]);
  const access = useNutritionAccess(load);

  function changeDate(value: string) {
    if (!isDateKey(value) || value > today) return;
    router.replace(`/nutrition?date=${value}`);
  }

  function openCreate(mealType: MealType) {
    setSelectedEntry(null);
    setDefaultMeal(mealType);
    setActionError(null);
    setSheetOpen(true);
  }

  function openEdit(entry: FoodLogEntry) {
    setSelectedEntry(entry);
    setDefaultMeal(entry.meal_type);
    setActionError(null);
    setSheetOpen(true);
  }

  async function saveEntry(input: FoodLogEntryInput) {
    setIsSaving(true);
    setActionError(null);
    try {
      if (selectedEntry) await updateFoodLogEntry(selectedEntry.id, input);
      else await createFoodLogEntry(selectedDate, input);
      await load();
      setSheetOpen(false);
      setSelectedEntry(null);
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
      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#EFEAD9] bg-gradient-to-bl from-[#EAF7C7] via-white to-[#FFF6E8] p-5 shadow-[0_20px_48px_rgba(85,117,54,0.07)] sm:p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand-assets/avocado-slice.png" alt="" className="pointer-events-none absolute -left-3 -top-3 h-24 w-24 object-contain opacity-10" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl"><span className="inline-flex rounded-full bg-white/80 px-3 py-1.5 text-xs font-extrabold text-[#557536]">امروز چی خوردی؟</span><h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{formatNutritionDate(selectedDate)}</h1><p className="mt-2 text-sm leading-7 text-[#5F6F55]">غذای روزت رو سریع ثبت کن؛ کالری‌ها بر اساس عددهایی هستن که خودت وارد کردی.</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-white/80 px-3 py-1.5 text-[0.7rem] font-bold text-[#557536]">{toPersianNumber(entryCount)} مورد ثبت‌شده</span><span className="rounded-full bg-white/80 px-3 py-1.5 text-[0.7rem] font-bold text-[#557536]">{toPersianNumber(populatedMealCount)} وعده دارای ثبت</span></div></div>
          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/80 bg-white/85 px-6 py-4 text-center shadow-[0_12px_28px_rgba(85,117,54,0.08)] md:min-w-56"><div><p className="text-xs font-bold text-[#6B7A5A]">مجموع کالری روز</p><p className="mt-1 text-3xl font-extrabold text-[#25321F]">{toPersianNumber(dailyLog?.total_calories ?? 0)} <span className="text-sm font-bold text-[#6B7A5A]">کالری</span></p><p className="mt-1 text-[0.68rem] text-[#8A9A78]">بر اساس عددهایی که خودت وارد کردی</p></div><button type="button" onClick={() => openCreate(suggestedMeal)} className="rounded-full bg-[#D4F24E] px-5 py-3 text-sm font-extrabold shadow-[0_10px_20px_rgba(212,242,78,0.26)] hover:bg-[#CFE84E]">افزودن غذا</button></div>
        </div>
        <div className="relative mt-5 flex flex-wrap items-center gap-2 rounded-[1.2rem] border border-white/80 bg-white/55 p-2">
          <button type="button" onClick={() => changeDate(shiftDateKey(selectedDate, -1))} className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#557536] shadow-sm">روز قبل</button>
          <button type="button" onClick={() => changeDate(today)} disabled={selectedDate === today} className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#557536] shadow-sm disabled:opacity-45">امروز</button>
          <button type="button" onClick={() => changeDate(shiftDateKey(selectedDate, 1))} disabled={selectedDate >= today} className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#557536] shadow-sm disabled:opacity-45">روز بعد</button>
          <label className="mr-auto flex flex-wrap items-center justify-end gap-2 text-[0.68rem] font-bold text-[#6B7A5A]"><span>انتخاب روز دیگر</span><input aria-label="انتخاب تاریخ" type="date" max={today} value={selectedDate} onChange={(event) => changeDate(event.target.value)} dir="ltr" className="rounded-full border border-[#DCE9B0] bg-white px-3 py-2 text-xs outline-none focus:ring-4 focus:ring-[#EAF7C7]" /></label>
        </div>
      </section>

      {access.error ? <p role="alert" className="mt-4 rounded-2xl border border-[#F5D5C9] bg-[#FFF6E8] p-4 text-sm text-[#7A3A27]">دریافت گزارش روزانه ممکن نشد. دوباره تلاش کن.</p> : null}

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        {meals.map((meal) => (
          <MealSection key={meal.type} meal={meal} entries={(dailyLog?.entries ?? []).filter((entry) => entry.meal_type === meal.type)} calories={dailyLog?.meal_totals[meal.type] ?? 0} onAdd={() => openCreate(meal.type)} onEdit={openEdit} />
        ))}
      </div>

      <div className="mt-5 flex justify-center"><Link href="/dashboard" className="text-xs font-extrabold text-[#557536]">بازگشت به داشبورد</Link></div>

      {sheetOpen ? <FoodEntrySheet entry={selectedEntry} defaultMeal={defaultMeal} isSaving={isSaving} error={actionError} onClose={() => { setSheetOpen(false); setActionError(null); }} onSave={saveEntry} onDelete={selectedEntry ? removeEntry : null} /> : null}
    </NutritionShell>
  );
}

function MealSection({ meal, entries, calories, onAdd, onEdit }: { meal: { type: MealType; label: string; hint: string }; entries: FoodLogEntry[]; calories: number; onAdd: () => void; onEdit: (entry: FoodLogEntry) => void }) {
  return (
    <section className={`rounded-[1.4rem] border border-[#EFEAD9] bg-white shadow-[0_12px_28px_rgba(85,117,54,0.05)] ${entries.length ? "p-4" : "p-3.5"}`}>
      <div className={`flex items-center justify-between gap-3 ${entries.length ? "border-b border-[#EFEAD9] pb-3" : "pb-2"}`}><div><div className="flex items-center gap-2"><h2 className="text-base font-extrabold">{meal.label}</h2><span className="rounded-full bg-[#F7F5EF] px-2 py-1 text-[0.62rem] font-bold text-[#77736B]">{toPersianNumber(entries.length)} مورد</span></div><p className="mt-0.5 text-[0.68rem] text-[#8A9A78]">{meal.hint}</p></div><div className="flex items-center gap-3"><div className="text-left"><p className="text-base font-extrabold">{toPersianNumber(calories)}</p><p className="text-[0.62rem] text-[#8A9A78]">کالری</p></div>{entries.length ? <button type="button" onClick={onAdd} className="rounded-full bg-[#EAF7C7] px-3 py-2 text-[0.68rem] font-extrabold text-[#557536] hover:bg-[#D4F24E]">افزودن</button> : null}</div></div>
      <div className={entries.length ? "mt-3 space-y-2" : "mt-1"}>
        {entries.length ? entries.map((entry) => <button key={entry.id} type="button" onClick={() => onEdit(entry)} className="flex w-full items-center justify-between gap-3 rounded-[0.95rem] border border-[#EFEAD9] bg-[#FFFDF8] px-3.5 py-2.5 text-right transition hover:border-[#DCE9B0]"><span className="min-w-0"><span className="block truncate text-sm font-extrabold">{entry.food_name}</span><span className="mt-0.5 block truncate text-[0.68rem] text-[#6B7A5A]">{entry.serving_description}</span>{entry.note ? <span className="mt-1 block truncate text-[0.65rem] text-[#9A958B]">{entry.note}</span> : null}</span><span className="shrink-0 rounded-full bg-[#EAF7C7] px-3 py-1.5 text-xs font-extrabold text-[#557536]">{toPersianNumber(entry.calories)} کالری</span></button>) : <div className="flex items-center justify-between gap-3 rounded-[0.9rem] bg-[#FFFDF8] px-3.5 py-2.5"><p className="text-xs text-[#8A9A78]">هنوز چیزی برای این وعده ثبت نشده.</p><button type="button" onClick={onAdd} className="shrink-0 rounded-full bg-[#EAF7C7] px-3 py-2 text-[0.68rem] font-extrabold text-[#557536]">افزودن</button></div>}
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
