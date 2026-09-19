"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { getCurrentUser, hasAccessToken, logout, needsHealthProfile } from "@/lib/auth";

export function useIntakeAccess(onReady?: () => Promise<void>) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function check() {
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
        const status = typeof caught === "object" && caught && "status" in caught ? caught.status : 0;
        if (status === 401) {
          logout();
          router.replace("/login");
          return;
        }
        if (active) {
          setError("دریافت اطلاعات ممکن نشد. دوباره تلاش کن.");
          setIsLoading(false);
        }
      }
    }
    check();
    return () => {
      active = false;
    };
    // Callers provide a stable load callback for the initial access check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return { isLoading, error, setError };
}

export function IntakePage({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-5 text-[var(--text-strong)] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <header className="app-header mb-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold">
            <span className="app-logo h-8 w-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand-assets/avocado-smiling.png" alt="" className="h-12 w-12 max-w-none translate-y-0.5 object-contain" />
            </span>
            سلامت هوشمند
          </Link>
          <Link href="/dashboard" className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-strong)]">
            بازگشت به داشبورد
          </Link>
        </header>
        {children}
      </div>
    </main>
  );
}

export function LoadingCard() {
  return (
    <div className="card p-8 text-center">
      <p role="status" className="font-bold text-[var(--brand-green)]">یه لحظه، داریم پرسشنامه رو آماده می‌کنیم...</p>
    </div>
  );
}

export function Progress({ step, total }: { step: number; total: number }) {
  const percent = Math.round(((step + 1) / total) * 100);
  return (
    <div className="mb-7">
      <div className="mb-2 flex justify-between text-xs font-bold text-[var(--text-muted)]">
        <span>مرحله {toPersianDigits(step + 1)} از {toPersianDigits(total)}</span>
        <span>{toPersianDigits(percent)}٪</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--brand-avocado-soft)]" dir="ltr">
        <div className="h-full rounded-full bg-[var(--brand-avocado)] transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>
    </div>
  );
}

export function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

export function ChoiceGrid<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; detail?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-xl border p-4 text-right transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)] ${value === option.value ? "border-[var(--brand-avocado)] bg-[var(--brand-avocado-soft)]" : "border-[var(--border-input)] bg-[var(--surface-input)] hover:border-[var(--border-lime)]"}`}
        >
          <span className="block text-sm font-bold">{option.label}</span>
          {option.detail ? <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">{option.detail}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function CompactChoices<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-2.5">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`min-w-16 rounded-full border px-4 py-2.5 text-center text-sm font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)] ${value === option.value ? "border-[var(--brand-avocado)] bg-[var(--brand-avocado)] text-white" : "border-[var(--border-input)] bg-[var(--surface-input)] text-[var(--text-muted)] hover:border-[var(--border-lime)]"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function FormActions({
  step,
  total,
  saving,
  onBack,
}: {
  step: number;
  total: number;
  saving: boolean;
  onBack: () => void;
}) {
  return (
    <div className="mt-8 flex gap-3 border-t border-[var(--border-soft)] pt-6">
      {step > 0 ? (
        <button type="button" onClick={onBack} disabled={saving} className="btn btn-secondary">
          قبلی
        </button>
      ) : null}
      <button type="submit" disabled={saving} className="btn btn-primary flex-1 py-3.5">
        {saving ? "در حال ذخیره..." : step === total - 1 ? "ذخیره پرسشنامه" : "ادامه"}
      </button>
    </div>
  );
}
