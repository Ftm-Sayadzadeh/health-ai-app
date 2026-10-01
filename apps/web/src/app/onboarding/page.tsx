"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { ApiError } from "@/lib/api-client";
import {
  getCurrentUser,
  hasAccessToken,
  logout,
  needsHealthProfile,
} from "@/lib/auth";
import {
  ActivityLevel,
  HealthGoal,
  saveHealthProfile,
} from "@/lib/health-profile";
import {
  activityOptions,
  dateYearsAgo,
  emptyProfileDraft,
  formatHealthProfileApiError,
  formatPersianDate,
  goalOptions,
  ProfileDraft,
  validateHealthProfile,
} from "@/lib/health-profile-form";

/* eslint-disable @next/next/no-img-element */

const totalSteps = 6;

const fieldSteps: Record<string, number> = {
  display_name: 0,
  birth_date: 1,
  height_cm: 2,
  weight_kg: 2,
  goal: 3,
  activity_level: 4,
  food_preferences: 5,
  food_restrictions: 5,
};

function BrandMark() {
  return (
    <span className="app-logo h-9 w-9 shrink-0">
      <img
        src="/brand-assets/avocado-smiling.png"
        alt=""
        aria-hidden="true"
        className="h-16 w-16 max-w-none translate-y-0.5 object-contain"
      />
    </span>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileDraft>(emptyProfileDraft);
  const [step, setStep] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      if (!hasAccessToken()) {
        router.replace("/login");
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (!needsHealthProfile(currentUser)) {
          router.replace("/dashboard");
          return;
        }
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      } catch {
        logout();
        router.replace("/login");
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [router]);

  function updateField<Key extends keyof ProfileDraft>(field: Key, value: ProfileDraft[Key]) {
    setProfile((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function validateStep(currentStep: number) {
    const errors = validateHealthProfile(profile);
    const fieldsByStep: Array<Array<keyof ProfileDraft>> = [
      ["display_name"],
      ["birth_date"],
      ["height_cm", "weight_kg"],
      ["goal"],
      ["activity_level"],
      ["food_preferences", "food_restrictions"],
    ];
    const firstInvalidField = fieldsByStep[currentStep].find((field) => errors[field]);
    return firstInvalidField ? errors[firstInvalidField] ?? null : null;
  }

  function continueToNextStep() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, totalSteps - 1));
  }

  function goBack() {
    setError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < totalSteps - 1) {
      continueToNextStep();
      return;
    }

    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await saveHealthProfile({
        ...profile,
        goal: profile.goal as HealthGoal,
        activity_level: profile.activity_level as ActivityLevel,
      });
      const currentUser = await getCurrentUser();
      if (!currentUser.has_health_profile) {
        throw new Error("ذخیره اطلاعات تایید نشد. دوباره تلاش کن.");
      }
      router.replace("/dashboard");
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      if (caughtError instanceof ApiError) {
        const backendError = formatHealthProfileApiError(caughtError);
        if (backendError.field && backendError.field in fieldSteps) {
          setStep(fieldSteps[backendError.field]);
        }
        setError(backendError.message);
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "ذخیره اطلاعات ناموفق بود. دوباره تلاش کن.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen px-4 py-4 text-[var(--text-strong)] sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
          <div className="card max-w-sm p-7 text-center">
            <p role="status" aria-live="polite" className="text-sm font-bold">
              یه لحظه، داریم حسابت رو بررسی می‌کنیم...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-4 text-[var(--text-strong)] sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-4xl">
        <header dir="rtl" className="sticky top-4 z-30 mb-6">
          <div className="app-header">
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark />
              <span className="flex flex-col leading-none">
                <span className="text-[0.95rem] font-bold tracking-tight">سلامت هوشمند</span>
                <span className="mt-1 text-[0.66rem] font-medium text-[var(--text-subtle)]">
                  تکمیل اطلاعات پایه
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="btn btn-secondary btn-sm"
            >
              خروج
            </button>
          </div>
        </header>

        <section className="card mx-auto w-full max-w-[36rem] p-5 sm:p-8">
          <div className="mb-7">
            <div className="flex items-center justify-between text-[0.72rem] font-bold text-[var(--text-muted)]">
              <span>مرحله {step + 1} از {totalSteps}</span>
              <span>اطلاعات پایه پروفایل</span>
            </div>
            <div
              className="mt-3 flex gap-2"
              role="progressbar"
              aria-label="پیشرفت تکمیل پروفایل"
              aria-valuemin={1}
              aria-valuemax={totalSteps}
              aria-valuenow={step + 1}
            >
              {Array.from({ length: totalSteps }, (_, index) => (
                <span
                  key={index}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${index <= step ? "bg-[var(--brand-avocado)]" : "bg-[var(--surface-muted)]"}`}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="min-h-[20rem] pb-8 sm:pb-10">
              {step === 0 ? (
                <div>
                  <p className="text-[0.72rem] font-bold text-[var(--brand-green)]">خوش اومدی</p>
                  <h1 className="mt-2 text-2xl font-bold leading-tight">
                    دوست داری چی صدات کنیم؟
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                    نام یا اسم دلخواهت کافیه؛ بعدا هم می‌تونی تغییرش بدی.
                  </p>
                  <label className="mt-8 block">
                    <span className="field-label">نام دلخواه</span>
                    <input
                      autoFocus
                      value={profile.display_name}
                      onChange={(event) => updateField("display_name", event.target.value)}
                      maxLength={80}
                      placeholder="مثلا سارا"
                      className="field-input mt-2"
                    />
                  </label>
                </div>
              ) : null}

              {step === 1 ? (
                <div>
                  <p className="text-[0.72rem] font-bold text-[var(--brand-green)]">درباره تو</p>
                  <h1 className="mt-2 text-2xl font-bold leading-tight">
                    تاریخ تولدت چه روزیه؟
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                    این نسخه برای کاربران ۱۸ سال به بالا طراحی شده.
                  </p>
                  <label className="mt-8 block">
                    <span className="field-label">تاریخ تولد</span>
                    <input
                      autoFocus
                      type="date"
                      value={profile.birth_date}
                      min={dateYearsAgo(120)}
                      max={dateYearsAgo(18)}
                      onChange={(event) => updateField("birth_date", event.target.value)}
                      dir="ltr"
                      lang="fa-IR"
                      aria-describedby="birth-date-help"
                      className="field-input mt-2"
                    />
                    <span id="birth-date-help" className="mt-2 block text-xs leading-6 text-[var(--text-subtle)]">
                      {profile.birth_date
                        ? `تاریخ انتخاب‌شده: ${formatPersianDate(profile.birth_date)}`
                        : "تاریخ را از تقویم انتخاب کن؛ حداقل سن ۱۸ سال است."}
                    </span>
                  </label>
                </div>
              ) : null}

              {step === 2 ? (
                <div>
                  <p className="text-[0.72rem] font-bold text-[var(--brand-green)]">اندازه‌های پایه</p>
                  <h1 className="mt-2 text-2xl font-bold leading-tight">
                    قد و وزن فعلیت چقدره؟
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                    فقط مقدار فعلی رو وارد کن؛ اینجا هیچ محاسبه‌ای انجام نمی‌دیم.
                  </p>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="field-label">قد (سانتی‌متر)</span>
                      <input
                        autoFocus
                        type="number"
                        inputMode="decimal"
                        min="50"
                        max="250"
                        step="0.01"
                        value={profile.height_cm}
                        onChange={(event) => updateField("height_cm", event.target.value)}
                        placeholder="170"
                        dir="ltr"
                        className="field-input mt-2 text-left"
                      />
                    </label>
                    <label className="block">
                      <span className="field-label">وزن (کیلوگرم)</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="20"
                        max="500"
                        step="0.01"
                        value={profile.weight_kg}
                        onChange={(event) => updateField("weight_kg", event.target.value)}
                        placeholder="65"
                        dir="ltr"
                        className="field-input mt-2 text-left"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div>
                  <p className="text-[0.72rem] font-bold text-[var(--brand-green)]">هدف فعلی</p>
                  <h1 className="mt-2 text-2xl font-bold leading-tight">
                    الان کدوم هدف برات مهم‌تره؟
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                    فقط یک جهت کلی انتخاب کن؛ برنامه‌ریزی دقیق برای بعد می‌مونه.
                  </p>
                  <div className="mt-7 grid gap-3 sm:grid-cols-2 sm:gap-4">
                    {goalOptions.map((option, index) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={profile.goal === option.value}
                        onClick={() => updateField("goal", option.value)}
                        className={`rounded-xl border p-4 text-right transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)] sm:min-h-[5.25rem] ${index === goalOptions.length - 1 ? "sm:col-span-2 sm:mx-auto sm:w-[calc(50%-0.5rem)]" : ""} ${profile.goal === option.value ? "border-[var(--brand-avocado)] bg-[var(--brand-avocado-soft)]" : "border-[var(--border-input)] bg-[var(--surface-input)] hover:border-[var(--border-lime)]"}`}
                      >
                        <span className="block text-sm font-bold">{option.label}</span>
                        <span className="mt-1 block text-[0.72rem] text-[var(--text-muted)]">{option.detail}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div>
                  <p className="text-[0.72rem] font-bold text-[var(--brand-green)]">روزهای معمول تو</p>
                  <h1 className="mt-2 text-2xl font-bold leading-tight">
                    معمولا چقدر فعالیت داری؟
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                    نزدیک‌ترین گزینه به بیشتر روزهای هفته رو انتخاب کن.
                  </p>
                  <div className="mt-6 space-y-3">
                    {activityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={profile.activity_level === option.value}
                        onClick={() => updateField("activity_level", option.value)}
                        className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-right transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)] ${profile.activity_level === option.value ? "border-[var(--brand-avocado)] bg-[var(--brand-avocado-soft)]" : "border-[var(--border-input)] bg-[var(--surface-input)] hover:border-[var(--border-lime)]"}`}
                      >
                        <span>
                          <span className="block text-sm font-bold">{option.label}</span>
                          <span className="mt-1 block text-[0.72rem] text-[var(--text-muted)]">{option.detail}</span>
                        </span>
                        <span
                          className={`h-4 w-4 shrink-0 rounded-full border-2 ${profile.activity_level === option.value ? "border-[var(--brand-avocado)] bg-[var(--brand-avocado)]" : "border-[#cfc9bd]"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === 5 ? (
                <div>
                  <p className="text-[0.72rem] font-bold text-[var(--brand-green)]">اختیاری</p>
                  <h1 className="mt-2 text-2xl font-bold leading-tight">
                    نکته غذایی مهمی هست؟
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                    اگر ترجیح یا محدودیتی داری بنویس؛ می‌تونی هر دو کادر رو خالی بذاری.
                  </p>
                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="field-label">ترجیحات غذایی</span>
                      <textarea
                        autoFocus
                        value={profile.food_preferences}
                        onChange={(event) => updateField("food_preferences", event.target.value)}
                        maxLength={500}
                        rows={4}
                        placeholder="مثلا غذاهای گیاهی"
                        className="field-input mt-2 resize-none"
                      />
                    </label>
                    <label className="block">
                      <span className="field-label">محدودیت‌های غذایی</span>
                      <textarea
                        value={profile.food_restrictions}
                        onChange={(event) => updateField("food_restrictions", event.target.value)}
                        maxLength={500}
                        rows={4}
                        placeholder="مثلا حساسیت یا پرهیز غذایی"
                        className="field-input mt-2 resize-none"
                      />
                    </label>
                  </div>
                  <p className="notice notice-info mt-5">
                    جزئیات بیشتر فقط وقتی از ما برنامه تغذیه یا ورزش بخوای، در یک مسیر جدا پرسیده می‌شه.
                  </p>
                </div>
              ) : null}
            </div>

            {error ? (
              <div role="alert" aria-live="polite" className="notice notice-error mb-5">
                {error}
              </div>
            ) : null}

            <div className="flex items-center gap-3 border-t border-[var(--border-soft)] pt-6 sm:pt-7">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={isSaving}
                  className="btn btn-secondary"
                >
                  قبلی
                </button>
              ) : null}
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary flex-1 py-3.5"
              >
                {isSaving
                  ? "در حال ذخیره..."
                  : step === totalSteps - 1
                    ? "ذخیره و ورود به داشبورد"
                    : "ادامه"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
