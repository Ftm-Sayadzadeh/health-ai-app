"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getCurrentUser, requestOtp, verifyOtp } from "@/lib/auth";

/* eslint-disable @next/next/no-img-element */

type Step = "phone" | "otp";

function SmilingAvocado({
  className,
  imgClassName,
}: {
  className?: string;
  imgClassName?: string;
}) {
  return (
    <span
      className={`relative flex items-center justify-center rounded-[0.85rem] bg-gradient-to-br from-[#D4F24E] to-[#CFE84E] shadow-[0_6px_16px_rgba(134,185,59,0.34)] ring-1 ring-white/40 ${className ?? ""}`}
    >
      <img
        src="/brand-assets/avocado-smiling.png"
        alt=""
        className={`object-contain ${imgClassName ?? "h-[1.6rem] w-[1.6rem]"}`}
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
      await getCurrentUser();
      router.replace("/dashboard");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "ورود ناموفق بود.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden px-4 py-4 text-[#25321F] sm:px-6 lg:px-8">
      {/* ambient background: soft lime + peach glows */}
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#EAF7C7]/55 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[#FFF6E8]/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#D4F24E]/14 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col">
        {/* floating pill header — matches landing page style */}
        <header dir="rtl" className="sticky top-4 z-30 mb-4">
          <div className="flex items-center justify-between gap-4 rounded-full border border-[#EFEAD9]/80 bg-white/85 px-4 py-2.5 shadow-[0_14px_34px_rgba(85,117,54,0.1)] backdrop-blur-md sm:px-6 sm:py-3">
            <Link href="/" className="flex items-center gap-3">
              <SmilingAvocado className="h-11 w-11" imgClassName="h-[2.6rem] w-[2.6rem]" />
              <span className="flex flex-col leading-none">
                <span className="text-[1rem] font-extrabold tracking-tight">
                  سلامت هوشمند
                </span>
                <span className="mt-1 text-[0.66rem] font-medium text-[#8A9A78]">
                  ورود به حساب
                </span>
              </span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E9E5DC] bg-white px-5 py-2.5 text-[0.85rem] font-extrabold text-[#557536] shadow-[0_10px_22px_rgba(85,117,54,0.08)] transition hover:-translate-y-0.5 hover:border-[#DCE9B0] hover:bg-[#EAF7C7]/40 focus:outline-none focus:ring-4 focus:ring-[#EAF7C7]"
            >
              بازگشت
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5"
                fill="none"
              >
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
        <div className="relative w-full max-w-[27rem] rounded-[2rem] border border-[#EFEAD9] bg-white/95 p-8 shadow-[0_40px_90px_-20px_rgba(85,117,54,0.22)] ring-1 ring-black/[0.02] backdrop-blur sm:p-9">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#EAF7C7] to-[#FFF6E8]" />
              <div className="absolute inset-0 rounded-full ring-1 ring-[#D4F24E]/40" />
              <img
                src="/brand-assets/avocado-smiling.png"
                alt=""
                className="relative h-12 w-12 object-contain drop-shadow-[0_4px_8px_rgba(85,117,54,0.18)]"
              />
            </div>
            <p className="text-[0.72rem] font-extrabold tracking-wide text-[#86B93B]">
              خوش اومدی
            </p>
            <h1 className="mt-1.5 text-[1.6rem] font-extrabold leading-tight">
              {step === "phone" ? "ورود با شماره موبایل" : "کد ورود رو بنویس"}
            </h1>
            <p className="mt-2 text-[0.82rem] leading-6 text-[#6B7A5A]">
              {step === "phone"
                ? "کد یک‌بارمصرف برای شماره موبایل ایرانی تو آماده می‌شه."
                : "بعد از تایید کد، داشبورد پایه برات باز می‌شه."}
            </p>
          </div>

          <div className="mb-7 flex items-center gap-2" dir="rtl">
            <span
              className={`h-1.5 flex-1 rounded-full transition-colors ${step === "phone" ? "bg-[#D4F24E]" : "bg-[#EAF7C7]"}`}
            />
            <span
              className={`h-1.5 flex-1 rounded-full transition-colors ${step === "otp" ? "bg-[#D4F24E]" : "bg-[#EAF7C7]"}`}
            />
          </div>

          {step === "phone" ? (
            <form className="space-y-5" onSubmit={handleRequestOtp}>
              <label className="block">
                <span className="text-[0.8rem] font-bold text-[#557536]">
                  شماره موبایل
                </span>
                <input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  inputMode="tel"
                  placeholder="09123456789"
                  className="mt-2 w-full rounded-[1.1rem] border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3.5 text-left text-base outline-none transition placeholder:text-[#B7B0A5] focus:border-[#D4F24E] focus:bg-white focus:ring-4 focus:ring-[#EAF7C7]"
                  dir="ltr"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isRequestingOtp}
                className="w-full rounded-full bg-[#D4F24E] px-6 py-3.5 text-base font-extrabold text-[#25321F] shadow-[0_16px_30px_rgba(212,242,78,0.4)] transition hover:-translate-y-0.5 hover:bg-[#CFE84E] focus:outline-none focus:ring-4 focus:ring-[#EAF7C7] disabled:cursor-not-allowed disabled:bg-[#E9E5DC] disabled:text-[#8A9A78] disabled:shadow-none"
              >
                {isRequestingOtp ? "در حال ارسال کد..." : "دریافت کد ورود"}
              </button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleVerifyOtp}>
              <div className="rounded-[1rem] border border-[#DCE9B0] bg-[#EAF7C7] px-4 py-3 text-[0.8rem] leading-6 text-[#3F5B2C]">
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
                <div className="rounded-[1rem] border border-[#F5D5C9] bg-[#FFF6E8] px-4 py-3 text-[0.8rem] leading-6 text-[#7A3A27]">
                  <p className="font-extrabold">کد تست محلی</p>
                  <p className="mt-1">
                    فقط وقتی نمایش داده می‌شود که API مقدار{" "}
                    <span dir="ltr" className="font-bold">
                      otp
                    </span>{" "}
                    را برگرداند:{" "}
                    <span className="font-extrabold" dir="ltr">
                      {debugOtp}
                    </span>
                  </p>
                </div>
              ) : null}

              <label className="block">
                <span className="text-[0.8rem] font-bold text-[#557536]">
                  کد یک‌بارمصرف
                </span>
                <input
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="123456"
                  className="mt-2 w-full rounded-[1.1rem] border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3.5 text-center text-xl font-extrabold tracking-[0.35em] outline-none transition placeholder:text-[#B7B0A5] focus:border-[#D4F24E] focus:bg-white focus:ring-4 focus:ring-[#EAF7C7]"
                  dir="ltr"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isVerifyingOtp}
                className="w-full rounded-full bg-[#D4F24E] px-6 py-3.5 text-base font-extrabold text-[#25321F] shadow-[0_16px_30px_rgba(212,242,78,0.4)] transition hover:-translate-y-0.5 hover:bg-[#CFE84E] focus:outline-none focus:ring-4 focus:ring-[#EAF7C7] disabled:cursor-not-allowed disabled:bg-[#E9E5DC] disabled:text-[#8A9A78] disabled:shadow-none"
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
                className="w-full rounded-full border border-[#E9E5DC] bg-white px-6 py-3 text-[0.8rem] font-bold text-[#6B7A5A] transition hover:text-[#25321F] focus:outline-none focus:ring-4 focus:ring-[#EAF7C7]"
              >
                تغییر شماره موبایل
              </button>
            </form>
          )}

          {error ? (
            <div className="mt-5 rounded-[1rem] border border-[#F5D5C9] bg-[#FFF6E8] px-4 py-3 text-[0.8rem] leading-6 text-[#7A3A27]">
              {error}
            </div>
          ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
