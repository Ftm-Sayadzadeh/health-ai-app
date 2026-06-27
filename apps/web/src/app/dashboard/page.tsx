"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthUser, getCurrentUser, hasAccessToken, logout } from "@/lib/auth";

const roleLabels: Record<AuthUser["role"], string> = {
  normal: "کاربر عادی",
  coach: "مربی",
  admin: "مدیر",
};

function AvocadoBadge() {
  return (
    <div className="relative flex h-12 w-12 items-center justify-center rounded-[1.4rem] bg-[#CDEB58] shadow-[0_12px_28px_rgba(205,235,88,0.3)]">
      <span className="absolute h-8 w-5 rotate-[-16deg] rounded-[70%_70%_58%_58%] bg-[#79AD66]" />
      <span className="absolute mt-1 h-4 w-3 rotate-[-16deg] rounded-full bg-[#EEF8C7]" />
      <span className="absolute mt-3 h-2 w-2 rounded-full bg-[#F27C5B]" />
    </div>
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
        <div className="w-full max-w-sm rounded-[2.2rem] border border-[#E9E5DC] bg-white p-6 text-center shadow-[0_24px_62px_rgba(82,116,64,0.12)]">
          <div className="mx-auto mb-5 flex justify-center">
            <AvocadoBadge />
          </div>
          <p className="text-sm font-black">یه لحظه، داریم ورودت رو بررسی می‌کنیم...</p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#EEF8C7]">
            <div className="h-full w-1/2 rounded-full bg-[#CDEB58]" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-4 text-[#171717] sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl items-center py-4">
        <div className="w-full overflow-hidden rounded-[2.6rem] border border-[#E9E5DC] bg-white shadow-[0_26px_74px_rgba(82,116,64,0.12)]">
          <div className="relative overflow-hidden bg-[#EEF8C7] p-6 sm:p-7">
            <div className="absolute -left-8 top-8 h-24 w-24 rounded-full bg-[#FFF3E1]" />
            <div className="absolute bottom-8 left-16 h-5 w-5 rounded-full bg-[#F27C5B]/80" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <AvocadoBadge />
                <div>
                  <p className="text-sm font-black text-[#5E8D51]">ورود فعال</p>
                  <h1 className="mt-2 text-3xl font-black leading-tight">
                    حساب تو آماده‌ست
                  </h1>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-[#171717] px-5 py-2.5 text-sm font-black text-white shadow-[0_12px_26px_rgba(23,23,23,0.14)] transition hover:-translate-y-0.5 hover:bg-[#2A2A2A] focus:outline-none focus:ring-4 focus:ring-white/70"
              >
                خروج
              </button>
            </div>

            <p className="relative mt-5 max-w-xl leading-8 text-[#5F6F55]">
              داشبورد فعلا فقط وضعیت ورود و نقش حساب را نشان می‌دهد.
            </p>
          </div>

          {user ? (
            <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">
              <div className="rounded-[1.8rem] border border-[#E9E5DC] bg-[#FFFDF8] p-5">
                <p className="text-sm font-black text-[#77736B]">شماره موبایل</p>
                <p className="mt-3 text-xl font-black sm:text-2xl" dir="ltr">
                  {user.phone_number}
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-[#E9E5DC] bg-[#FFF3E1] p-5">
                <p className="text-sm font-black text-[#77736B]">نقش کاربر</p>
                <p className="mt-3 text-xl font-black sm:text-2xl">{roleLabels[user.role]}</p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mx-5 mb-5 rounded-[1.5rem] border border-[#F5D5C9] bg-[#FFF3E1] p-4 text-sm text-[#7A3A27] sm:mx-7 sm:mb-7">
              {error}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
