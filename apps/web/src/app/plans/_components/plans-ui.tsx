"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { ApiError } from "@/lib/api-client";
import { getCurrentUser, hasAccessToken, logout, needsHealthProfile } from "@/lib/auth";

export function usePlansAccess(onReady?: () => Promise<void>) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function checkAccess() {
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
        await onReady?.();
        if (active) setIsLoading(false);
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 401) {
          logout();
          router.replace("/login");
          return;
        }
        if (active) {
          setError(caught instanceof Error ? caught.message : "دریافت اطلاعات ممکن نشد.");
          setIsLoading(false);
        }
      }
    }
    checkAccess();
    return () => {
      active = false;
    };
    // The page supplies a stable initial loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return { isLoading, error, setError };
}

export function PlansPageShell({ children }: { children: ReactNode }) {
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
              <span className="block truncate text-[0.95rem] font-bold">برنامه‌های من</span>
              <span className="block truncate text-[0.66rem] text-[var(--text-subtle)]">یادداشت‌های تغذیه و تمرین</span>
            </span>
          </Link>
          <Link href="/dashboard" className="btn btn-secondary btn-sm shrink-0">
            داشبورد
          </Link>
        </header>
        {children}
      </div>
    </main>
  );
}

export function PlansLoading() {
  return (
    <div className="card p-8 text-center">
      <p role="status" className="text-sm font-bold text-[var(--brand-green)]">یه لحظه، برنامه‌ها رو آماده می‌کنیم...</p>
    </div>
  );
}

export function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

export function formatPlanDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024)).toLocaleString("fa-IR")} کیلوبایت`;
  }
  return `${(size / (1024 * 1024)).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} مگابایت`;
}

export function formatFileType(contentType?: string) {
  return contentType === "application/pdf" ? "PDF" : "تصویر";
}
