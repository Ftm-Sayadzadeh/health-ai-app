"use client";

import { FormEvent, ReactNode, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api-client";
import { getNutritionIntake, NutritionIntakeInput, saveNutritionIntake } from "@/lib/program-intakes";
import { ChoiceGrid, CompactChoices, FormActions, IntakePage, LoadingCard, Progress, toPersianDigits, useIntakeAccess } from "../_components/intake-ui";

type NutritionDraft = Omit<NutritionIntakeInput, "preferred_meal_count" | "meal_pattern" | "dietary_style" | "cooking_time_availability" | "cooking_frequency" | "budget_level" | "eating_out_frequency"> & {
  preferred_meal_count: number | null;
  meal_pattern: NutritionIntakeInput["meal_pattern"] | "";
  dietary_style: NutritionIntakeInput["dietary_style"] | "";
  cooking_time_availability: NutritionIntakeInput["cooking_time_availability"] | "";
  cooking_frequency: NutritionIntakeInput["cooking_frequency"] | "";
  budget_level: NutritionIntakeInput["budget_level"] | "";
  eating_out_frequency: NutritionIntakeInput["eating_out_frequency"] | "";
};

const initialValue: NutritionDraft = {
  preferred_meal_count: null,
  meal_pattern: "",
  dietary_style: "",
  cooking_time_availability: "",
  cooking_frequency: "",
  budget_level: "",
  eating_out_frequency: "",
  food_allergies: "",
  food_restrictions: "",
  disliked_foods: "",
  favorite_foods_or_cuisines: "",
  notes: "",
};

export default function NutritionIntakePage() {
  const router = useRouter();
  const [value, setValue] = useState<NutritionDraft>(initialValue);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setValue(await getNutritionIntake());
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) throw error;
    }
  }, []);
  const access = useIntakeAccess(load);

  function validateStep() {
    const valid = [
      value.preferred_meal_count !== null && Boolean(value.meal_pattern),
      Boolean(value.dietary_style),
      Boolean(value.cooking_time_availability) && Boolean(value.cooking_frequency),
      Boolean(value.budget_level) && Boolean(value.eating_out_frequency),
      true,
      true,
    ][step];
    if (!valid) setFormError("لطفا همه گزینه‌های این مرحله رو انتخاب کن.");
    return valid;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!validateStep()) return;
    if (step < 5) {
      setStep((current) => current + 1);
      return;
    }
    setSaving(true);
    try {
      await saveNutritionIntake(value as NutritionIntakeInput);
      router.replace("/plans/intake");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "ذخیره پرسشنامه ممکن نشد.");
      setSaving(false);
    }
  }

  if (access.isLoading) return <IntakePage><LoadingCard /></IntakePage>;

  return (
    <IntakePage>
      <form onSubmit={submit} className="rounded-[1.75rem] border border-[#EFEAD9] bg-white p-5 shadow-[0_24px_60px_rgba(85,117,54,0.08)] sm:rounded-[2rem] sm:p-9">
        <Progress step={step} total={6} />
        <p className="text-xs font-extrabold text-[#86B93B]">پرسشنامه تغذیه</p>

        {step === 0 ? <Step title="الگوی وعده‌های روزانه‌ات چطوره؟" help="تعداد ترجیحی وعده‌ها و نزدیک‌ترین الگوی معمول رو انتخاب کن."><Question label="تعداد وعده ترجیحی"><CompactChoices value={value.preferred_meal_count ?? 0} onChange={(preferred_meal_count) => setValue({...value, preferred_meal_count})} options={[2,3,4,5,6].map((number) => ({value:number,label:`${toPersianDigits(number)} وعده`}))} /></Question><Question label="الگوی غذا خوردن"><ChoiceGrid value={value.meal_pattern} onChange={(meal_pattern) => setValue({...value, meal_pattern})} options={[{value:"regular",label:"وعده‌های منظم"},{value:"irregular",label:"نامنظم"},{value:"skips_breakfast",label:"معمولا صبحانه نمی‌خورم"},{value:"night_eating",label:"بیشتر شب‌ها غذا می‌خورم"},{value:"other",label:"الگوی دیگری دارم"}]} /></Question></Step> : null}

        {step === 1 ? <Step title="سبک غذایی خاصی رو ترجیح می‌دی؟" help="این انتخاب فقط ترجیح کلی تو رو ثبت می‌کنه."><ChoiceGrid value={value.dietary_style} onChange={(dietary_style) => setValue({...value, dietary_style})} options={[{value:"none",label:"سبک خاصی ندارم"},{value:"vegetarian",label:"گیاه‌خواری"},{value:"vegan",label:"وگان"},{value:"low_carb",label:"کم‌کربوهیدرات"},{value:"high_protein",label:"تمایل به پروتئین بیشتر"},{value:"other",label:"سایر"}]} /></Step> : null}

        {step === 2 ? <Step title="چقدر فرصت آشپزی داری؟" help="شرایط معمول هفته رو در نظر بگیر، نه یک روز خاص."><Question label="زمان در دسترس"><ChoiceGrid value={value.cooking_time_availability} onChange={(cooking_time_availability) => setValue({...value,cooking_time_availability})} options={[{value:"very_low",label:"خیلی کم",detail:"غذاهای سریع و ساده"},{value:"moderate",label:"متوسط",detail:"زمان محدود ولی قابل برنامه‌ریزی"},{value:"enough",label:"زمان کافی",detail:"امکان آشپزی با حوصله بیشتر"}]} /></Question><Question label="دفعات آشپزی"><ChoiceGrid value={value.cooking_frequency} onChange={(cooking_frequency) => setValue({...value,cooking_frequency})} options={[{value:"rarely",label:"به‌ندرت"},{value:"few_times_weekly",label:"چند بار در هفته"},{value:"most_days",label:"بیشتر روزها"}]} /></Question></Step> : null}

        {step === 3 ? <Step title="بودجه و غذای بیرون" help="یک تصویر کلی از شرایط معمولت کافیه."><Question label="سطح بودجه"><ChoiceGrid value={value.budget_level} onChange={(budget_level) => setValue({...value,budget_level})} options={[{value:"economical",label:"اقتصادی"},{value:"moderate",label:"متوسط"},{value:"flexible",label:"منعطف"}]} /></Question><Question label="دفعات غذای بیرون"><ChoiceGrid value={value.eating_out_frequency} onChange={(eating_out_frequency) => setValue({...value,eating_out_frequency})} options={[{value:"rarely",label:"به‌ندرت"},{value:"weekly_1_2",label:"هفته‌ای ۱ تا ۲ بار"},{value:"weekly_3_5",label:"هفته‌ای ۳ تا ۵ بار"},{value:"most_days",label:"بیشتر روزها"}]} /></Question></Step> : null}

        {step === 4 ? <Step title="حساسیت یا محدودیتی هست؟" help="هر دو بخش اختیاری هستن و می‌تونی خالی بذاری."><div className="mt-6 grid gap-4 sm:grid-cols-2"><TextArea label="حساسیت‌های غذایی" value={value.food_allergies} onChange={(food_allergies) => setValue({...value,food_allergies})} maxLength={500} /><TextArea label="محدودیت‌های غذایی" value={value.food_restrictions} onChange={(food_restrictions) => setValue({...value,food_restrictions})} maxLength={500} /></div></Step> : null}

        {step === 5 ? <Step title="سلیقه غذایی‌ات رو بهتر بشناسیم" help="این موارد اختیاری‌اند و برای برنامه‌ریزی آینده ذخیره می‌شن."><div className="mt-6 grid gap-4 sm:grid-cols-2"><TextArea label="غذاهایی که دوست نداری" value={value.disliked_foods} onChange={(disliked_foods) => setValue({...value,disliked_foods})} maxLength={500} /><TextArea label="غذاها یا سبک‌های محبوب" value={value.favorite_foods_or_cuisines} onChange={(favorite_foods_or_cuisines) => setValue({...value,favorite_foods_or_cuisines})} maxLength={500} /></div><TextArea label="یادداشت تکمیلی" value={value.notes} onChange={(notes) => setValue({...value,notes})} maxLength={1000} compact /></Step> : null}

        {(formError || access.error) ? <p role="alert" className="mt-6 rounded-2xl border border-[#F5D5C9] bg-[#FFF6E8] p-4 text-sm leading-6 text-[#7A3A27]">{formError || access.error}</p> : null}
        <FormActions step={step} total={6} saving={saving} onBack={() => { setFormError(null); setStep((current) => current - 1); }} />
      </form>
    </IntakePage>
  );
}

function Step({ title, help, children }: { title: string; help: string; children: ReactNode }) {
  return <section><h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">{title}</h1><p className="mt-2 text-sm leading-7 text-[#6B7A5A]">{help}</p>{children}</section>;
}

function Question({ label, children }: { label: string; children: ReactNode }) {
  return <div className="mt-7 first:mt-6"><h2 className="text-sm font-extrabold text-[#3D4C34]">{label}</h2>{children}</div>;
}

function TextArea({ label, value, onChange, maxLength, compact = false }: { label: string; value: string; onChange: (value: string) => void; maxLength: number; compact?: boolean }) {
  return <label className="block text-sm font-bold text-[#557536]">{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} maxLength={maxLength} rows={compact ? 3 : 4} className="mt-2 w-full resize-none rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] p-4 text-[#25321F] outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" /><span className="mt-1 block text-left text-[0.68rem] text-[#8A9A78]" dir="ltr">{toPersianDigits(value.length)} / {toPersianDigits(maxLength)}</span></label>;
}
