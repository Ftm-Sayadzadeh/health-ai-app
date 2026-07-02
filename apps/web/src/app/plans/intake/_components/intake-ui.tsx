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
    <main className="min-h-screen px-4 py-5 text-[#25321F] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between rounded-full border border-[#EFEAD9] bg-white/90 px-4 py-2.5 shadow-[0_12px_32px_rgba(85,117,54,0.08)] sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[#D4F24E]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand-assets/avocado-smiling.png" alt="" className="h-12 w-12 max-w-none object-contain" />
            </span>
            سلامت هوشمند
          </Link>
          <Link href="/dashboard" className="text-xs font-bold text-[#6B7A5A] hover:text-[#25321F]">
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
    <div className="rounded-[2rem] border border-[#EFEAD9] bg-white p-10 text-center shadow-[0_24px_60px_rgba(85,117,54,0.08)]">
      <p role="status" className="font-bold text-[#557536]">یه لحظه، داریم پرسشنامه رو آماده می‌کنیم...</p>
    </div>
  );
}

export function Progress({ step, total }: { step: number; total: number }) {
  const percent = Math.round(((step + 1) / total) * 100);
  return (
    <div className="mb-7">
      <div className="mb-2 flex justify-between text-xs font-bold text-[#6B7A5A]">
        <span>مرحله {toPersianDigits(step + 1)} از {toPersianDigits(total)}</span>
        <span>{toPersianDigits(percent)}٪</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#EAF7C7]" dir="ltr">
        <div className="h-full rounded-full bg-[#D4F24E] transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
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
          className={`rounded-[1.2rem] border p-4 text-right transition focus:outline-none focus:ring-4 focus:ring-[#EAF7C7] ${value === option.value ? "border-[#D4F24E] bg-[#F4FBE3] shadow-[0_10px_24px_rgba(134,185,59,0.12)]" : "border-[#E9E5DC] bg-[#FFFDF8] hover:border-[#DCE9B0]"}`}
        >
          <span className="block text-sm font-extrabold">{option.label}</span>
          {option.detail ? <span className="mt-1 block text-xs leading-5 text-[#6B7A5A]">{option.detail}</span> : null}
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
          className={`min-w-16 rounded-full border px-4 py-2.5 text-center text-sm font-extrabold transition focus:outline-none focus:ring-4 focus:ring-[#EAF7C7] ${value === option.value ? "border-[#D4F24E] bg-[#D4F24E] text-[#25321F] shadow-[0_8px_18px_rgba(212,242,78,0.28)]" : "border-[#E9E5DC] bg-[#FFFDF8] text-[#6B7A5A] hover:border-[#DCE9B0]"}`}
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
    <div className="mt-9 flex gap-3 border-t border-[#EFEAD9] pt-6">
      {step > 0 ? (
        <button type="button" onClick={onBack} disabled={saving} className="rounded-full border border-[#E9E5DC] bg-white px-6 py-3 text-sm font-bold text-[#6B7A5A]">
          قبلی
        </button>
      ) : null}
      <button type="submit" disabled={saving} className="flex-1 rounded-full bg-[#D4F24E] px-6 py-3.5 text-sm font-extrabold shadow-[0_14px_28px_rgba(212,242,78,0.3)] transition hover:bg-[#CFE84E] disabled:opacity-60">
        {saving ? "در حال ذخیره..." : step === total - 1 ? "ذخیره پرسشنامه" : "ادامه"}
      </button>
    </div>
  );
}
