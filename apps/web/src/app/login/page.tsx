"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getCurrentUser, needsHealthProfile, requestOtp, verifyOtp } from "@/lib/auth";

/* eslint-disable @next/next/no-img-element */

type Step = "phone" | "otp";

function BrandMark() {
  return (
    <span className="app-logo h-9 w-9 shrink-0">
      <img
        src="/brand-assets/avocado-smiling.png"
        alt=""
        aria-hidden="true"
        className="h-16 w-16 max-w-none translate-y-0.5 object-contain"
      />
    </span>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [expiresInSeconds, setExpiresInSeconds] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  async function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDebugOtp(null);
    setIsRequestingOtp(true);

    try {
      const response = await requestOtp(phoneNumber);
      setStep("otp");
      setExpiresInSeconds(response.expires_in_seconds);
      setDebugOtp(response.otp ?? null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "ارسال کد ناموفق بود.");
    } finally {
      setIsRequestingOtp(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsVerifyingOtp(true);

    try {
      await verifyOtp(phoneNumber, otp);
      const currentUser = await getCurrentUser();
      router.replace(needsHealthProfile(currentUser) ? "/onboarding" : "/dashboard");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "ورود ناموفق بود.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden px-4 py-4 text-[var(--text-strong)] sm:px-6 lg:px-8">
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col">
        <header dir="rtl" className="sticky top-4 z-30 mb-4 shrink-0">
          <div className="app-header">
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark />
              <span className="flex flex-col leading-none">
                <span className="text-[0.95rem] font-bold tracking-tight">
                  سلامت هوشمند
                </span>
                <span className="mt-1 text-[0.66rem] font-medium text-[var(--text-subtle)]">
                  ورود به حساب
                </span>
              </span>
            </Link>
            <Link href="/" className="btn btn-secondary btn-sm">
              بازگشت
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                <path
                  d="M10 3L5 8L10 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </header>

        {/* body */}
        <div className="relative flex flex-1 items-center justify-center py-6">
          <div className="card w-full max-w-[26rem] p-6 sm:p-8">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="relative mb-4 flex h-14 w-14 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[var(--brand-avocado-soft)]" />
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full">
                  <img
                    src="/brand-assets/avocado-smiling.png"
                    alt=""
                    className="h-20 w-20 max-w-none translate-y-1 object-contain"
                  />
                </span>
              </div>
              <p className="text-[0.72rem] font-bold tracking-wide text-[var(--brand-green)]">
                خوش اومدی
              </p>
              <h1 className="mt-1 text-[1.4rem] font-bold leading-tight">
                {step === "phone" ? "ورود با شماره موبایل" : "کد ورود رو بنویس"}
              </h1>
              <p className="mt-2 text-[0.82rem] leading-6 text-[var(--text-muted)]">
                {step === "phone"
                  ? "کد یک‌بارمصرف برای شماره موبایل ایرانی تو آماده می‌شه."
                  : "بعد از تایید کد، داشبورد پایه برات باز می‌شه."}
              </p>
            </div>

            <div className="mb-6 flex items-center gap-2" dir="rtl">
              <span
                className={`h-1.5 flex-1 rounded-full transition-colors ${step === "phone" ? "bg-[var(--brand-avocado)]" : "bg-[var(--brand-avocado-soft)]"}`}
              />
              <span
                className={`h-1.5 flex-1 rounded-full transition-colors ${step === "otp" ? "bg-[var(--brand-avocado)]" : "bg-[var(--brand-avocado-soft)]"}`}
              />
            </div>

            {step === "phone" ? (
              <form className="space-y-5" onSubmit={handleRequestOtp}>
                <label className="block">
                  <span className="field-label">شماره موبایل</span>
                  <input
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    inputMode="tel"
                    placeholder="09123456789"
                    className="field-input mt-2 text-left text-base"
                    dir="ltr"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isRequestingOtp}
                  className="btn btn-primary w-full py-3.5 text-base"
                >
                  {isRequestingOtp ? "در حال ارسال کد..." : "دریافت کد ورود"}
                </button>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleVerifyOtp}>
                <div className="notice notice-info">
                  کد برای شماره{" "}
                  <span dir="ltr" className="font-bold">
                    {phoneNumber}
                  </span>{" "}
                  ارسال شد.
                  {expiresInSeconds
                    ? ` اعتبار کد ${expiresInSeconds / 60} دقیقه است.`
                    : null}
                </div>

                {debugOtp ? (
                  <div className="notice" style={{ backgroundColor: "var(--warning-soft)", borderColor: "#ecdcb6", color: "var(--warning)" }}>
                    <p className="font-bold">کد تست محلی</p>
                    <p className="mt-1">
                      فقط وقتی نمایش داده می‌شود که API مقدار{" "}
                      <span dir="ltr" className="font-bold">
                        otp
                      </span>{" "}
                      را برگرداند:{" "}
                      <span className="font-bold" dir="ltr">
                        {debugOtp}
                      </span>
                    </p>
                  </div>
                ) : null}

                <label className="block">
                  <span className="field-label">کد یک‌بارمصرف</span>
                  <input
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="123456"
                    className="field-input mt-2 text-center text-xl font-bold tracking-[0.35em]"
                    dir="ltr"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="btn btn-primary w-full py-3.5 text-base"
                >
                  {isVerifyingOtp ? "در حال ورود..." : "ورود"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setError(null);
                    setDebugOtp(null);
                  }}
                  className="btn btn-secondary w-full py-3 text-[0.8rem]"
                >
                  تغییر شماره موبایل
                </button>
              </form>
            )}

            {error ? (
              <div role="alert" aria-live="polite" className="notice notice-error mt-5">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
