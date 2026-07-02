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
    <main className="min-h-screen px-4 py-4 text-[#25321F] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="sticky top-4 z-30 mb-4 rounded-full border border-[#EFEAD9]/80 bg-white/90 px-4 py-2.5 shadow-[0_14px_34px_rgba(85,117,54,0.1)] backdrop-blur-md sm:px-6 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[0.85rem] bg-[#D4F24E]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand-assets/avocado-smiling.png" alt="" className="h-20 w-20 max-w-none translate-y-1 object-contain" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-extrabold">برنامه‌های من</span>
                <span className="block truncate text-[0.66rem] text-[#8A9A78]">یادداشت‌های تغذیه و تمرین</span>
              </span>
            </Link>
            <Link href="/dashboard" className="shrink-0 rounded-full border border-[#E9E5DC] bg-white px-4 py-2 text-xs font-extrabold text-[#557536] hover:bg-[#F4FBE3]">
              داشبورد
            </Link>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

export function PlansLoading() {
  return (
    <div className="rounded-[2rem] border border-[#EFEAD9] bg-white p-10 text-center shadow-[0_20px_50px_rgba(85,117,54,0.08)]">
      <p role="status" className="text-sm font-extrabold text-[#557536]">یه لحظه، برنامه‌ها رو آماده می‌کنیم...</p>
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
