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
      <section className="rounded-[1.75rem] border border-[#EFEAD9] bg-gradient-to-bl from-[#EAF7C7] via-white to-[#FFF6E8] p-5 shadow-[0_20px_48px_rgba(85,117,54,0.07)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-white/80 px-3 py-1.5 text-xs font-extrabold text-[#557536]">فهرست شخصی تو</span>
            <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">غذاهای ذخیره‌شده</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5F6F55]">غذاهایی که بیشتر تکرار می‌شن رو اینجا نگه دار تا دفعه بعد سریع‌تر فرم ثبت رو پر کنی. کالری‌ها همون عددهایی هستن که خودت وارد کردی.</p>
          </div>
          <button type="button" onClick={openCreate} className="shrink-0 rounded-full bg-[#D4F24E] px-6 py-3 text-sm font-extrabold shadow-[0_10px_22px_rgba(212,242,78,0.28)] hover:bg-[#CFE84E]">ذخیره غذای جدید</button>
        </div>
      </section>

      {success ? <p role="status" className="mt-4 rounded-2xl border border-[#DCE9B0] bg-[#F4FBE3] px-4 py-3 text-sm font-bold text-[#557536]">{success}</p> : null}
      {access.error ? <p role="alert" className="mt-4 rounded-2xl border border-[#F5D5C9] bg-[#FFF6E8] px-4 py-3 text-sm text-[#7A3A27]">دریافت غذاهای ذخیره‌شده ممکن نشد. دوباره تلاش کن.</p> : null}

      <section className="mt-4 rounded-[1.6rem] border border-[#EFEAD9] bg-white p-4 shadow-[0_14px_34px_rgba(85,117,54,0.06)] sm:p-5">
        <div className="flex items-center justify-between gap-3 border-b border-[#EFEAD9] pb-4">
          <div><h2 className="font-extrabold">انتخاب‌های ذخیره‌شده</h2><p className="mt-1 text-xs text-[#8A9A78]">{toPersianNumber(foods.length)} غذا در فهرست شخصی</p></div>
          <Link href="/nutrition" className="rounded-full border border-[#DCE9B0] bg-[#F4FBE3] px-4 py-2 text-xs font-extrabold text-[#557536]">بازگشت به ثبت روزانه</Link>
        </div>

        {foods.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {foods.map((food) => (
              <button key={food.id} type="button" onClick={() => openEdit(food)} className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-[#EFEAD9] bg-[#FFFDF8] px-4 py-3.5 text-right transition hover:border-[#D4F24E] hover:bg-[#F9FDEB] focus:outline-none focus:ring-4 focus:ring-[#EAF7C7]">
                <span className="min-w-0"><span className="block truncate text-sm font-extrabold">{food.food_name}</span><span className="mt-1 block truncate text-xs text-[#6B7A5A]">{food.serving_description}</span>{food.note ? <span className="mt-1 block truncate text-[0.68rem] text-[#9A958B]">{food.note}</span> : null}</span>
                <span className="shrink-0 rounded-full bg-[#EAF7C7] px-3 py-1.5 text-xs font-extrabold text-[#557536]">{toPersianNumber(food.calories)} کالری</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[1.2rem] bg-[#FFFDF8] px-5 py-8 text-center"><p className="text-sm font-extrabold">هنوز غذایی ذخیره نکردی.</p><p className="mt-2 text-xs text-[#8A9A78]">می‌تونی از فرم ثبت روزانه یا دکمه بالا اولین غذات رو اضافه کنی.</p></div>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#25321F]/35 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="custom-food-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] border border-[#EFEAD9] bg-white p-5 shadow-[0_30px_80px_rgba(37,50,31,0.2)] sm:max-w-xl sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold text-[#86B93B]">فهرست شخصی</p><h2 id="custom-food-title" className="mt-1 text-xl font-extrabold">{food ? "ویرایش غذای ذخیره‌شده" : "ذخیره غذای جدید"}</h2></div><button type="button" onClick={onClose} disabled={isSaving} aria-label="بستن" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F5EF] text-lg text-[#6B7A5A]">×</button></div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-[#557536]">نام غذا<input autoFocus value={foodName} onChange={(event) => setFoodName(event.target.value)} maxLength={120} className="mt-2 w-full rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" /></label><label className="text-sm font-bold text-[#557536]">مقدار یا اندازه<input value={serving} onChange={(event) => setServing(event.target.value)} maxLength={120} className="mt-2 w-full rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" /></label></div>
          <label className="block text-sm font-bold text-[#557536]">کالری<input type="number" inputMode="numeric" min="0" max="10000" step="1" value={calories} onChange={(event) => setCalories(event.target.value)} dir="ltr" className="mt-2 w-full rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3 text-left outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" /><span className="mt-1 block text-[0.68rem] font-normal text-[#8A9A78]">این عدد رو خودت وارد می‌کنی و خودکار محاسبه نمی‌شه.</span></label>
          <label className="block text-sm font-bold text-[#557536]">یادداشت (اختیاری)<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} className="mt-2 w-full resize-none rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" /></label>
          {(validationError || error) ? <p role="alert" className="rounded-2xl border border-[#F5D5C9] bg-[#FFF6E8] p-3 text-sm text-[#7A3A27]">{validationError || error}</p> : null}
          {confirmDelete ? <div className="rounded-2xl bg-[#FFF6E8] p-4"><p className="text-sm font-bold">این غذا از ذخیره‌شده‌ها حذف بشه؟ ثبت‌های روزانه قبلی تغییر نمی‌کنن.</p><div className="mt-3 flex gap-2"><button type="button" disabled={isSaving} onClick={onDelete ?? undefined} className="rounded-full bg-[#F27C5B] px-5 py-2.5 text-xs font-extrabold text-white">حذف</button><button type="button" onClick={() => setConfirmDelete(false)} className="rounded-full bg-white px-5 py-2.5 text-xs font-bold">انصراف</button></div></div> : null}
          <div className="flex flex-wrap gap-2 border-t border-[#EFEAD9] pt-4"><button type="submit" disabled={isSaving} className="min-w-40 flex-1 rounded-full bg-[#D4F24E] px-6 py-3.5 text-sm font-extrabold disabled:opacity-60">{isSaving ? "در حال ذخیره..." : "ذخیره"}</button><button type="button" onClick={onClose} disabled={isSaving} className="rounded-full border border-[#E9E5DC] px-5 py-3.5 text-xs font-bold text-[#6B7A5A]">انصراف</button>{food && !confirmDelete ? <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-full border border-[#F5D5C9] bg-[#FFF6E8] px-5 py-3.5 text-xs font-extrabold text-[#7A3A27]">حذف</button> : null}</div>
        </form>
      </section>
    </div>
  );
}
