"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { ApiError } from "@/lib/api-client";
import { getCurrentUser, hasAccessToken, logout, needsHealthProfile } from "@/lib/auth";

export function useNutritionAccess(onReady: () => Promise<void>) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function check() {
      setIsLoading(true);
      setError(null);
      if (!hasAccessToken()) {
        logout();
        router.replace("/login");
        return;
      }
      try {
        const user = await getCurrentUser();
        if (needsHealthProfile(user)) {
          router.replace("/onboarding");
          return;
        }
        if (user.role !== "normal") {
          router.replace("/dashboard");
          return;
        }
        await onReady();
        if (active) setIsLoading(false);
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 401) {
          logout();
          router.replace("/login");
          return;
        }
        if (active) {
          setError(caught instanceof Error ? caught.message : "دریافت گزارش روزانه ممکن نشد.");
          setIsLoading(false);
        }
      }
    }
    check();
    return () => {
      active = false;
    };
  }, [onReady, router]);

  return { isLoading, error, setError };
}

export function NutritionShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-4 text-[var(--text-strong)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="app-header mb-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
            <span className="app-logo h-9 w-9 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand-assets/avocado-smiling.png" alt="" className="h-16 w-16 max-w-none translate-y-0.5 object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[0.95rem] font-bold">ثبت غذای روزانه</span>
              <span className="block truncate text-[0.66rem] text-[var(--text-subtle)]">کالری‌های واردشده توسط تو</span>
            </span>
          </Link>
          <Link href="/dashboard" className="btn btn-secondary btn-sm shrink-0">داشبورد</Link>
        </header>
        {children}
      </div>
    </main>
  );
}

export function NutritionLoading() {
  return (
    <div className="card p-8 text-center">
      <p role="status" className="text-sm font-bold text-[var(--brand-green)]">یه لحظه، گزارش امروز رو آماده می‌کنیم...</p>
    </div>
  );
}
