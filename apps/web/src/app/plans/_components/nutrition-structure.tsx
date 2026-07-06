"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import type { MealType } from "@/lib/nutrition";
import {
  createNutritionPlanItem,
  deleteNutritionPlanItem,
  formatNutritionPlanError,
  getNutritionPlanStructure,
  NutritionPlanItem,
  NutritionPlanItemInput,
  NutritionPlanStructure,
  updateNutritionPlanItem,
} from "@/lib/structured-nutrition-plan";

const mealLabels: Record<MealType, string> = {
  breakfast: "صبحانه",
  lunch: "ناهار",
  dinner: "شام",
  snack: "میان‌وعده",
  other: "سایر",
};

export function NutritionStructureSection({
  structure,
  onChange,
}: {
  structure: NutritionPlanStructure;
  onChange: (value: NutritionPlanStructure) => void;
}) {
  const router = useRouter();
  const firstPopulated = structure.meals.find((meal) => meal.items.length);
  const [expandedMeal, setExpandedMeal] = useState<MealType>(firstPopulated?.meal_type ?? "breakfast");
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NutritionPlanItem | null>(null);
  const [defaultMeal, setDefaultMeal] = useState<MealType>("breakfast");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate(mealType: MealType) {
    setSelectedItem(null);
    setDefaultMeal(mealType);
    setError(null);
    setEditorOpen(true);
  }

  function openEdit(item: NutritionPlanItem) {
    if (!structure.editable) return;
    setSelectedItem(item);
    setDefaultMeal(item.meal_type);
    setError(null);
    setEditorOpen(true);
  }

  async function refresh() {
    onChange(await getNutritionPlanStructure(structure.plan.id));
  }

  async function handleFailure(caught: unknown) {
    if (caught instanceof ApiError && caught.status === 401) {
      logout();
      router.replace("/login");
      return;
    }
    setError(formatNutritionPlanError(caught));
  }

  async function saveItem(input: NutritionPlanItemInput) {
    setIsSaving(true);
    setError(null);
    try {
      if (selectedItem) {
        await updateNutritionPlanItem(structure.plan.id, selectedItem.id, input);
      } else {
        await createNutritionPlanItem(structure.plan.id, input);
      }
      await refresh();
      setExpandedMeal(input.meal_type);
      setEditorOpen(false);
      setSelectedItem(null);
    } catch (caught) {
      await handleFailure(caught);
    } finally {
      setIsSaving(false);
    }
  }

  async function removeItem() {
    if (!selectedItem) return;
    setIsSaving(true);
    setError(null);
    try {
      await deleteNutritionPlanItem(structure.plan.id, selectedItem.id);
      await refresh();
      setEditorOpen(false);
      setSelectedItem(null);
    } catch (caught) {
      await handleFailure(caught);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mt-4 rounded-[1.5rem] border border-[#DCE9B0] bg-white p-4 shadow-[0_14px_34px_rgba(85,117,54,0.06)] sm:p-5">
      <div className="flex flex-col gap-3 border-b border-[#EFEAD9] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-extrabold">وعده‌های برنامه</h2>
            <span className="rounded-full bg-[#EAF7C7] px-2.5 py-1 text-[0.65rem] font-extrabold text-[#557536]">{structure.item_count.toLocaleString("fa-IR")} مورد</span>
            {!structure.editable ? <span className="rounded-full bg-[#F4F1E9] px-2.5 py-1 text-[0.65rem] font-extrabold text-[#77736B]">فقط مشاهده</span> : null}
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-[#6B7A5A]">این موارد را خودت از روی برنامه‌ای که داری وارد می‌کنی. اپ این برنامه را تأیید پزشکی یا اصلاح نمی‌کند.</p>
        </div>
        {structure.editable ? <button type="button" onClick={() => openCreate(expandedMeal)} className="shrink-0 rounded-full bg-[#D4F24E] px-5 py-2.5 text-xs font-extrabold shadow-[0_8px_18px_rgba(212,242,78,0.24)]">افزودن مورد</button> : null}
      </div>

      {error && !editorOpen ? <p role="alert" className="mt-4 rounded-2xl border border-[#F5D5C9] bg-[#FFF6E8] p-3 text-sm text-[#7A3A27]">{error}</p> : null}

      <div className="mt-4 space-y-2">
        {structure.meals.map((meal) => {
          const expanded = expandedMeal === meal.meal_type;
          return (
            <div key={meal.meal_type} className="overflow-hidden rounded-[1.1rem] border border-[#EFEAD9] bg-[#FFFDF8]">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button type="button" onClick={() => setExpandedMeal(meal.meal_type)} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center justify-between gap-3 text-right">
                  <span className="font-extrabold">{mealLabels[meal.meal_type]}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[0.65rem] font-bold text-[#77736B]">{meal.items.length.toLocaleString("fa-IR")} مورد</span>
                </button>
                {structure.editable ? <button type="button" onClick={() => openCreate(meal.meal_type)} aria-label={`افزودن به ${mealLabels[meal.meal_type]}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF7C7] text-lg font-bold text-[#557536]">+</button> : null}
              </div>
              {expanded ? (
                <div className="space-y-2 border-t border-[#EFEAD9] bg-white p-3">
                  {meal.items.length ? meal.items.map((item) => (
                    <button key={item.id} type="button" disabled={!structure.editable} onClick={() => openEdit(item)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#EFEAD9] bg-[#FFFDF8] px-3.5 py-3 text-right disabled:cursor-default">
                      <span className="min-w-0"><span className="block truncate text-sm font-extrabold">{item.food_name}</span><span className="mt-0.5 block truncate text-[0.68rem] text-[#6B7A5A]">{item.serving_description}</span>{item.note ? <span className="mt-1 block truncate text-[0.65rem] text-[#9A958B]">{item.note}</span> : null}</span>
                      <span className="shrink-0 rounded-full bg-[#EAF7C7] px-3 py-1.5 text-xs font-extrabold text-[#557536]">{item.calories === null ? "کالری ثبت نشده" : `${item.calories.toLocaleString("fa-IR")} کالری`}</span>
                    </button>
                  )) : <div className="flex items-center justify-between gap-3 rounded-xl bg-[#FFFDF8] px-3.5 py-3"><p className="text-xs text-[#8A9A78]">هنوز موردی برای این وعده وارد نشده.</p>{structure.editable ? <button type="button" onClick={() => openCreate(meal.meal_type)} className="shrink-0 text-xs font-extrabold text-[#557536]">افزودن</button> : null}</div>}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {editorOpen ? (
        <NutritionPlanItemEditor
          item={selectedItem}
          defaultMeal={defaultMeal}
          isSaving={isSaving}
          error={error}
          onClose={() => { if (!isSaving) { setEditorOpen(false); setError(null); } }}
          onSave={saveItem}
          onDelete={selectedItem ? removeItem : null}
        />
      ) : null}
    </section>
  );
}

function NutritionPlanItemEditor({
  item,
  defaultMeal,
  isSaving,
  error,
  onClose,
  onSave,
  onDelete,
}: {
  item: NutritionPlanItem | null;
  defaultMeal: MealType;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: NutritionPlanItemInput) => Promise<void>;
  onDelete: (() => Promise<void>) | null;
}) {
  const [mealType, setMealType] = useState<MealType>(item?.meal_type ?? defaultMeal);
  const [foodName, setFoodName] = useState(item?.food_name ?? "");
  const [serving, setServing] = useState(item?.serving_description ?? "");
  const [calories, setCalories] = useState(item?.calories === null || item?.calories === undefined ? "" : String(item.calories));
  const [note, setNote] = useState(item?.note ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setValidationError(null);
    const calorieValue = calories === "" ? null : Number(calories);
    if (!foodName.trim()) return setValidationError("نام غذا رو وارد کن.");
    if (!serving.trim()) return setValidationError("مقدار یا اندازه رو وارد کن.");
    if (calorieValue !== null && (!Number.isInteger(calorieValue) || calorieValue < 0 || calorieValue > 10000)) return setValidationError("کالری باید خالی یا عددی بین ۰ تا ۱۰٬۰۰۰ باشه.");
    await onSave({ meal_type: mealType, food_name: foodName, serving_description: serving, calories: calorieValue, note });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#25321F]/35 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="nutrition-plan-item-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] border border-[#EFEAD9] bg-white p-5 shadow-[0_30px_80px_rgba(37,50,31,0.2)] sm:max-w-xl sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold text-[#86B93B]">وعده برنامه</p><h3 id="nutrition-plan-item-title" className="mt-1 text-xl font-extrabold">{item ? "ویرایش مورد" : "افزودن مورد"}</h3></div><button type="button" onClick={onClose} disabled={isSaving} aria-label="بستن" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F5EF] text-lg text-[#6B7A5A]">×</button></div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <fieldset><legend className="text-sm font-extrabold text-[#557536]">وعده</legend><div className="mt-2 flex flex-wrap gap-2">{(Object.entries(mealLabels) as [MealType, string][]).map(([value, label]) => <button key={value} type="button" aria-pressed={mealType === value} onClick={() => setMealType(value)} className={`rounded-full border px-4 py-2 text-xs font-extrabold ${mealType === value ? "border-[#D4F24E] bg-[#D4F24E]" : "border-[#E9E5DC] bg-[#FFFDF8] text-[#6B7A5A]"}`}>{label}</button>)}</div></fieldset>
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-[#557536]">نام غذا<input autoFocus value={foodName} onChange={(event) => setFoodName(event.target.value)} maxLength={120} className="mt-2 w-full rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" /></label><label className="text-sm font-bold text-[#557536]">مقدار یا اندازه<input value={serving} onChange={(event) => setServing(event.target.value)} maxLength={120} className="mt-2 w-full rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" /></label></div>
          <label className="block text-sm font-bold text-[#557536]">کالری (اختیاری)<input type="number" inputMode="numeric" min="0" max="10000" step="1" value={calories} onChange={(event) => setCalories(event.target.value)} dir="ltr" className="mt-2 w-full rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3 text-left outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" /><span className="mt-1 block text-[0.68rem] font-normal text-[#8A9A78]">خالی گذاشتن کالری مجازه؛ اپ عددی رو محاسبه نمی‌کنه.</span></label>
          <label className="block text-sm font-bold text-[#557536]">یادداشت (اختیاری)<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} className="mt-2 w-full resize-none rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" /></label>
          {(validationError || error) ? <p role="alert" className="rounded-2xl border border-[#F5D5C9] bg-[#FFF6E8] p-3 text-sm text-[#7A3A27]">{validationError || error}</p> : null}
          {confirmDelete ? <div className="rounded-2xl bg-[#FFF6E8] p-4"><p className="text-sm font-bold">این مورد از برنامه حذف بشه؟ ثبت‌های غذایی روزانه تغییر نمی‌کنن.</p><div className="mt-3 flex gap-2"><button type="button" disabled={isSaving} onClick={onDelete ?? undefined} className="rounded-full bg-[#F27C5B] px-5 py-2.5 text-xs font-extrabold text-white">حذف</button><button type="button" onClick={() => setConfirmDelete(false)} className="rounded-full bg-white px-5 py-2.5 text-xs font-bold">انصراف</button></div></div> : null}
          <div className="flex flex-wrap gap-2 border-t border-[#EFEAD9] pt-4"><button type="submit" disabled={isSaving} className="min-w-40 flex-1 rounded-full bg-[#D4F24E] px-6 py-3.5 text-sm font-extrabold disabled:opacity-60">{isSaving ? "در حال ذخیره..." : "ذخیره مورد"}</button><button type="button" onClick={onClose} disabled={isSaving} className="rounded-full border border-[#E9E5DC] px-5 py-3.5 text-xs font-bold text-[#6B7A5A]">انصراف</button>{item && !confirmDelete ? <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-full border border-[#F5D5C9] bg-[#FFF6E8] px-5 py-3.5 text-xs font-extrabold text-[#7A3A27]">حذف</button> : null}</div>
        </form>
      </section>
    </div>
  );
}
