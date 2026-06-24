"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthUser, getCurrentUser, hasAccessToken, logout } from "@/lib/auth";

const roleLabels: Record<AuthUser["role"], string> = {
  normal: "کاربر عادی",
  coach: "مربی",
  admin: "مدیر",
};

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
      <main className="flex min-h-screen items-center justify-center px-5 text-stone-950">
        <div className="rounded-3xl border border-white/80 bg-white/85 px-6 py-5 text-center shadow-xl shadow-emerald-950/10 backdrop-blur">
          <p className="text-sm font-bold text-emerald-800">در حال بررسی وضعیت ورود...</p>
          <div className="mt-4 h-2 w-48 overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full w-1/2 rounded-full bg-emerald-700" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-6 text-stone-950 sm:px-8">
      <section className="mx-auto max-w-6xl py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lg font-black text-emerald-950">داشبورد سلامت هوشمند</p>
            <p className="text-sm font-semibold text-slate-500">نمایش وضعیت ورود کاربر</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-emerald-100 bg-white/75 px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm transition hover:border-emerald-200"
            >
              صفحه اصلی
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-red-100 bg-white/75 px-4 py-2 text-sm font-bold text-red-700 shadow-sm transition hover:border-red-200 hover:bg-red-50"
            >
              خروج
            </button>
          </div>
        </div>

        <div className="mt-10 rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-2xl shadow-emerald-950/10 backdrop-blur sm:p-8">
          <p className="text-sm font-bold text-emerald-700">احراز هویت فعال</p>
          <h1 className="mt-3 text-3xl font-black leading-snug text-emerald-950">
            ورود شما با موفقیت تایید شده است
          </h1>
          <p className="mt-4 max-w-3xl leading-8 text-slate-600">
            این داشبورد در حال حاضر فقط اطلاعات احراز هویت را نمایش می‌دهد. پروفایل، برنامه
            غذایی، مربی‌گری و سایر قابلیت‌های محصول هنوز اضافه نشده‌اند.
          </p>

          {user ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5">
                <p className="text-sm font-bold text-emerald-800">شماره موبایل</p>
                <p className="mt-3 text-2xl font-black text-emerald-950" dir="ltr">
                  {user.phone_number}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-slate-50/90 p-5">
                <p className="text-sm font-bold text-slate-500">نقش کاربر</p>
                <p className="mt-3 text-2xl font-black text-slate-950">{roleLabels[user.role]}</p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
