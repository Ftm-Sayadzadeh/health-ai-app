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
    <section className="card mt-4 p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-[var(--border-soft)] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold">وعده‌های برنامه</h2>
            <span className="chip chip-green">{structure.item_count.toLocaleString("fa-IR")} مورد</span>
            {!structure.editable ? <span className="chip chip-neutral">فقط مشاهده</span> : null}
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-[var(--text-muted)]">این موارد را خودت از روی برنامه‌ای که داری وارد می‌کنی. اپ این برنامه را تأیید پزشکی یا اصلاح نمی‌کند.</p>
        </div>
        {structure.editable ? <button type="button" onClick={() => openCreate(expandedMeal)} className="btn btn-primary btn-sm shrink-0">افزودن مورد</button> : null}
      </div>

      {error && !editorOpen ? <p role="alert" className="notice notice-error mt-4">{error}</p> : null}

      <div className="mt-4 space-y-2">
        {structure.meals.map((meal) => {
          const expanded = expandedMeal === meal.meal_type;
          return (
            <div key={meal.meal_type} className="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-soft)]">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button type="button" onClick={() => setExpandedMeal(meal.meal_type)} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center justify-between gap-3 text-right">
                  <span className="font-bold">{mealLabels[meal.meal_type]}</span>
                  <span className="chip chip-neutral">{meal.items.length.toLocaleString("fa-IR")} مورد</span>
                </button>
                {structure.editable ? <button type="button" onClick={() => openCreate(meal.meal_type)} aria-label={`افزودن به ${mealLabels[meal.meal_type]}`} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--brand-avocado-soft)] text-base font-bold text-[var(--brand-green)] hover:bg-[var(--brand-avocado)] hover:text-white">+</button> : null}
              </div>
              {expanded ? (
                <div className="space-y-2 border-t border-[var(--border-soft)] bg-white p-3">
                  {meal.items.length ? meal.items.map((item) => (
                    <button key={item.id} type="button" disabled={!structure.editable} onClick={() => openEdit(item)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3.5 py-3 text-right transition hover:border-[var(--border-lime)] disabled:cursor-default">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{item.food_name}</span>
                        <span className="mt-0.5 block truncate text-[0.68rem] text-[var(--text-muted)]">{item.serving_description}</span>
                        {item.note ? <span className="mt-1 block truncate text-[0.65rem] text-[var(--text-faint)]">{item.note}</span> : null}
                      </span>
                      <span className="chip chip-green shrink-0">{item.calories === null ? "کالری ثبت نشده" : `${item.calories.toLocaleString("fa-IR")} کالری`}</span>
                    </button>
                  )) : (
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-[var(--surface-soft)] px-3.5 py-3">
                      <p className="text-xs text-[var(--text-subtle)]">هنوز موردی برای این وعده وارد نشده.</p>
                      {structure.editable ? <button type="button" onClick={() => openCreate(meal.meal_type)} className="btn btn-ghost btn-sm shrink-0">افزودن</button> : null}
                    </div>
                  )}
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#25321f]/30 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="nutrition-plan-item-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-[var(--border-soft)] bg-white p-5 shadow-[var(--shadow-lg)] sm:max-w-xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-bold text-[var(--brand-green)]">وعده برنامه</p>
            <h3 id="nutrition-plan-item-title" className="mt-1 text-lg font-bold">{item ? "ویرایش مورد" : "افزودن مورد"}</h3>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} aria-label="بستن" className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-lg text-[var(--text-muted)] hover:bg-[var(--surface-soft)]">×</button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <fieldset>
            <legend className="field-label">وعده</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.entries(mealLabels) as [MealType, string][]).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={mealType === value} onClick={() => setMealType(value)} className={`rounded-full border px-4 py-2 text-xs font-bold transition ${mealType === value ? "border-[var(--brand-avocado)] bg-[var(--brand-avocado)] text-white" : "border-[var(--border-input)] bg-[var(--surface-input)] text-[var(--text-muted)] hover:border-[var(--border-lime)]"}`}>{label}</button>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">نام غذا
              <input autoFocus value={foodName} onChange={(event) => setFoodName(event.target.value)} maxLength={120} className="field-input mt-2" />
            </label>
            <label className="field-label">مقدار یا اندازه
              <input value={serving} onChange={(event) => setServing(event.target.value)} maxLength={120} className="field-input mt-2" />
            </label>
          </div>
          <label className="block field-label">کالری (اختیاری)
            <input type="number" inputMode="numeric" min="0" max="10000" step="1" value={calories} onChange={(event) => setCalories(event.target.value)} dir="ltr" className="field-input mt-2 text-left" />
            <span className="mt-1 block text-[0.68rem] font-normal text-[var(--text-subtle)]">خالی گذاشتن کالری مجازه؛ اپ عددی رو محاسبه نمی‌کنه.</span>
          </label>
          <label className="block field-label">یادداشت (اختیاری)
            <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} className="field-input mt-2 resize-none" />
          </label>
          {(validationError || error) ? <p role="alert" className="notice notice-error">{validationError || error}</p> : null}
          {confirmDelete ? (
            <div className="notice" style={{ backgroundColor: "var(--danger-soft)" }}>
              <p className="text-sm font-bold">این مورد از برنامه حذف بشه؟ ثبت‌های غذایی روزانه تغییر نمی‌کنن.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={isSaving} onClick={onDelete ?? undefined} className="btn btn-danger btn-sm">حذف</button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-secondary btn-sm">انصراف</button>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2 border-t border-[var(--border-soft)] pt-4">
            <button type="submit" disabled={isSaving} className="btn btn-primary min-w-40 flex-1">{isSaving ? "در حال ذخیره..." : "ذخیره مورد"}</button>
            <button type="button" onClick={onClose} disabled={isSaving} className="btn btn-secondary btn-sm">انصراف</button>
            {item && !confirmDelete ? <button type="button" onClick={() => setConfirmDelete(true)} className="btn btn-danger btn-sm">حذف</button> : null}
          </div>
        </form>
      </section>
    </div>
  );
}
