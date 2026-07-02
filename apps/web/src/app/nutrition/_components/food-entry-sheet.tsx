"use client";

import { FormEvent, useEffect, useState } from "react";

import { FoodLogEntry, FoodLogEntryInput, MealType, toPersianNumber } from "@/lib/nutrition";

const mealOptions: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "صبحانه" },
  { value: "lunch", label: "ناهار" },
  { value: "dinner", label: "شام" },
  { value: "snack", label: "میان‌وعده" },
  { value: "other", label: "سایر" },
];

export function FoodEntrySheet({
  entry,
  defaultMeal,
  isSaving,
  error,
  onClose,
  onSave,
  onDelete,
}: {
  entry: FoodLogEntry | null;
  defaultMeal: MealType;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: FoodLogEntryInput) => Promise<void>;
  onDelete: (() => Promise<void>) | null;
}) {
  const [mealType, setMealType] = useState<MealType>(entry?.meal_type ?? defaultMeal);
  const [foodName, setFoodName] = useState(entry?.food_name ?? "");
  const [serving, setServing] = useState(entry?.serving_description ?? "");
  const [calories, setCalories] = useState(entry ? String(entry.calories) : "");
  const [note, setNote] = useState(entry?.note ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isSaving, onClose]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setValidationError(null);
    const calorieValue = Number(calories);
    if (!foodName.trim()) return setValidationError("نام غذا رو وارد کن.");
    if (!serving.trim()) return setValidationError("مقدار یا اندازه وعده رو وارد کن.");
    if (!calories || !Number.isInteger(calorieValue) || calorieValue < 0 || calorieValue > 10000) {
      return setValidationError("کالری باید عددی بین ۰ تا ۱۰٬۰۰۰ باشه.");
    }
    await onSave({ meal_type: mealType, food_name: foodName, serving_description: serving, calories: calorieValue, note });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#25321F]/35 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="food-entry-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] border border-[#EFEAD9] bg-white p-5 shadow-[0_30px_80px_rgba(37,50,31,0.2)] sm:max-w-xl sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4 rounded-[1.3rem] bg-gradient-to-l from-[#EAF7C7] to-[#FFFDF8] p-4"><div><p className="text-xs font-extrabold text-[#86B93B]">{entry ? "ویرایش ثبت روزانه" : "ثبت سریع"}</p><h2 id="food-entry-title" className="mt-1 text-2xl font-extrabold">{entry ? "ویرایش غذا" : "افزودن غذا"}</h2><p className="mt-1 text-xs text-[#6B7A5A]">{entry ? entry.food_name : "نام، مقدار و کالری رو خودت وارد کن."}</p></div><button type="button" onClick={onClose} disabled={isSaving} aria-label="بستن" className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg text-[#6B7A5A] shadow-sm">×</button></div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <fieldset><legend className="text-sm font-extrabold text-[#557536]">برای کدوم وعده؟</legend><div className="mt-2 flex flex-wrap gap-2">{mealOptions.map((option) => <button key={option.value} type="button" aria-pressed={mealType === option.value} onClick={() => setMealType(option.value)} className={`rounded-full border px-4 py-2 text-xs font-extrabold transition ${mealType === option.value ? "border-[#D4F24E] bg-[#D4F24E] shadow-[0_6px_14px_rgba(212,242,78,0.24)]" : "border-[#E9E5DC] bg-[#FFFDF8] text-[#6B7A5A] hover:border-[#DCE9B0]"}`}>{option.label}</button>)}</div></fieldset>
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-[#557536]">نام غذا<input autoFocus value={foodName} onChange={(event) => setFoodName(event.target.value)} maxLength={120} className="mt-2 w-full rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" placeholder="مثلا نان و پنیر" /></label><label className="text-sm font-bold text-[#557536]">مقدار یا اندازه<input value={serving} onChange={(event) => setServing(event.target.value)} maxLength={120} className="mt-2 w-full rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" placeholder="مثلا یک بشقاب" /></label></div>
          <label className="block text-sm font-bold text-[#557536]">کالری<input type="number" inputMode="numeric" min="0" max="10000" step="1" value={calories} onChange={(event) => setCalories(event.target.value)} dir="ltr" className="mt-2 w-full rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3 text-left outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" placeholder="0" /><span className="mt-1 block text-[0.68rem] font-normal text-[#8A9A78]">کالری به‌صورت خودکار محاسبه نمی‌شه؛ عددی رو وارد کن که خودت داری.</span></label>
          <label className="block text-sm font-bold text-[#557536]">یادداشت (اختیاری)<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} className="mt-2 w-full resize-none rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" /><span className="mt-1 block text-left text-[0.68rem] font-normal text-[#8A9A78]" dir="ltr">{toPersianNumber(note.length)} / ۵۰۰</span></label>
          {(validationError || error) ? <p role="alert" className="rounded-2xl border border-[#F5D5C9] bg-[#FFF6E8] p-3 text-sm text-[#7A3A27]">{validationError || error}</p> : null}
          {confirmDelete ? <div className="rounded-2xl bg-[#FFF6E8] p-4"><p className="text-sm font-bold">این خوراکی از گزارش روز حذف بشه؟</p><div className="mt-3 flex gap-2"><button type="button" disabled={isSaving} onClick={onDelete ?? undefined} className="rounded-full bg-[#F27C5B] px-5 py-2.5 text-xs font-extrabold text-white">حذف</button><button type="button" onClick={() => setConfirmDelete(false)} className="rounded-full bg-white px-5 py-2.5 text-xs font-bold">انصراف</button></div></div> : null}
          <div className="flex flex-wrap items-center gap-2 border-t border-[#EFEAD9] pt-4"><button type="submit" disabled={isSaving} className="min-w-40 flex-1 rounded-full bg-[#D4F24E] px-6 py-3.5 text-sm font-extrabold shadow-[0_12px_24px_rgba(212,242,78,0.25)] disabled:opacity-60">{isSaving ? "در حال ذخیره..." : entry ? "ذخیره تغییرات" : "ثبت غذا"}</button><button type="button" onClick={onClose} disabled={isSaving} className="rounded-full border border-[#E9E5DC] bg-white px-5 py-3.5 text-xs font-bold text-[#6B7A5A]">انصراف</button>{entry && !confirmDelete ? <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-full border border-[#F5D5C9] bg-[#FFF6E8] px-5 py-3.5 text-xs font-extrabold text-[#7A3A27]">حذف</button> : null}</div>
        </form>
      </section>
    </div>
  );
}
