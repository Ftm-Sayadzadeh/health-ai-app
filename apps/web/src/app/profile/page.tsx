"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { ApiError } from "@/lib/api-client";
import {
  AuthUser,
  getCurrentUser,
  hasAccessToken,
  logout,
  needsHealthProfile,
} from "@/lib/auth";
import {
  getHealthProfile,
  HealthProfile,
  HealthProfileInput,
  saveHealthProfile,
} from "@/lib/health-profile";
import {
  activityOptions,
  dateYearsAgo,
  formatHealthProfileApiError,
  goalOptions,
  ProfileValidationErrors,
  validateHealthProfile,
} from "@/lib/health-profile-form";

/* eslint-disable @next/next/no-img-element */

function toProfileInput(profile: HealthProfile): HealthProfileInput {
  return {
    display_name: profile.display_name,
    birth_date: profile.birth_date,
    height_cm: profile.height_cm,
    weight_kg: profile.weight_kg,
    goal: profile.goal,
    activity_level: profile.activity_level,
    food_preferences: profile.food_preferences,
    food_restrictions: profile.food_restrictions,
  };
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-[0.72rem] font-bold text-[#A64B35]">{message}</p> : null;
}

function SectionHeader({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.8rem] bg-[#EAF7C7] text-sm font-extrabold text-[#557536]">
        {number}
      </span>
      <div>
        <h2 className="text-lg font-extrabold leading-tight">{title}</h2>
        <p className="mt-1 text-[0.75rem] leading-6 text-[#8A9A78]">{description}</p>
      </div>
    </div>
  );
}

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

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<HealthProfileInput | null>(null);
  const [savedProfile, setSavedProfile] = useState<HealthProfileInput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ProfileValidationErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!hasAccessToken()) {
        logout();
        router.replace("/login");
        return;
      }

      let currentUser: AuthUser | null = null;
      try {
        currentUser = await getCurrentUser();
        if (needsHealthProfile(currentUser)) {
          router.replace("/onboarding");
          return;
        }
        if (!currentUser.has_health_profile) {
          router.replace("/dashboard");
          return;
        }

        const response = await getHealthProfile();
        const input = toProfileInput(response);
        if (isMounted) {
          setProfile(input);
          setSavedProfile(input);
          setIsLoading(false);
        }
      } catch (caughtError) {
        if (caughtError instanceof ApiError && caughtError.status === 401) {
          logout();
          router.replace("/login");
          return;
        }
        if (caughtError instanceof ApiError && caughtError.status === 404) {
          router.replace(currentUser?.role === "normal" ? "/onboarding" : "/dashboard");
          return;
        }
        if (isMounted) {
          setLoadError(
            caughtError instanceof Error
              ? caughtError.message
              : "دریافت اطلاعات پروفایل ناموفق بود. دوباره تلاش کن.",
          );
          setIsLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [router]);

  function updateField<Key extends keyof HealthProfileInput>(
    field: Key,
    value: HealthProfileInput[Key],
  ) {
    setProfile((current) => (current ? { ...current, [field]: value } : current));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSaveError(null);
    setSuccessMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || isSaving) {
      return;
    }

    const validationErrors = validateHealthProfile(profile);
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      setSaveError("لطفا موارد مشخص‌شده رو بررسی کن.");
      setSuccessMessage(null);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      const response = await saveHealthProfile(profile);
      const normalizedProfile = toProfileInput(response);
      setProfile(normalizedProfile);
      setSavedProfile(normalizedProfile);
      setFieldErrors({});
      setSuccessMessage("تغییرات پروفایل سلامت با موفقیت ذخیره شد.");
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      if (caughtError instanceof ApiError) {
        const backendError = formatHealthProfileApiError(caughtError);
        if (backendError.field) {
          setFieldErrors((current) => ({
            ...current,
            [backendError.field as keyof HealthProfileInput]: backendError.message,
          }));
        }
        setSaveError(backendError.message);
      } else {
        setSaveError(
          caughtError instanceof Error
            ? caughtError.message
            : "ذخیره تغییرات ناموفق بود. دوباره تلاش کن.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  const hasChanges = Boolean(
    profile && savedProfile && JSON.stringify(profile) !== JSON.stringify(savedProfile),
  );

  if (isLoading) {
    return (
      <main className="min-h-screen px-4 py-4 text-[#25321F] sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
          <div className="w-full max-w-[24rem] rounded-[2rem] border border-[#EFEAD9] bg-white p-8 text-center shadow-[0_24px_60px_rgba(85,117,54,0.1)]">
            <p role="status" aria-live="polite" className="text-sm font-extrabold">
              داریم اطلاعات پروفایلت رو آماده می‌کنیم...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (loadError || !profile) {
    return (
      <main className="min-h-screen px-4 py-4 text-[#25321F] sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
          <div className="w-full max-w-[28rem] rounded-[2rem] border border-[#F5D5C9] bg-white p-8 text-center shadow-[0_24px_60px_rgba(85,117,54,0.1)]">
            <h1 className="text-xl font-extrabold">پروفایل بارگذاری نشد</h1>
            <p role="alert" className="mt-3 text-sm leading-7 text-[#7A3A27]">
              {loadError ?? "اطلاعات پروفایل در دسترس نیست."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-full bg-[#D4F24E] px-5 py-3 text-sm font-extrabold"
              >
                تلاش دوباره
              </button>
              <Link
                href="/dashboard"
                className="rounded-full border border-[#E9E5DC] px-5 py-3 text-sm font-bold text-[#6B7A5A]"
              >
                بازگشت
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const goalLabel = goalOptions.find((option) => option.value === profile.goal)?.label;
  const activityLabel = activityOptions.find(
    (option) => option.value === profile.activity_level,
  )?.label;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-4 text-[#25321F] sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#EAF7C7]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#FFF6E8]/60 blur-3xl" />

      <div className="relative mx-auto max-w-5xl">
        <header dir="rtl" className="sticky top-4 z-30 mb-7">
          <div className="flex items-center justify-between gap-4 rounded-full border border-[#EFEAD9]/80 bg-white/85 px-4 py-2.5 shadow-[0_14px_34px_rgba(85,117,54,0.1)] backdrop-blur-md sm:px-6 sm:py-3">
            <Link href="/" className="flex items-center gap-3">
              <SmilingAvocado />
              <span className="flex flex-col leading-none">
                <span className="text-[1rem] font-extrabold tracking-tight">سلامت هوشمند</span>
                <span className="mt-1 text-[0.66rem] font-medium text-[#8A9A78]">
                  پروفایل سلامت
                </span>
              </span>
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-[#E9E5DC] bg-white px-4 py-2 text-[0.8rem] font-bold text-[#6B7A5A] focus:outline-none focus:ring-4 focus:ring-[#EAF7C7]"
            >
              بازگشت به داشبورد
            </Link>
          </div>
        </header>

        <section className="relative mb-6 overflow-hidden rounded-[1.75rem] border border-[#DCE9B0] bg-gradient-to-bl from-[#EAF7C7] via-[#F7FCEB] to-[#FFF6E8] p-5 shadow-[0_22px_52px_rgba(85,117,54,0.09)] sm:p-7">
          <img
            src="/brand-assets/avocado-half.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -left-4 -top-7 h-28 w-28 object-contain opacity-15 sm:h-36 sm:w-36"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[0.72rem] font-extrabold text-[#557536] ring-1 ring-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-[#86B93B]" />
              مرکز پروفایل سلامت
            </span>
            <div className="mt-3 max-w-2xl">
              <h1 className="text-2xl font-extrabold leading-tight sm:text-[2.2rem]">
                {profile.display_name}، این جزئیات پایه توئه
              </h1>
              <p className="mt-2.5 text-[0.82rem] leading-7 text-[#5F6F55] sm:text-sm">
                هر وقت شرایطت عوض شد می‌تونی این اطلاعات رو به‌روز کنی. اینجا فقط جزئیات ثبت می‌شن و هیچ محاسبه یا پیشنهاد سلامتی انجام نمی‌دیم.
              </p>
            </div>

            <div className="mt-5 rounded-[1.25rem] bg-white/55 p-2.5 ring-1 ring-white/70">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <span className="min-w-0 rounded-full bg-white px-3 py-2 text-center text-[0.72rem] font-bold leading-5 text-[#557536] shadow-sm">
                نام: {profile.display_name}
              </span>
              <span className="min-w-0 rounded-full bg-white px-3 py-2 text-center text-[0.72rem] font-bold leading-5 text-[#557536] shadow-sm">
                هدف: {goalLabel}
              </span>
              <span className="min-w-0 rounded-full bg-white px-3 py-2 text-center text-[0.72rem] font-bold leading-5 text-[#557536] shadow-sm">
                قد: <bdi>{profile.height_cm}</bdi> سانتی‌متر
              </span>
              <span className="min-w-0 rounded-full bg-white px-3 py-2 text-center text-[0.72rem] font-bold leading-5 text-[#557536] shadow-sm">
                وزن: <bdi>{profile.weight_kg}</bdi> کیلوگرم
              </span>
              <span className="col-span-2 min-w-0 rounded-full bg-white px-3 py-2 text-center text-[0.72rem] font-bold leading-5 text-[#557536] shadow-sm sm:col-span-1">
                فعالیت: {activityLabel}
              </span>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          <section className="rounded-[1.5rem] border border-[#EFEAD9] bg-white/95 p-4 shadow-[0_18px_45px_rgba(85,117,54,0.06)] sm:p-6">
            <SectionHeader
              number="۱"
              title="اطلاعات پایه"
              description="نامی که نمایش می‌دیم و تاریخ تولد تو"
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[0.8rem] font-bold text-[#557536]">نام دلخواه</span>
                <input
                  value={profile.display_name}
                  onChange={(event) => updateField("display_name", event.target.value)}
                  maxLength={80}
                  className="mt-2 w-full rounded-[1.1rem] border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3.5 outline-none focus:border-[#D4F24E] focus:bg-white focus:ring-4 focus:ring-[#EAF7C7]"
                />
                <FieldError message={fieldErrors.display_name} />
              </label>
              <label className="block">
                <span className="text-[0.8rem] font-bold text-[#557536]">تاریخ تولد</span>
                <input
                  type="date"
                  value={profile.birth_date}
                  min={dateYearsAgo(120)}
                  max={dateYearsAgo(18)}
                  onChange={(event) => updateField("birth_date", event.target.value)}
                  dir="ltr"
                  className="mt-2 w-full rounded-[1.1rem] border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3.5 outline-none focus:border-[#D4F24E] focus:bg-white focus:ring-4 focus:ring-[#EAF7C7]"
                />
                <FieldError message={fieldErrors.birth_date} />
              </label>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-[#EFEAD9] bg-white/95 p-4 shadow-[0_18px_45px_rgba(85,117,54,0.06)] sm:p-6">
            <SectionHeader
              number="۲"
              title="اندازه‌گیری فعلی"
              description="آخرین قد و وزنی که می‌خوای در پروفایل ثبت باشه"
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[0.8rem] font-bold text-[#557536]">قد (سانتی‌متر)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="50"
                  max="250"
                  step="0.01"
                  value={profile.height_cm}
                  onChange={(event) => updateField("height_cm", event.target.value)}
                  dir="ltr"
                  className="mt-2 w-full rounded-[1.1rem] border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3.5 text-left outline-none focus:border-[#D4F24E] focus:bg-white focus:ring-4 focus:ring-[#EAF7C7]"
                />
                <FieldError message={fieldErrors.height_cm} />
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
                  dir="ltr"
                  className="mt-2 w-full rounded-[1.1rem] border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3.5 text-left outline-none focus:border-[#D4F24E] focus:bg-white focus:ring-4 focus:ring-[#EAF7C7]"
                />
                <FieldError message={fieldErrors.weight_kg} />
              </label>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-[#EFEAD9] bg-white/95 p-4 shadow-[0_18px_45px_rgba(85,117,54,0.06)] sm:p-6 lg:col-span-2">
            <SectionHeader
              number="۳"
              title="هدف و فعالیت"
              description="جهت کلی و سطح فعالیت روزهای معمول تو"
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[0.8rem] font-bold text-[#557536]">هدف اصلی</span>
                <select
                  value={profile.goal}
                  onChange={(event) => updateField("goal", event.target.value as HealthProfileInput["goal"])}
                  className="mt-2 w-full rounded-[1.1rem] border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3.5 outline-none focus:border-[#D4F24E] focus:bg-white focus:ring-4 focus:ring-[#EAF7C7]"
                >
                  {goalOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <FieldError message={fieldErrors.goal} />
              </label>
              <label className="block">
                <span className="text-[0.8rem] font-bold text-[#557536]">میزان فعالیت</span>
                <select
                  value={profile.activity_level}
                  onChange={(event) => updateField("activity_level", event.target.value as HealthProfileInput["activity_level"])}
                  className="mt-2 w-full rounded-[1.1rem] border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3.5 outline-none focus:border-[#D4F24E] focus:bg-white focus:ring-4 focus:ring-[#EAF7C7]"
                >
                  {activityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <FieldError message={fieldErrors.activity_level} />
              </label>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-[#EFEAD9] bg-white/95 p-4 shadow-[0_18px_45px_rgba(85,117,54,0.06)] sm:p-6 lg:col-span-2">
            <SectionHeader
              number="۴"
              title="ترجیحات غذایی"
              description="این دو بخش اختیاری هستن و می‌تونن خالی بمونن"
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[0.8rem] font-bold text-[#557536]">ترجیحات غذایی</span>
                <textarea
                  value={profile.food_preferences}
                  onChange={(event) => updateField("food_preferences", event.target.value)}
                  maxLength={500}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-[1.1rem] border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#D4F24E] focus:bg-white focus:ring-4 focus:ring-[#EAF7C7]"
                />
                <FieldError message={fieldErrors.food_preferences} />
              </label>
              <label className="block">
                <span className="text-[0.8rem] font-bold text-[#557536]">محدودیت‌های غذایی</span>
                <textarea
                  value={profile.food_restrictions}
                  onChange={(event) => updateField("food_restrictions", event.target.value)}
                  maxLength={500}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-[1.1rem] border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#D4F24E] focus:bg-white focus:ring-4 focus:ring-[#EAF7C7]"
                />
                <FieldError message={fieldErrors.food_restrictions} />
              </label>
            </div>
          </section>
          </div>

          <div className={`sticky bottom-2 z-20 mb-6 mt-6 rounded-[1.5rem] border p-3.5 shadow-[0_24px_60px_rgba(85,117,54,0.14)] backdrop-blur-md sm:bottom-4 sm:p-5 ${hasChanges ? "border-[#D4F24E] bg-[#FCFEEB]/95" : "border-[#EFEAD9] bg-white/95"}`}>
            {saveError ? (
              <p role="alert" aria-live="polite" className="mb-4 rounded-[1rem] border border-[#F5D5C9] bg-[#FFF6E8] px-4 py-3 text-[0.8rem] leading-6 text-[#7A3A27]">
                {saveError}
              </p>
            ) : null}
            {successMessage ? (
              <p role="status" aria-live="polite" className="mb-4 rounded-[1rem] border border-[#DCE9B0] bg-[#EAF7C7] px-4 py-3 text-[0.8rem] font-bold text-[#557536]">
                {successMessage}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${hasChanges ? "bg-[#FFB24D]" : "bg-[#86B93B]"}`} />
                <div>
                  <p className="text-sm font-extrabold">
                    {hasChanges ? "تغییرات ذخیره‌نشده داری" : "همه تغییرات ذخیره شده"}
                  </p>
                  <p className="mt-0.5 hidden text-[0.7rem] text-[#8A9A78] sm:block">
                    {hasChanges ? "برای ثبت اطلاعات جدید، ذخیره تغییرات رو بزن." : "می‌تونی با خیال راحت به داشبورد برگردی."}
                  </p>
                </div>
              </div>
              <div className="flex w-full gap-2.5 sm:w-auto">
                <button
                  type="button"
                  disabled={!hasChanges || isSaving}
                  onClick={() => {
                    if (savedProfile) {
                      setProfile(savedProfile);
                      setFieldErrors({});
                      setSaveError(null);
                      setSuccessMessage(null);
                    }
                  }}
                  className="rounded-full border border-[#E9E5DC] bg-white px-3.5 py-2.5 text-[0.8rem] font-bold text-[#6B7A5A] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-3 sm:text-sm"
                >
                  لغو تغییرات
                </button>
                <button
                  type="submit"
                  disabled={!hasChanges || isSaving}
                  className="flex-1 rounded-full bg-[#D4F24E] px-4 py-2.5 text-[0.8rem] font-extrabold text-[#25321F] shadow-[0_14px_28px_rgba(212,242,78,0.32)] focus:outline-none focus:ring-4 focus:ring-[#EAF7C7] disabled:cursor-not-allowed disabled:bg-[#E9E5DC] disabled:text-[#8A9A78] disabled:shadow-none sm:flex-none sm:px-5 sm:py-3 sm:text-sm"
                >
                  {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
