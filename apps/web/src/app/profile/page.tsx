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
  return message ? <p className="mt-2 text-[0.72rem] font-bold text-[var(--danger)]">{message}</p> : null;
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
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-avocado-soft)] text-sm font-bold text-[var(--brand-green)]">
        {number}
      </span>
      <div>
        <h2 className="text-base font-bold leading-tight">{title}</h2>
        <p className="mt-1 text-[0.75rem] leading-6 text-[var(--text-subtle)]">{description}</p>
      </div>
    </div>
  );
}

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
      <main className="min-h-screen px-4 py-4 text-[var(--text-strong)] sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
          <div className="card max-w-sm p-7 text-center">
            <p role="status" aria-live="polite" className="text-sm font-bold">
              داریم اطلاعات پروفایلت رو آماده می‌کنیم...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (loadError || !profile) {
    return (
      <main className="min-h-screen px-4 py-4 text-[var(--text-strong)] sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
          <div className="card max-w-md p-7 text-center" style={{ borderColor: "var(--danger-border)" }}>
            <h1 className="text-lg font-bold">پروفایل بارگذاری نشد</h1>
            <p role="alert" className="notice notice-error mt-3 inline-block text-center">
              {loadError ?? "اطلاعات پروفایل در دسترس نیست."}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">
                تلاش دوباره
              </button>
              <Link href="/dashboard" className="btn btn-secondary">
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
    <main className="min-h-screen px-4 py-4 text-[var(--text-strong)] sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-5xl">
        <header dir="rtl" className="sticky top-4 z-30 mb-6">
          <div className="app-header">
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark />
              <span className="flex flex-col leading-none">
                <span className="text-[0.95rem] font-bold tracking-tight">سلامت هوشمند</span>
                <span className="mt-1 text-[0.66rem] font-medium text-[var(--text-subtle)]">
                  پروفایل سلامت
                </span>
              </span>
            </Link>
            <Link href="/dashboard" className="btn btn-secondary btn-sm">
              بازگشت به داشبورد
            </Link>
          </div>
        </header>

        <section className="card-tint mb-5 p-5 sm:p-6">
          <span className="chip chip-green">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-green)]" />
            مرکز پروفایل سلامت
          </span>
          <div className="mt-3 max-w-2xl">
            <h1 className="text-2xl font-bold leading-tight sm:text-[1.75rem]">
              {profile.display_name}، این جزئیات پایه توئه
            </h1>
            <p className="mt-2 text-[0.82rem] leading-7 text-[var(--text-muted)] sm:text-sm">
              هر وقت شرایطت عوض شد می‌تونی این اطلاعات رو به‌روز کنی. اینجا فقط جزئیات ثبت می‌شن و هیچ محاسبه یا پیشنهاد سلامتی انجام نمی‌دیم.
            </p>
          </div>

          <div className="mt-4 rounded-lg bg-white/55 p-2 ring-1 ring-white/70">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <span className="min-w-0 rounded-lg bg-white px-3 py-2 text-center text-[0.72rem] font-bold leading-5 text-[var(--brand-green)]">
                نام: {profile.display_name}
              </span>
              <span className="min-w-0 rounded-lg bg-white px-3 py-2 text-center text-[0.72rem] font-bold leading-5 text-[var(--brand-green)]">
                هدف: {goalLabel}
              </span>
              <span className="min-w-0 rounded-lg bg-white px-3 py-2 text-center text-[0.72rem] font-bold leading-5 text-[var(--brand-green)]">
                قد: <bdi>{profile.height_cm}</bdi> سانتی‌متر
              </span>
              <span className="min-w-0 rounded-lg bg-white px-3 py-2 text-center text-[0.72rem] font-bold leading-5 text-[var(--brand-green)]">
                وزن: <bdi>{profile.weight_kg}</bdi> کیلوگرم
              </span>
              <span className="col-span-2 min-w-0 rounded-lg bg-white px-3 py-2 text-center text-[0.72rem] font-bold leading-5 text-[var(--brand-green)] sm:col-span-1">
                فعالیت: {activityLabel}
              </span>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          <section className="card p-4 sm:p-6">
            <SectionHeader
              number="۱"
              title="اطلاعات پایه"
              description="نامی که نمایش می‌دیم و تاریخ تولد تو"
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">نام دلخواه</span>
                <input
                  value={profile.display_name}
                  onChange={(event) => updateField("display_name", event.target.value)}
                  maxLength={80}
                  className="field-input mt-2"
                />
                <FieldError message={fieldErrors.display_name} />
              </label>
              <label className="block">
                <span className="field-label">تاریخ تولد</span>
                <input
                  type="date"
                  value={profile.birth_date}
                  min={dateYearsAgo(120)}
                  max={dateYearsAgo(18)}
                  onChange={(event) => updateField("birth_date", event.target.value)}
                  dir="ltr"
                  className="field-input mt-2"
                />
                <FieldError message={fieldErrors.birth_date} />
              </label>
            </div>
          </section>

          <section className="card p-4 sm:p-6">
            <SectionHeader
              number="۲"
              title="اندازه‌گیری فعلی"
              description="آخرین قد و وزنی که می‌خوای در پروفایل ثبت باشه"
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">قد (سانتی‌متر)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="50"
                  max="250"
                  step="0.01"
                  value={profile.height_cm}
                  onChange={(event) => updateField("height_cm", event.target.value)}
                  dir="ltr"
                  className="field-input mt-2 text-left"
                />
                <FieldError message={fieldErrors.height_cm} />
              </label>
              <label className="block">
                <span className="field-label">وزن (کیلوگرام)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="20"
                  max="500"
                  step="0.01"
                  value={profile.weight_kg}
                  onChange={(event) => updateField("weight_kg", event.target.value)}
                  dir="ltr"
                  className="field-input mt-2 text-left"
                />
                <FieldError message={fieldErrors.weight_kg} />
              </label>
            </div>
          </section>

          <section className="card p-4 sm:p-6 lg:col-span-2">
            <SectionHeader
              number="۳"
              title="هدف و فعالیت"
              description="جهت کلی و سطح فعالیت روزهای معمول تو"
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">هدف اصلی</span>
                <select
                  value={profile.goal}
                  onChange={(event) => updateField("goal", event.target.value as HealthProfileInput["goal"])}
                  className="field-input mt-2"
                >
                  {goalOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <FieldError message={fieldErrors.goal} />
              </label>
              <label className="block">
                <span className="field-label">میزان فعالیت</span>
                <select
                  value={profile.activity_level}
                  onChange={(event) => updateField("activity_level", event.target.value as HealthProfileInput["activity_level"])}
                  className="field-input mt-2"
                >
                  {activityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <FieldError message={fieldErrors.activity_level} />
              </label>
            </div>
          </section>

          <section className="card p-4 sm:p-6 lg:col-span-2">
            <SectionHeader
              number="۴"
              title="ترجیحات غذایی"
              description="این دو بخش اختیاری هستن و می‌تونن خالی بمونن"
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">ترجیحات غذایی</span>
                <textarea
                  value={profile.food_preferences}
                  onChange={(event) => updateField("food_preferences", event.target.value)}
                  maxLength={500}
                  rows={3}
                  className="field-input mt-2 resize-none"
                />
                <FieldError message={fieldErrors.food_preferences} />
              </label>
              <label className="block">
                <span className="field-label">محدودیت‌های غذایی</span>
                <textarea
                  value={profile.food_restrictions}
                  onChange={(event) => updateField("food_restrictions", event.target.value)}
                  maxLength={500}
                  rows={3}
                  className="field-input mt-2 resize-none"
                />
                <FieldError message={fieldErrors.food_restrictions} />
              </label>
            </div>
          </section>
          </div>

          <div className={`sticky bottom-2 z-20 mb-6 mt-6 rounded-xl border p-3.5 backdrop-blur-md sm:bottom-4 sm:p-4 ${hasChanges ? "border-[var(--brand-avocado)] bg-[var(--brand-avocado-softer)]" : "border-[var(--border-soft)] bg-white/95"}`}>
            {saveError ? (
              <p role="alert" aria-live="polite" className="notice notice-error mb-4">
                {saveError}
              </p>
            ) : null}
            {successMessage ? (
              <p role="status" aria-live="polite" className="notice notice-success mb-4">
                {successMessage}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${hasChanges ? "bg-[#c89a4e]" : "bg-[var(--brand-green)]"}`} />
                <div>
                  <p className="text-sm font-bold">
                    {hasChanges ? "تغییرات ذخیره‌نشده داری" : "همه تغییرات ذخیره شده"}
                  </p>
                  <p className="mt-0.5 hidden text-[0.7rem] text-[var(--text-subtle)] sm:block">
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
                  className="btn btn-secondary btn-sm sm:px-4 sm:py-3"
                >
                  لغو تغییرات
                </button>
                <button
                  type="submit"
                  disabled={!hasChanges || isSaving}
                  className="btn btn-primary flex-1 sm:flex-none"
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
