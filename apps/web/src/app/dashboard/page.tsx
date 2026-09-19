"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AuthUser,
  getCurrentUser,
  hasAccessToken,
  logout,
  needsHealthProfile,
} from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { getDailyFoodLog, getTehranTodayKey, toPersianNumber } from "@/lib/nutrition";
import { getProgramIntakeStatus, ProgramIntakeStatus } from "@/lib/program-intakes";

/* eslint-disable @next/next/no-img-element */

const roleLabels: Record<AuthUser["role"], string> = {
  normal: "کاربر عادی",
  coach: "مربی",
  admin: "مدیر",
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

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M5 19.5a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="9" r="3.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect
        x="7"
        y="2.5"
        width="10"
        height="19"
        rx="2.4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M11 18.5h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function RoleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M12 3l7 3.2v5c0 4.4-3 7.7-7 9.3-4-1.6-7-4.9-7-9.3v-5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusDotIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [intakeStatus, setIntakeStatus] = useState<ProgramIntakeStatus | null>(null);
  const [todayNutrition, setTodayNutrition] = useState<{
    calories: number;
    entryCount: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      if (!hasAccessToken()) {
        router.replace("/login");
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (needsHealthProfile(currentUser)) {
          router.replace("/onboarding");
          return;
        }
        if (isMounted) {
          setUser(currentUser);
          setIsCheckingAuth(false);
        }
        if (currentUser.role === "normal" && currentUser.has_health_profile) {
          try {
            const programStatus = await getProgramIntakeStatus();
            if (isMounted) setIntakeStatus(programStatus);
          } catch (statusError) {
            if (statusError instanceof ApiError && statusError.status === 401) {
              logout();
              router.replace("/login");
            }
          }
          try {
            const todayLog = await getDailyFoodLog(getTehranTodayKey());
            if (isMounted) {
              setTodayNutrition({
                calories: todayLog.total_calories,
                entryCount: todayLog.entry_count,
              });
            }
          } catch (nutritionError) {
            if (nutritionError instanceof ApiError && nutritionError.status === 401) {
              logout();
              router.replace("/login");
            }
          }
        }
      } catch {
        logout();
        if (isMounted) {
          setError("نشست ورود معتبر نیست. دوباره وارد شوید.");
          setIsCheckingAuth(false);
        }
        router.replace("/login");
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen px-4 py-4 text-[var(--text-strong)] sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
          <div className="card max-w-sm p-7 text-center">
            <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[var(--brand-avocado-soft)]" />
              <img
                src="/brand-assets/sprout-stage-4.png"
                alt=""
                className="animate-soft-pulse relative h-12 w-12 object-contain"
              />
            </div>
            <p role="status" aria-live="polite" className="text-sm font-bold">
              یه لحظه، داریم ورودت رو بررسی می‌کنیم...
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--brand-avocado-soft)]" dir="ltr">
              <div className="loading-sweep h-full w-1/2 rounded-full bg-[var(--brand-avocado)]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const accountRows = user
    ? [
        {
          icon: <PhoneIcon />,
          label: "شماره موبایل",
          value: user.phone_number,
          dir: "ltr" as const,
          tint: "bg-[#fbf0e0] text-[#8a5a32]",
        },
        {
          icon: <RoleIcon />,
          label: "نقش کاربر",
          value: roleLabels[user.role],
          dir: "rtl" as const,
          tint: "bg-[var(--brand-avocado-soft)] text-[var(--brand-green)]",
        },
        {
          icon: <StatusDotIcon />,
          label: "وضعیت نشست",
          value: "فعال",
          dir: "rtl" as const,
          tint: "bg-[var(--brand-avocado-soft)] text-[var(--brand-green)]",
        },
      ]
    : [];

  return (
    <main className="min-h-screen px-4 py-4 text-[var(--text-strong)] sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-5xl">
        <header dir="rtl" className="sticky top-4 z-30 mb-6">
          <div className="app-header">
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark />
              <span className="flex flex-col leading-none">
                <span className="text-[0.95rem] font-bold tracking-tight">
                  سلامت هوشمند
                </span>
                <span className="mt-1 text-[0.66rem] font-medium text-[var(--text-subtle)]">
                  حساب کاربری
                </span>
              </span>
            </Link>
            <button type="button" onClick={handleLogout} className="btn btn-secondary btn-sm">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path
                  d="M15 12H4M4 12l4-4M4 12l4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 5h7a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              خروج
            </button>
          </div>
        </header>

        {/* calm welcome line — no giant hero */}
        <section className="mb-5">
          <span className="chip chip-green">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-green)]" />
            ورود فعال
          </span>
          <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-[1.75rem]">
            سلام، خوش اومدی
          </h1>
          <p className="mt-2 max-w-xl text-[0.88rem] leading-7 text-[var(--text-muted)]">
            از همین‌جا می‌تونی غذای امروزت رو ثبت کنی و مسیر سلامتت رو مرتب نگه داری.
          </p>
        </section>

        {user?.role === "normal" && user.has_health_profile ? (
          <section className="card mb-5 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-avocado-soft)] text-base font-bold text-[var(--brand-green)]"
                  aria-hidden="true"
                >
                  غ
                </span>
                <div>
                  <h2 className="font-bold">ثبت غذای امروز</h2>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    غذای امروزت رو سریع ثبت کن؛ بر اساس کالری‌هایی که خودت وارد کردی.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:shrink-0">
                {todayNutrition ? (
                  <div className="grid min-w-32 grid-cols-2 gap-2">
                    <span className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-center">
                      <strong className="block text-base">{toPersianNumber(todayNutrition.calories)}</strong>
                      <span className="text-[0.62rem] text-[var(--text-subtle)]">کالری</span>
                    </span>
                    <span className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-center">
                      <strong className="block text-base">{toPersianNumber(todayNutrition.entryCount)}</strong>
                      <span className="text-[0.62rem] text-[var(--text-subtle)]">مورد ثبت</span>
                    </span>
                  </div>
                ) : null}
                <Link href="/nutrition" className="btn btn-primary">
                  افزودن غذا
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {/* main grid: account + program */}
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* account card */}
          <section className="card p-5 sm:p-6">
            <div className="mb-4 flex flex-col items-stretch gap-3 border-b border-[var(--border-soft)] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-avocado-soft)] text-[var(--brand-green)]">
                  <AccountIcon />
                </span>
                <div>
                  <h2 className="text-base font-bold leading-tight">
                    اطلاعات حساب
                  </h2>
                  <p className="mt-0.5 text-[0.72rem] font-medium text-[var(--text-subtle)]">
                    داده‌های واقعی حساب تو
                  </p>
                </div>
              </div>

              {user?.has_health_profile ? (
                <Link
                  href="/profile"
                  className="btn btn-ghost btn-sm shrink-0"
                >
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                    <path
                      d="M12.8 3.2l4 4-8.9 8.9-4.8.8.8-4.8 8.9-8.9Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  ویرایش پروفایل سلامت
                </Link>
              ) : null}
            </div>

            {user ? (
              <div className="flex flex-col gap-2.5">
                {accountRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3 transition hover:border-[var(--border-lime)]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-md ${row.tint}`}
                      >
                        {row.icon}
                      </span>
                      <span className="text-[0.8rem] font-bold text-[var(--text-muted)]">
                        {row.label}
                      </span>
                    </div>
                    <span
                      className="text-[0.92rem] font-bold text-[var(--text-strong)]"
                      dir={row.dir}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {error ? (
              <div role="alert" aria-live="polite" className="notice notice-error mt-4">
                {error}
              </div>
            ) : null}
          </section>

          {user?.role === "normal" && user.has_health_profile ? (
            <section className="card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="chip chip-neutral">اختیاری</span>
                  <h2 className="mt-3 text-base font-bold leading-tight sm:text-lg">ساخت برنامه شخصی</h2>
                </div>
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-avocado-soft)] text-base font-bold text-[var(--brand-green)]"
                  aria-hidden="true"
                >
                  پ
                </span>
              </div>
              <p className="mt-3 text-[0.8rem] leading-6 text-[var(--text-muted)]">
                پرسش‌های تکمیلی تغذیه و تمرین رو هر وقت خواستی جواب بده. فعلا هیچ برنامه‌ای تولید نمی‌شه.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <span className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-center text-[0.7rem] font-bold text-[var(--brand-green)]">
                  تغذیه: {intakeStatus ? (intakeStatus.nutrition.completed ? "تکمیل شده" : "نیاز به تکمیل") : "وضعیت نامشخص"}
                </span>
                <span className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-center text-[0.7rem] font-bold text-[#8a5a32]">
                  تمرین: {intakeStatus ? (intakeStatus.workout.completed ? "تکمیل شده" : "نیاز به تکمیل") : "وضعیت نامشخص"}
                </span>
              </div>
              <Link href="/plans/intake" className="btn btn-secondary mt-4 w-full">
                تکمیل پرسشنامه برنامه
              </Link>
            </section>
          ) : (
            <section className="card p-6 text-center">
              <h2 className="text-base font-bold">مسیر سلامت تو تازه شروع شده</h2>
              <p className="mt-2 text-[0.8rem] leading-6 text-[var(--text-muted)]">امکانات بیشتر به‌تدریج اضافه می‌شن.</p>
            </section>
          )}
        </div>

        <footer className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[var(--border-soft)] py-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="text-[0.78rem] font-bold text-[var(--brand-green)]">
              سلامت هوشمند
            </span>
          </div>
          <p className="text-[0.7rem] text-[var(--text-subtle)]">نسخه اولیه • در حال ساخت</p>
        </footer>
      </div>
    </main>
  );
}
