"use client";

import { FormEvent, ReactNode, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api-client";
import { getWorkoutIntake, saveWorkoutIntake, WorkoutIntakeInput } from "@/lib/program-intakes";
import { ChoiceGrid, CompactChoices, FormActions, IntakePage, LoadingCard, Progress, toPersianDigits, useIntakeAccess } from "../_components/intake-ui";

type WorkoutDraft = Omit<WorkoutIntakeInput, "workout_location" | "available_days_per_week" | "preferred_session_duration" | "experience_level" | "equipment_access" | "preferred_workout_style" | "intensity_preference"> & {
  workout_location: WorkoutIntakeInput["workout_location"] | "";
  available_days_per_week: number | null;
  preferred_session_duration: WorkoutIntakeInput["preferred_session_duration"] | null;
  experience_level: WorkoutIntakeInput["experience_level"] | "";
  equipment_access: WorkoutIntakeInput["equipment_access"] | "";
  preferred_workout_style: WorkoutIntakeInput["preferred_workout_style"] | "";
  intensity_preference: WorkoutIntakeInput["intensity_preference"] | "";
};

const initialValue: WorkoutDraft = {
  workout_location: "",
  available_days_per_week: null,
  preferred_session_duration: null,
  experience_level: "",
  equipment_access: "",
  preferred_workout_style: "",
  intensity_preference: "",
  preferred_workout_time: "",
  injuries_or_limitations: "",
  disliked_exercises: "",
  notes: "",
};

export default function WorkoutIntakePage() {
  const router = useRouter();
  const [value, setValue] = useState<WorkoutDraft>(initialValue);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setValue(await getWorkoutIntake());
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) throw error;
    }
  }, []);
  const access = useIntakeAccess(load);

  function validateStep() {
    const valid = [
      Boolean(value.workout_location) && value.available_days_per_week !== null,
      value.preferred_session_duration !== null,
      Boolean(value.experience_level) && Boolean(value.intensity_preference),
      Boolean(value.equipment_access),
      Boolean(value.preferred_workout_style),
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
      await saveWorkoutIntake(value as WorkoutIntakeInput);
      router.replace("/plans/intake");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "ذخیره پرسشنامه ممکن نشد.");
      setSaving(false);
    }
  }

  if (access.isLoading) return <IntakePage><LoadingCard /></IntakePage>;

  return (
    <IntakePage>
      <form onSubmit={submit} className="card p-5 sm:p-8">
        <Progress step={step} total={6} />
        <p className="text-xs font-bold text-[var(--brand-green)]">پرسشنامه تمرین</p>

        {step === 0 ? <Step title="کجا و چند روز تمرین می‌کنی؟" help="شرایطی رو انتخاب کن که در بیشتر هفته‌ها واقع‌بینانه است."><Question label="محل تمرین"><ChoiceGrid value={value.workout_location} onChange={(workout_location) => setValue({...value,workout_location})} options={[{value:"home",label:"خانه"},{value:"gym",label:"باشگاه"},{value:"outdoor",label:"فضای باز"},{value:"mixed",label:"ترکیبی"}]} /></Question><Question label="روزهای در دسترس در هفته"><CompactChoices value={value.available_days_per_week ?? 0} onChange={(available_days_per_week) => setValue({...value,available_days_per_week})} options={[1,2,3,4,5,6,7].map((number) => ({value:number,label:`${toPersianDigits(number)} روز`}))} /></Question></Step> : null}

        {step === 1 ? <Step title="هر جلسه چقدر زمان می‌بره؟" help="مدت ترجیحی رو انتخاب کن؛ زمان روز اختیاریه."><Question label="مدت هر جلسه"><CompactChoices value={value.preferred_session_duration ?? 0} onChange={(preferred_session_duration) => setValue({...value,preferred_session_duration: preferred_session_duration as WorkoutIntakeInput["preferred_session_duration"]})} options={([20,30,45,60,90] as const).map((number) => ({value:number,label:`${toPersianDigits(number)} دقیقه`}))} /></Question><Question label="زمان ترجیحی تمرین (اختیاری)"><ChoiceGrid value={value.preferred_workout_time} onChange={(preferred_workout_time) => setValue({...value,preferred_workout_time})} options={[{value:"",label:"فرقی نداره"},{value:"morning",label:"صبح"},{value:"midday",label:"میانه روز"},{value:"evening",label:"عصر یا شب"},{value:"flexible",label:"منعطف"}]} /></Question></Step> : null}

        {step === 2 ? <Step title="تجربه و شدت دلخواهت" help="نزدیک‌ترین گزینه به وضعیت فعلی و حس مطلوبت رو انتخاب کن."><Question label="سطح تجربه"><ChoiceGrid value={value.experience_level} onChange={(experience_level) => setValue({...value,experience_level})} options={[{value:"beginner",label:"تازه‌کار"},{value:"intermediate",label:"متوسط"},{value:"advanced",label:"پیشرفته"}]} /></Question><Question label="شدت ترجیحی"><ChoiceGrid value={value.intensity_preference} onChange={(intensity_preference) => setValue({...value,intensity_preference})} options={[{value:"light",label:"سبک"},{value:"moderate",label:"متوسط"},{value:"challenging",label:"چالش‌برانگیز"}]} /></Question></Step> : null}

        {step === 3 ? <Step title="چه تجهیزاتی در دسترس داری؟" help="چیزی رو انتخاب کن که معمولا می‌تونی ازش استفاده کنی."><ChoiceGrid value={value.equipment_access} onChange={(equipment_access) => setValue({...value,equipment_access})} options={[{value:"none",label:"بدون تجهیزات"},{value:"basic",label:"تجهیزات ساده خانگی"},{value:"dumbbells_bands",label:"دمبل یا کش تمرینی"},{value:"full_gym",label:"باشگاه کامل"}]} /></Step> : null}

        {step === 4 ? <Step title="چه سبک تمرینی رو بیشتر دوست داری؟" help="اگر هنوز مطمئن نیستی، گزینه بدون ترجیح کاملا مناسبه."><ChoiceGrid value={value.preferred_workout_style} onChange={(preferred_workout_style) => setValue({...value,preferred_workout_style})} options={[{value:"strength",label:"قدرتی"},{value:"cardio",label:"هوازی"},{value:"mobility",label:"انعطاف و تحرک"},{value:"mixed",label:"ترکیبی"},{value:"no_preference",label:"ترجیح خاصی ندارم"}]} /></Step> : null}

        {step === 5 ? <Step title="نکته‌ای هست که بهتره بدونیم؟" help="این موارد اختیاری‌اند؛ فقط برای برنامه‌ریزی آینده ذخیره می‌شن."><div className="mt-6 grid gap-4 sm:grid-cols-2"><TextArea label="آسیب یا محدودیت حرکتی" value={value.injuries_or_limitations} onChange={(injuries_or_limitations) => setValue({...value,injuries_or_limitations})} maxLength={1000} /><TextArea label="حرکت‌هایی که دوست نداری" value={value.disliked_exercises} onChange={(disliked_exercises) => setValue({...value,disliked_exercises})} maxLength={500} /></div><TextArea label="یادداشت تکمیلی" value={value.notes} onChange={(notes) => setValue({...value,notes})} maxLength={1000} compact /><p className="notice notice-info mt-5">پاسخ‌ها فقط ذخیره می‌شن و در این مرحله هیچ توصیه یا برنامه تمرینی تولید نمی‌شه.</p></Step> : null}

        {(formError || access.error) ? <p role="alert" className="notice notice-error mt-6">{formError || access.error}</p> : null}
        <FormActions step={step} total={6} saving={saving} onBack={() => { setFormError(null); setStep((current) => current - 1); }} />
      </form>
    </IntakePage>
  );
}

function Step({ title, help, children }: { title: string; help: string; children: ReactNode }) {
  return <section><h1 className="mt-2 text-2xl font-bold leading-tight">{title}</h1><p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{help}</p>{children}</section>;
}

function Question({ label, children }: { label: string; children: ReactNode }) {
  return <div className="mt-7 first:mt-6"><h2 className="text-sm font-bold text-[var(--text-default)]">{label}</h2>{children}</div>;
}

function TextArea({ label, value, onChange, maxLength, compact = false }: { label: string; value: string; onChange: (value: string) => void; maxLength: number; compact?: boolean }) {
  return <label className="mt-5 block field-label first:mt-0">{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} maxLength={maxLength} rows={compact ? 3 : 4} className="field-input mt-2 resize-none" /><span className="mt-1 block text-left text-[0.68rem] text-[var(--text-subtle)]" dir="ltr">{toPersianDigits(value.length)} / {toPersianDigits(maxLength)}</span></label>;
}
