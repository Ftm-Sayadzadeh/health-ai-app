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
      <main className="flex min-h-screen items-center justify-center px-5 text-[#171717]">
        <div className="rounded-[2rem] border border-[#E9E5DC] bg-white px-7 py-6 text-center shadow-[0_24px_70px_rgba(23,23,23,0.07)]">
          <p className="text-sm font-black">یه لحظه، داریم ورودت رو بررسی می‌کنیم...</p>
          <div className="mt-4 h-3 w-48 overflow-hidden rounded-full bg-[#EEF8C7]">
            <div className="h-full w-1/2 rounded-full bg-[#CDEB58]" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-5 text-[#171717] sm:px-8">
      <section className="mx-auto max-w-5xl py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xl font-black">حساب تو آماده‌ست</p>
            <p className="mt-1 text-sm font-bold text-[#77736B]">
              داشبورد فعلا فقط وضعیت ورود رو نشون می‌ده.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-[#E9E5DC] bg-white/80 px-4 py-2 text-sm font-black text-[#77736B] transition hover:text-[#171717]"
            >
              خانه
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-[#171717] px-4 py-2 text-sm font-black text-white transition hover:bg-[#2a2a2a]"
            >
              خروج
            </button>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[2.4rem] border border-[#E9E5DC] bg-white shadow-[0_24px_70px_rgba(23,23,23,0.07)]">
          <div className="relative bg-[#EEF8C7] p-7 sm:p-9">
            <div className="absolute left-8 top-8 h-16 w-16 rounded-[1.4rem] bg-[#FFF3E1]" />
            <div className="absolute bottom-6 left-20 h-7 w-7 rounded-full bg-[#F27C5B]" />
            <p className="relative text-sm font-black text-[#8EBB7A]">ورود فعال</p>
            <h1 className="relative mt-3 max-w-xl text-4xl font-black leading-tight">
              خوشحالم دوباره اینجایی
            </h1>
            <p className="relative mt-4 max-w-2xl leading-8 text-[#77736B]">
              تغذیه، AI و مسیرهای سلامتی بعدا اضافه می‌شن. فعلا حساب کاربری و ورود OTP آماده
              است.
            </p>
          </div>

          {user ? (
            <div className="grid gap-4 p-5 sm:p-7 md:grid-cols-2">
              <div className="rounded-[2rem] border border-[#E9E5DC] bg-[#FFFDF8] p-5">
                <p className="text-sm font-black text-[#77736B]">شماره موبایل</p>
                <p className="mt-3 text-2xl font-black" dir="ltr">
                  {user.phone_number}
                </p>
              </div>
              <div className="rounded-[2rem] border border-[#E9E5DC] bg-[#FFF3E1] p-5">
                <p className="text-sm font-black text-[#77736B]">نقش کاربر</p>
                <p className="mt-3 text-2xl font-black">{roleLabels[user.role]}</p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mx-5 mb-5 rounded-[1.4rem] border border-[#F5D5C9] bg-[#FFF3E1] p-4 text-sm text-[#7A3A27] sm:mx-7 sm:mb-7">
              {error}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
