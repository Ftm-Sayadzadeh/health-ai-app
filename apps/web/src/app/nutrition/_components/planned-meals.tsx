"use client";

import Link from "next/link";

import type { MealType } from "@/lib/nutrition";
import { toPersianNumber } from "@/lib/nutrition";
import type { NutritionPlanItem, NutritionPlanStructure } from "@/lib/structured-nutrition-plan";

const mealLabels: Record<MealType, string> = {
  breakfast: "صبحانه",
  lunch: "ناهار",
  dinner: "شام",
  snack: "میان‌وعده",
  other: "سایر",
};

export function PlannedMeals({
  structure,
  onSelect,
}: {
  structure: NutritionPlanStructure;
  onSelect: (item: NutritionPlanItem) => void;
}) {
  const populatedMeals = structure.meals.filter((meal) => meal.items.length);

  return (
    <section className="mt-4 rounded-xl border border-[var(--border-lime)] bg-[var(--brand-avocado-softer)] p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-[var(--border-lime)] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold">از برنامه روزانه</h2>
            <span className="chip chip-green">{toPersianNumber(structure.item_count)} مورد برنامه‌ریزی‌شده</span>
          </div>
          <p className="mt-1 text-xs font-bold text-[var(--brand-green)]">{structure.plan.title}</p>
          <p className="mt-1 max-w-2xl text-[0.72rem] leading-6 text-[var(--text-muted)]">این‌ها مواردی هستن که خودت در برنامه وارد کردی، نه چیزهایی که خوردی. هر مورد قبل از ثبت واقعی قابل بررسی و ویرایشه.</p>
        </div>
        <Link href={`/plans/${structure.plan.id}`} className="btn btn-secondary btn-sm shrink-0">مشاهده برنامه</Link>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {populatedMeals.map((meal) => (
          <div key={meal.meal_type} className="rounded-lg border border-[var(--border-soft)] bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold">{mealLabels[meal.meal_type]}</h3>
              <span className="text-[0.65rem] font-bold text-[var(--text-subtle)]">{toPersianNumber(meal.items.length)} مورد</span>
            </div>
            <div className="space-y-2">
              {meal.items.map((item) => (
                <button key={item.id} type="button" onClick={() => onSelect(item)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-[var(--border-lime)] bg-[var(--brand-avocado-soft)] px-3 py-2.5 text-right transition hover:border-[var(--brand-avocado)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]">
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold">{item.food_name}</span>
                    <span className="mt-0.5 block truncate text-[0.65rem] text-[var(--text-muted)]">{item.serving_description}</span>
                  </span>
                  <span className="shrink-0 text-[0.68rem] font-bold text-[var(--brand-green)]">{item.calories === null ? "بررسی و ثبت" : `${toPersianNumber(item.calories)} کالری`}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
