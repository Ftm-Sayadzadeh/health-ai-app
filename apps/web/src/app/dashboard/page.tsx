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
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
        <p className="rounded-md border border-slate-200 bg-white px-5 py-4 text-sm shadow-sm">
          در حال بررسی وضعیت ورود...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-emerald-700">
            بازگشت به صفحه اصلی
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            خروج
          </button>
        </div>

        <div className="mt-10 rounded-md border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">داشبورد</p>
          <h1 className="mt-3 text-3xl font-bold">داشبورد کاربر</h1>
          <p className="mt-5 max-w-3xl leading-8 text-slate-700">
            ورود شما با موفقیت تایید شده است. این صفحه فقط وضعیت احراز هویت را نشان می‌دهد و
            هنوز هیچ قابلیت محصولی دیگری پیاده‌سازی نشده است.
          </p>

          {user ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">شماره موبایل</p>
                <p className="mt-2 text-lg font-bold" dir="ltr">
                  {user.phone_number}
                </p>
              </div>
              <div className="rounded-md bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">نقش کاربر</p>
                <p className="mt-2 text-lg font-bold">{roleLabels[user.role]}</p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
