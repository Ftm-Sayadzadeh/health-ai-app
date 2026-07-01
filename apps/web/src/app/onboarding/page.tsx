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

function SmilingAvocado() {
  return (
    <span className="relative flex h-11 w-11 items-center justify-center rounded-[0.85rem] bg-gradient-to-br from-[#D4F24E] to-[#CFE84E] shadow-[0_6px_16px_rgba(134,185,59,0.34)] ring-1 ring-white/40">
      <span className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[0.85rem]">
        <img
          src="/brand-assets/avocado-smiling.png"
          alt=""
          className="h-20 w-20 max-w-none translate-y-1 object-contain"
        />
      </span>
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
      <main className="min-h-screen px-4 py-4 text-[#25321F] sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
          <div className="w-full max-w-[24rem] rounded-[2rem] border border-[#EFEAD9] bg-white p-8 text-center shadow-[0_24px_60px_rgba(85,117,54,0.1)]">
            <p role="status" aria-live="polite" className="text-sm font-extrabold">
              یه لحظه، داریم حسابت رو بررسی می‌کنیم...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-4 text-[#25321F] sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#EAF7C7]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#FFF6E8]/60 blur-3xl" />

      <div className="relative mx-auto max-w-4xl">
        <header dir="rtl" className="sticky top-4 z-30 mb-6">
          <div className="flex items-center justify-between gap-4 rounded-full border border-[#EFEAD9]/80 bg-white/85 px-4 py-2.5 shadow-[0_14px_34px_rgba(85,117,54,0.1)] backdrop-blur-md sm:px-6 sm:py-3">
            <Link href="/" className="flex items-center gap-3">
              <SmilingAvocado />
              <span className="flex flex-col leading-none">
                <span className="text-[1rem] font-extrabold tracking-tight">سلامت هوشمند</span>
                <span className="mt-1 text-[0.66rem] font-medium text-[#8A9A78]">
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
              className="rounded-full border border-[#E9E5DC] bg-white px-4 py-2 text-[0.8rem] font-bold text-[#6B7A5A] focus:outline-none focus:ring-4 focus:ring-[#EAF7C7]"
            >
              خروج
            </button>
          </div>
        </header>

        <section className="mx-auto w-full max-w-[36rem] rounded-[2rem] border border-[#EFEAD9] bg-white/95 p-6 shadow-[0_30px_70px_rgba(85,117,54,0.12)] sm:p-9">
          <div className="mb-8">
            <div className="flex items-center justify-between text-[0.72rem] font-bold text-[#6B7A5A]">
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
                  className={`h-2 flex-1 rounded-full transition-colors ${index <= step ? "bg-[#D4F24E]" : "bg-[#EFEAD9]"}`}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="min-h-[22rem] pb-8 sm:pb-10">
              {step === 0 ? (
                <div>
                  <p className="text-[0.72rem] font-extrabold text-[#86B93B]">خوش اومدی</p>
                  <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">
                    دوست داری چی صدات کنیم؟
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-[#6B7A5A]">
                    نام یا اسم دلخواهت کافیه؛ بعدا هم می‌تونی تغییرش بدی.
                  </p>
                  <label className="mt-8 block">
                    <span className="text-[0.8rem] font-bold text-[#557536]">نام دلخواه</span>
                    <input
                      autoFocus
                      value={profile.display_name}
                      onChange={(event) => updateField("display_name", event.target.value)}
                      maxLength={80}
                      placeholder="مثلا سارا"
                      className="mt-2 w-full rounded-[1.1rem] border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3.5 outline-none focus:border-[#D4F24E] focus:bg-white focus:ring-4 focus:ring-[#EAF7C7]"
                    />
                  </label>
                </div>
              ) : null}

              {step === 1 ? (
                <div>
                  <p className="text-[0.72rem] font-extrabold text-[#86B93B]">درباره تو</p>
                  <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">
                    تاریخ تولدت چه روزیه؟
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-[#6B7A5A]">
                    این نسخه برای کاربران ۱۸ سال به بالا طراحی شده.
                  </p>
                  <label className="mt-8 block">
                    <span className="text-[0.8rem] font-bold text-[#557536]">تاریخ تولد</span>
                    <input
                      autoFocus
                      type="date"
                      value={profile.birth_date}
                      min={dateYearsAgo(120)}
                      max={dateYearsAgo(18)}
                      onChange={(event) => updateField("birth_date", event.target.value)}
                      dir="ltr"
                      className="mt-2 w-full rounded-[1.1rem] border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3.5 outline-none focus:border-[#D4F24E] focus:bg-white focus:ring-4 focus:ring-[#EAF7C7]"
                    />
                  </label>
                </div>
              ) : null}

              {step === 2 ? (
                <div>
                  <p className="text-[0.72rem] font-extrabold text-[#86B93B]">اندازه‌های پایه</p>
                  <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">
                    قد و وزن فعلیت چقدره؟
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-[#6B7A5A]">
                    فقط مقدار فعلی رو وارد کن؛ اینجا هیچ محاسبه‌ای انجام نمی‌دیم.
                  </p>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-[0.8rem] font-bold text-[#557536]">قد (سانتی‌متر)</span>
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
                        className="mt-2 w-full rounded-[1.1rem] border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3.5 text-left outline-none focus:border-[#D4F24E] focus:bg-white focus:ring-4 focus:ring-[#EAF7C7]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[0.8rem] font-bold text-[#557536]">وزن (کیلوگرم)</span>
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
                        className="mt-2 w-full rounded-[1.1rem] border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3.5 text-left outline-none focus:border-[#D4F24E] focus:bg-white focus:ring-4 focus:ring-[#EAF7C7]"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div>
                  <p className="text-[0.72rem] font-extrabold text-[#86B93B]">هدف فعلی</p>
                  <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">
                    الان کدوم هدف برات مهم‌تره؟
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-[#6B7A5A]">
                    فقط یک جهت کلی انتخاب کن؛ برنامه‌ریزی دقیق برای بعد می‌مونه.
                  </p>
                  <div className="mt-7 grid gap-3 sm:grid-cols-2 sm:gap-4">
                    {goalOptions.map((option, index) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={profile.goal === option.value}
                        onClick={() => updateField("goal", option.value)}
                        className={`rounded-[1.1rem] border p-4 text-right transition focus:outline-none focus:ring-4 focus:ring-[#EAF7C7] sm:min-h-[5.25rem] ${index === goalOptions.length - 1 ? "sm:col-span-2 sm:mx-auto sm:w-[calc(50%-0.5rem)]" : ""} ${profile.goal === option.value ? "border-[#D4F24E] bg-[#F4FBE3] shadow-[0_10px_24px_rgba(134,185,59,0.12)]" : "border-[#E9E5DC] bg-[#FFFDF8] hover:border-[#DCE9B0]"}`}
                      >
                        <span className="block text-sm font-extrabold">{option.label}</span>
                        <span className="mt-1 block text-[0.72rem] text-[#6B7A5A]">{option.detail}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div>
                  <p className="text-[0.72rem] font-extrabold text-[#86B93B]">روزهای معمول تو</p>
                  <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">
                    معمولا چقدر فعالیت داری؟
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-[#6B7A5A]">
                    نزدیک‌ترین گزینه به بیشتر روزهای هفته رو انتخاب کن.
                  </p>
                  <div className="mt-6 space-y-3">
                    {activityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={profile.activity_level === option.value}
                        onClick={() => updateField("activity_level", option.value)}
                        className={`flex w-full items-center justify-between gap-4 rounded-[1.1rem] border p-4 text-right transition focus:outline-none focus:ring-4 focus:ring-[#EAF7C7] ${profile.activity_level === option.value ? "border-[#D4F24E] bg-[#F4FBE3]" : "border-[#E9E5DC] bg-[#FFFDF8] hover:border-[#DCE9B0]"}`}
                      >
                        <span>
                          <span className="block text-sm font-extrabold">{option.label}</span>
                          <span className="mt-1 block text-[0.72rem] text-[#6B7A5A]">{option.detail}</span>
                        </span>
                        <span
                          className={`h-4 w-4 shrink-0 rounded-full border-2 ${profile.activity_level === option.value ? "border-[#86B93B] bg-[#D4F24E]" : "border-[#CFC9BD]"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === 5 ? (
                <div>
                  <p className="text-[0.72rem] font-extrabold text-[#86B93B]">اختیاری</p>
                  <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">
                    نکته غذایی مهمی هست؟
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-[#6B7A5A]">
                    اگر ترجیح یا محدودیتی داری بنویس؛ می‌تونی هر دو کادر رو خالی بذاری.
                  </p>
                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-[0.8rem] font-bold text-[#557536]">ترجیحات غذایی</span>
                      <textarea
                        autoFocus
                        value={profile.food_preferences}
                        onChange={(event) => updateField("food_preferences", event.target.value)}
                        maxLength={500}
                        rows={4}
                        placeholder="مثلا غذاهای گیاهی"
                        className="mt-2 w-full resize-none rounded-[1.1rem] border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#D4F24E] focus:bg-white focus:ring-4 focus:ring-[#EAF7C7]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[0.8rem] font-bold text-[#557536]">محدودیت‌های غذایی</span>
                      <textarea
                        value={profile.food_restrictions}
                        onChange={(event) => updateField("food_restrictions", event.target.value)}
                        maxLength={500}
                        rows={4}
                        placeholder="مثلا حساسیت یا پرهیز غذایی"
                        className="mt-2 w-full resize-none rounded-[1.1rem] border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#D4F24E] focus:bg-white focus:ring-4 focus:ring-[#EAF7C7]"
                      />
                    </label>
                  </div>
                  <p className="mt-5 rounded-[1rem] bg-[#EAF7C7]/60 px-4 py-3 text-[0.75rem] leading-6 text-[#557536]">
                    جزئیات بیشتر فقط وقتی از ما برنامه تغذیه یا ورزش بخوای، در یک مسیر جدا پرسیده می‌شه.
                  </p>
                </div>
              ) : null}
            </div>

            {error ? (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 rounded-[1rem] border border-[#F5D5C9] bg-[#FFF6E8] px-4 py-3 text-[0.8rem] leading-6 text-[#7A3A27]"
              >
                {error}
              </div>
            ) : null}

            <div className="flex items-center gap-3 border-t border-[#EFEAD9] pt-6 sm:pt-7">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={isSaving}
                  className="rounded-full border border-[#E9E5DC] bg-white px-6 py-3.5 text-sm font-bold text-[#6B7A5A] focus:outline-none focus:ring-4 focus:ring-[#EAF7C7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  قبلی
                </button>
              ) : null}
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 rounded-full bg-[#D4F24E] px-6 py-3.5 text-sm font-extrabold text-[#25321F] shadow-[0_16px_30px_rgba(212,242,78,0.35)] transition hover:bg-[#CFE84E] focus:outline-none focus:ring-4 focus:ring-[#EAF7C7] disabled:cursor-not-allowed disabled:bg-[#E9E5DC] disabled:text-[#8A9A78] disabled:shadow-none sm:text-base"
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
