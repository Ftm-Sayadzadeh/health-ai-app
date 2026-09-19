"use client";

import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import {
  createCustomFood,
  CustomFood,
  deleteCustomFood,
  FoodLogEntryInput,
  formatNutritionError,
  getCustomFoods,
  toPersianNumber,
  updateCustomFood,
} from "@/lib/nutrition";

import { NutritionLoading, NutritionShell, useNutritionAccess } from "../_components/nutrition-ui";

type CustomFoodInput = Omit<FoodLogEntryInput, "meal_type">;

export default function CustomFoodsPage() {
  const router = useRouter();
  const [foods, setFoods] = useState<CustomFood[]>([]);
  const [selectedFood, setSelectedFood] = useState<CustomFood | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await getCustomFoods();
    setFoods(response.results);
  }, []);
  const access = useNutritionAccess(load);

  function openCreate() {
    setSelectedFood(null);
    setActionError(null);
    setSuccess(null);
    setFormOpen(true);
  }

  function openEdit(food: CustomFood) {
    setSelectedFood(food);
    setActionError(null);
    setSuccess(null);
    setFormOpen(true);
  }

  async function handleRequest(action: () => Promise<void>) {
    setIsSaving(true);
    setActionError(null);
    try {
      await action();
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

  async function saveFood(input: CustomFoodInput) {
    await handleRequest(async () => {
      if (selectedFood) await updateCustomFood(selectedFood.id, input);
      else await createCustomFood(input);
      await load();
      setFormOpen(false);
      setSelectedFood(null);
      setSuccess(selectedFood ? "تغییرات غذای ذخیره‌شده ثبت شد." : "غذا برای دفعات بعد ذخیره شد.");
    });
  }

  async function removeFood() {
    if (!selectedFood) return;
    await handleRequest(async () => {
      await deleteCustomFood(selectedFood.id);
      await load();
      setFormOpen(false);
      setSelectedFood(null);
      setSuccess("غذا از فهرست ذخیره‌شده‌ها حذف شد.");
    });
  }

  if (access.isLoading) return <NutritionShell><NutritionLoading /></NutritionShell>;

  return (
    <NutritionShell>
      <section className="card-tint p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="chip chip-green">فهرست شخصی تو</span>
            <h1 className="mt-2 text-xl font-bold sm:text-2xl">غذاهای ذخیره‌شده</h1>
            <p className="mt-1.5 max-w-2xl text-[0.82rem] leading-6 text-[var(--text-muted)]">غذاهایی که بیشتر تکرار می‌شن رو اینجا نگه دار تا دفعه بعد سریع‌تر فرم ثبت رو پر کنی. کالری‌ها همون عددهایی هستن که خودت وارد کردی.</p>
          </div>
          <button type="button" onClick={openCreate} className="btn btn-primary shrink-0">ذخیره غذای جدید</button>
        </div>
      </section>

      {success ? <p role="status" className="notice notice-success mt-4">{success}</p> : null}
      {access.error ? <p role="alert" className="notice notice-error mt-4">دریافت غذاهای ذخیره‌شده ممکن نشد. دوباره تلاش کن.</p> : null}

      <section className="card mt-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-soft)] pb-4">
          <div>
            <h2 className="font-bold">انتخاب‌های ذخیره‌شده</h2>
            <p className="mt-1 text-xs text-[var(--text-subtle)]">{toPersianNumber(foods.length)} غذا در فهرست شخصی</p>
          </div>
          <Link href="/nutrition" className="btn btn-secondary btn-sm">بازگشت به ثبت روزانه</Link>
        </div>

        {foods.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {foods.map((food) => (
              <button key={food.id} type="button" onClick={() => openEdit(food)} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3.5 text-right transition hover:border-[var(--border-lime)] hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{food.food_name}</span>
                  <span className="mt-1 block truncate text-xs text-[var(--text-muted)]">{food.serving_description}</span>
                  {food.note ? <span className="mt-1 block truncate text-[0.68rem] text-[var(--text-faint)]">{food.note}</span> : null}
                </span>
                <span className="chip chip-green shrink-0">{toPersianNumber(food.calories)} کالری</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-[var(--border-lime)] bg-[var(--surface-soft)] px-5 py-8 text-center">
            <p className="text-sm font-bold">هنوز غذایی ذخیره نکردی.</p>
            <p className="mt-2 text-xs text-[var(--text-subtle)]">می‌تونی از فرم ثبت روزانه یا دکمه بالا اولین غذات رو اضافه کنی.</p>
          </div>
        )}
      </section>

      {formOpen ? (
        <CustomFoodForm
          food={selectedFood}
          isSaving={isSaving}
          error={actionError}
          onClose={() => { if (!isSaving) setFormOpen(false); }}
          onSave={saveFood}
          onDelete={selectedFood ? removeFood : null}
        />
      ) : null}
    </NutritionShell>
  );
}

function CustomFoodForm({
  food,
  isSaving,
  error,
  onClose,
  onSave,
  onDelete,
}: {
  food: CustomFood | null;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: CustomFoodInput) => Promise<void>;
  onDelete: (() => Promise<void>) | null;
}) {
  const [foodName, setFoodName] = useState(food?.food_name ?? "");
  const [serving, setServing] = useState(food?.serving_description ?? "");
  const [calories, setCalories] = useState(food ? String(food.calories) : "");
  const [note, setNote] = useState(food?.note ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setValidationError(null);
    const calorieValue = Number(calories);
    if (!foodName.trim()) return setValidationError("نام غذا رو وارد کن.");
    if (!serving.trim()) return setValidationError("مقدار یا اندازه رو وارد کن.");
    if (!calories || !Number.isInteger(calorieValue) || calorieValue < 0 || calorieValue > 10000) return setValidationError("کالری باید عددی بین ۰ تا ۱۰٬۰۰۰ باشه.");
    await onSave({ food_name: foodName, serving_description: serving, calories: calorieValue, note });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#25321f]/30 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="custom-food-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-[var(--border-soft)] bg-white p-5 shadow-[var(--shadow-lg)] sm:max-w-xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-bold text-[var(--brand-green)]">فهرست شخصی</p>
            <h2 id="custom-food-title" className="mt-1 text-lg font-bold">{food ? "ویرایش غذای ذخیره‌شده" : "ذخیره غذای جدید"}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} aria-label="بستن" className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-lg text-[var(--text-muted)] hover:bg-[var(--surface-soft)]">×</button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">نام غذا
              <input autoFocus value={foodName} onChange={(event) => setFoodName(event.target.value)} maxLength={120} className="field-input mt-2" />
            </label>
            <label className="field-label">مقدار یا اندازه
              <input value={serving} onChange={(event) => setServing(event.target.value)} maxLength={120} className="field-input mt-2" />
            </label>
          </div>
          <label className="block field-label">کالری
            <input type="number" inputMode="numeric" min="0" max="10000" step="1" value={calories} onChange={(event) => setCalories(event.target.value)} dir="ltr" className="field-input mt-2 text-left" />
            <span className="mt-1 block text-[0.68rem] font-normal text-[var(--text-subtle)]">این عدد رو خودت وارد می‌کنی و خودکار محاسبه نمی‌شه.</span>
          </label>
          <label className="block field-label">یادداشت (اختیاری)
            <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} className="field-input mt-2 resize-none" />
          </label>
          {(validationError || error) ? <p role="alert" className="notice notice-error">{validationError || error}</p> : null}
          {confirmDelete ? (
            <div className="notice" style={{ backgroundColor: "var(--danger-soft)" }}>
              <p className="text-sm font-bold">این غذا از ذخیره‌شده‌ها حذف بشه؟ ثبت‌های روزانه قبلی تغییر نمی‌کنن.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={isSaving} onClick={onDelete ?? undefined} className="btn btn-danger btn-sm">حذف</button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-secondary btn-sm">انصراف</button>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2 border-t border-[var(--border-soft)] pt-4">
            <button type="submit" disabled={isSaving} className="btn btn-primary min-w-40 flex-1">{isSaving ? "در حال ذخیره..." : "ذخیره"}</button>
            <button type="button" onClick={onClose} disabled={isSaving} className="btn btn-secondary btn-sm">انصراف</button>
            {food && !confirmDelete ? <button type="button" onClick={() => setConfirmDelete(true)} className="btn btn-danger btn-sm">حذف</button> : null}
          </div>
        </form>
      </section>
    </div>
  );
}
