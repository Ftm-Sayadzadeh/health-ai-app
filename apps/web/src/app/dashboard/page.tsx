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

/* eslint-disable @next/next/no-img-element */

const roleLabels: Record<AuthUser["role"], string> = {
  normal: "کاربر عادی",
  coach: "مربی",
  admin: "مدیر",
};

function SmilingAvocado({
  className,
  imgClassName,
}: {
  className?: string;
  imgClassName?: string;
}) {
  return (
    <span
      className={`relative flex items-center justify-center rounded-[0.85rem] bg-gradient-to-br from-[#D4F24E] to-[#CFE84E] shadow-[0_6px_16px_rgba(134,185,59,0.34)] ring-1 ring-white/40 ${className ?? ""}`}
    >
      <img
        src="/brand-assets/avocado-smiling.png"
        alt=""
        className={`object-contain ${imgClassName ?? "h-[1.6rem] w-[1.6rem]"}`}
      />
    </span>
  );
}

function SunAccent() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 text-[#FFB24D]"
      fill="none"
    >
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
      </g>
    </svg>
  );
}

function WaterDropAccent() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 text-[#86B93B]"
      fill="none"
    >
      <path
        d="M12 2.5c3.5 4.2 6 7.6 6 10.8a6 6 0 1 1-12 0c0-3.2 2.5-6.6 6-10.8Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M9.5 13.2a2.5 2.5 0 0 0 2.5 2.5"
        stroke="#FFFDF8"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
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
      <main className="min-h-screen px-4 py-4 text-[#25321F] sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
          <div className="w-full max-w-[24rem] rounded-[2rem] border border-[#EFEAD9] bg-white p-8 text-center shadow-[0_24px_60px_rgba(85,117,54,0.1)] ring-1 ring-black/[0.02]">
            <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#EAF7C7] to-[#FFF6E8]" />
              <img
                src="/brand-assets/sprout-stage-4.png"
                alt=""
                className="animate-soft-pulse relative h-16 w-16 object-contain drop-shadow-[0_8px_14px_rgba(85,117,54,0.18)]"
              />
            </div>
            <p role="status" aria-live="polite" className="text-sm font-extrabold">
              یه لحظه، داریم ورودت رو بررسی می‌کنیم...
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#EAF7C7]" dir="ltr">
              <div className="loading-sweep h-full w-1/2 rounded-full bg-[#D4F24E]" />
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
          tint: "bg-[#FFF6E8] text-[#7A3A27]",
        },
        {
          icon: <RoleIcon />,
          label: "نقش کاربر",
          value: roleLabels[user.role],
          dir: "rtl" as const,
          tint: "bg-[#EAF7C7] text-[#557536]",
        },
        {
          icon: <StatusDotIcon />,
          label: "وضعیت نشست",
          value: "فعال",
          dir: "rtl" as const,
          tint: "bg-[#EAF7C7] text-[#557536]",
        },
      ]
    : [];

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-4 text-[#25321F] sm:px-6 lg:px-8">
      {/* soft ambient background */}
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#EAF7C7]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#FFF6E8]/60 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        {/* floating pill header — matches landing page exactly */}
        <header dir="rtl" className="sticky top-4 z-30 mb-8">
          <div className="flex items-center justify-between gap-4 rounded-full border border-[#EFEAD9]/80 bg-white/85 px-4 py-2.5 shadow-[0_14px_34px_rgba(85,117,54,0.1)] backdrop-blur-md sm:px-6 sm:py-3">
            <Link href="/" className="flex items-center gap-3">
              <SmilingAvocado className="h-11 w-11" imgClassName="h-[2.6rem] w-[2.6rem]" />
              <span className="flex flex-col leading-none">
                <span className="text-[1rem] font-extrabold tracking-tight">
                  سلامت هوشمند
                </span>
                <span className="mt-1 text-[0.66rem] font-medium text-[#8A9A78]">
                  حساب کاربری
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#F5D5C9] bg-[#FFF6E8] px-5 py-2.5 text-[0.85rem] font-extrabold text-[#7A3A27] shadow-[0_10px_22px_rgba(122,58,39,0.08)] transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#FFF6E8]"
            >
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

        {/* welcome banner */}
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#EFEAD9] bg-gradient-to-bl from-[#EAF7C7] via-[#F4FBE3] to-[#FFF6E8] p-7 shadow-[0_24px_60px_rgba(85,117,54,0.1)] ring-1 ring-black/[0.02] sm:p-10">
            <div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
            <div className="absolute bottom-8 left-20 h-3 w-3 rounded-full bg-[#FF8A67]/70" />
            <img
              src="/brand-assets/avocado-half.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-2 -top-4 h-28 w-28 object-contain opacity-15 sm:h-36 sm:w-36"
            />
            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[0.72rem] font-extrabold text-[#557536] ring-1 ring-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-[#86B93B]" />
                ورود فعال
              </span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-[2.5rem]">
                حساب تو آماده‌ست
              </h1>
              <p className="mt-3 max-w-lg text-[0.9rem] leading-7 text-[#5F6F55] sm:text-base sm:leading-8">
                خوش اومدی. داشبورد فعلا وضعیت ورود و حساب تو رو نشون می‌ده؛ امکانات
                تغذیه و سلامت به‌زودی اضافه می‌شن.
              </p>
            </div>
          </div>
        </section>

        {/* main grid: account + coming-soon */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* account card */}
          <section className="rounded-[2rem] border border-[#EFEAD9] bg-white p-6 shadow-[0_24px_60px_rgba(85,117,54,0.08)] ring-1 ring-black/[0.02] sm:p-7">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[0.8rem] bg-[#EAF7C7] text-[#557536]">
                <AccountIcon />
              </span>
              <div>
                <h2 className="text-lg font-extrabold leading-tight">
                  اطلاعات حساب
                </h2>
                <p className="mt-0.5 text-[0.72rem] font-medium text-[#8A9A78]">
                  داده‌های واقعی حساب تو
                </p>
              </div>
            </div>

            {user ? (
              <div className="flex flex-col gap-3">
                {accountRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 rounded-[1.1rem] border border-[#EFEAD9] bg-[#FFFDF8] px-4 py-3.5 transition hover:border-[#DCE9B0]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-[0.7rem] ${row.tint}`}
                      >
                        {row.icon}
                      </span>
                      <span className="text-[0.8rem] font-bold text-[#6B7A5A]">
                        {row.label}
                      </span>
                    </div>
                    <span
                      className="text-[0.95rem] font-extrabold text-[#25321F]"
                      dir={row.dir}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {error ? (
              <div
                role="alert"
                aria-live="polite"
                className="mt-4 rounded-[1rem] border border-[#F5D5C9] bg-[#FFF6E8] px-4 py-3 text-[0.8rem] leading-6 text-[#7A3A27]"
              >
                {error}
              </div>
            ) : null}
          </section>

          {/* coming-soon card */}
          <section className="relative overflow-hidden rounded-[2rem] border border-[#EFEAD9] bg-white p-6 text-center shadow-[0_24px_60px_rgba(85,117,54,0.08)] ring-1 ring-black/[0.02] sm:p-7">
            <img
              src="/brand-assets/avocado-slice.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -left-3 -top-3 h-20 w-20 object-contain opacity-10"
            />
            <div className="relative mx-auto mb-5 flex w-full max-w-[15rem] justify-center">
              <div className="absolute top-3 h-24 w-full rounded-full bg-gradient-to-b from-[#EAF7C7] to-[#FFF6E8]" />
              <img
                src="/brand-assets/curved-growth-path-with-sprouts.png"
                alt="مسیر رشد با جوانه‌ها"
                className="relative h-24 w-full max-w-[13rem] object-contain drop-shadow-[0_10px_18px_rgba(85,117,54,0.12)]"
              />
            </div>

            <h2 className="text-lg font-extrabold leading-tight sm:text-xl">
              مسیر سلامت تو تازه شروع شده
            </h2>
            <p className="mx-auto mt-2 max-w-[20rem] text-[0.8rem] leading-6 text-[#6B7A5A]">
              ثبت غذا، مسیر رشد و همراهی هوشمند به‌زودی اضافه می‌شن. فعلا همین که
              وارد شدی، یه قدم سالمه.
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <span className="inline-flex items-center justify-center gap-2 rounded-full bg-[#EAF7C7] px-4 py-2 text-[0.72rem] font-bold text-[#557536]">
                <SunAccent />
                ثبت غذا — به‌زودی
              </span>
              <span className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FFF6E8] px-4 py-2 text-[0.72rem] font-bold text-[#7A3A27]">
                <WaterDropAccent />
                مسیر رشد — به‌زودی
              </span>
            </div>
          </section>
        </div>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-[#EFEAD9] py-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <SmilingAvocado className="h-6 w-6" imgClassName="h-[1rem] w-[1rem]" />
            <span className="text-[0.78rem] font-bold text-[#557536]">
              سلامت هوشمند
            </span>
          </div>
          <p className="text-[0.7rem] text-[#8A9A78]">نسخه اولیه • در حال ساخت</p>
        </footer>
      </div>
    </main>
  );
}
