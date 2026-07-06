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
    <section className="mt-4 rounded-[1.5rem] border border-[#DCE9B0] bg-gradient-to-l from-[#F4FBE3] to-white p-4 shadow-[0_12px_30px_rgba(85,117,54,0.06)] sm:p-5">
      <div className="flex flex-col gap-3 border-b border-[#DCE9B0] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2"><h2 className="font-extrabold">از برنامه روزانه</h2><span className="rounded-full bg-white px-2.5 py-1 text-[0.65rem] font-extrabold text-[#557536]">{toPersianNumber(structure.item_count)} مورد برنامه‌ریزی‌شده</span></div>
          <p className="mt-1 text-xs font-bold text-[#557536]">{structure.plan.title}</p>
          <p className="mt-1 max-w-2xl text-[0.72rem] leading-6 text-[#6B7A5A]">این‌ها مواردی هستن که خودت در برنامه وارد کردی، نه چیزهایی که خوردی. هر مورد قبل از ثبت واقعی قابل بررسی و ویرایشه.</p>
        </div>
        <Link href={`/plans/${structure.plan.id}`} className="shrink-0 rounded-full border border-[#DCE9B0] bg-white px-4 py-2 text-xs font-extrabold text-[#557536]">مشاهده برنامه</Link>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {populatedMeals.map((meal) => (
          <div key={meal.meal_type} className="rounded-[1.1rem] border border-[#E4ECCB] bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-3"><h3 className="text-sm font-extrabold">{mealLabels[meal.meal_type]}</h3><span className="text-[0.65rem] font-bold text-[#8A9A78]">{toPersianNumber(meal.items.length)} مورد</span></div>
            <div className="space-y-2">
              {meal.items.map((item) => (
                <button key={item.id} type="button" onClick={() => onSelect(item)} className="flex w-full items-center justify-between gap-3 rounded-xl bg-[#FFFDF8] px-3 py-2.5 text-right transition hover:bg-[#F4FBE3] focus:outline-none focus:ring-4 focus:ring-[#EAF7C7]">
                  <span className="min-w-0"><span className="block truncate text-xs font-extrabold">{item.food_name}</span><span className="mt-0.5 block truncate text-[0.65rem] text-[#6B7A5A]">{item.serving_description}</span></span>
                  <span className="shrink-0 text-[0.68rem] font-extrabold text-[#557536]">{item.calories === null ? "بررسی و ثبت" : `${toPersianNumber(item.calories)} کالری`}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
