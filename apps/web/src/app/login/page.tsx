"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getCurrentUser, requestOtp, verifyOtp } from "@/lib/auth";

type Step = "phone" | "otp";

function MiniAvocado() {
  return (
    <div className="relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[1.55rem] bg-[#FFF3E1] shadow-[0_14px_34px_rgba(82,116,64,0.1)]">
      <div className="absolute -right-1.5 top-3 h-4 w-4 rounded-full bg-[#CDEB58]" />
      <div className="absolute -left-1 bottom-4 h-3 w-3 rounded-full bg-[#F27C5B]/75" />
      <svg
        aria-hidden="true"
        className="h-12 w-12"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="60" cy="105" rx="30" ry="7" fill="#7EAF6B" opacity="0.16" />
        <path
          d="M75 17C72 9 61 9 57 17C46 18 35 30 30 47C22 77 39 101 60 101C81 101 98 77 90 47C86 30 75 18 75 17Z"
          fill="#79AD66"
        />
        <path
          d="M70 27C67 20 61 20 58 27C50 28 42 38 39 51C34 73 46 91 60 91C74 91 86 73 81 51C78 38 70 28 70 27Z"
          fill="#EFF8C9"
        />
        <circle cx="60" cy="68" r="16" fill="#F27C5B" />
        <path d="M71 18C76 10 86 9 95 13C90 23 80 27 71 18Z" fill="#8EBB7A" />
      </svg>
    </div>
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
    <main className="min-h-screen overflow-hidden px-4 py-3 text-[#171717] sm:px-6">
      <section className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-5xl items-center gap-6 py-3 lg:grid-cols-[0.7fr_1fr]">
        <div className="order-2 hidden lg:block">
          <div className="relative mx-auto max-w-xs rounded-[2.4rem] border border-[#E9E5DC]/80 bg-white/54 p-4 shadow-[0_18px_52px_rgba(82,116,64,0.08)]">
            <div className="absolute -right-4 top-10 h-14 w-14 rounded-full bg-[#EEF8C7]" />
            <div className="absolute -left-2 bottom-12 h-9 w-9 rounded-full bg-[#FFF3E1]" />
            <div className="relative rounded-[2rem] bg-[#FFF3E1] px-5 py-6">
              <MiniAvocado />
              <p className="mt-5 text-xl font-black leading-9">ورود ساده برای شروع آرام‌تر</p>
              <p className="mt-2 text-sm leading-7 text-[#77736B]">
                فقط شماره موبایلت رو وارد کن. فعلا همین برای دسترسی به داشبورد پایه کافیه.
              </p>
            </div>
          </div>
        </div>

        <div className="order-1 mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-4 inline-flex rounded-full border border-[#E9E5DC] bg-white/86 px-4 py-2 text-sm font-black text-[#77736B] shadow-sm transition hover:text-[#171717] focus:outline-none focus:ring-4 focus:ring-[#EEF8C7]"
          >
            بازگشت
          </Link>

          <div className="rounded-[2.35rem] border border-[#E9E5DC] bg-white p-6 shadow-[0_24px_64px_rgba(82,116,64,0.12)] sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-[#6D9D5B]">خوش اومدی 🌿</p>
                <p className="mt-2 text-sm font-bold text-[#77736B]">
                  {step === "phone" ? "شماره موبایلت رو وارد کن تا ادامه بدیم." : "کد ورودت رو وارد کن."}
                </p>
              </div>
              <MiniAvocado />
            </div>

            <div className="mb-7 flex items-center gap-3">
              <span
                className={`h-3 flex-1 rounded-full ${step === "phone" ? "bg-[#CDEB58]" : "bg-[#EEF8C7]"}`}
              />
              <span
                className={`h-3 flex-1 rounded-full ${step === "otp" ? "bg-[#CDEB58]" : "bg-[#EEF8C7]"}`}
              />
            </div>

            <h1 className="text-3xl font-black leading-tight">
              {step === "phone" ? "ورود با شماره موبایل" : "کد ورود رو بنویس"}
            </h1>
            <p className="mt-3 leading-8 text-[#77736B]">
              {step === "phone"
                ? "کد یک‌بارمصرف برای شماره موبایل ایرانی تو آماده می‌شه."
                : "بعد از تایید کد، داشبورد پایه برات باز می‌شه."}
            </p>

            {step === "phone" ? (
              <form className="mt-7 space-y-5" onSubmit={handleRequestOtp}>
                <label className="block">
                  <span className="text-sm font-black">شماره موبایل</span>
                  <input
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    inputMode="tel"
                    placeholder="09123456789"
                    className="mt-2 w-full rounded-[1.35rem] border border-[#E9E5DC] bg-[#FFFDF8] px-5 py-3.5 text-left text-base outline-none transition placeholder:text-[#B7B0A5] focus:border-[#CDEB58] focus:bg-white focus:ring-4 focus:ring-[#EEF8C7]"
                    dir="ltr"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isRequestingOtp}
                  className="w-full rounded-full bg-[#CDEB58] px-6 py-3.5 text-base font-black text-[#171717] shadow-[0_18px_32px_rgba(205,235,88,0.36)] transition hover:-translate-y-0.5 hover:bg-[#DDF36D] focus:outline-none focus:ring-4 focus:ring-[#EEF8C7] disabled:cursor-not-allowed disabled:bg-[#E9E5DC] disabled:shadow-none"
                >
                  {isRequestingOtp ? "در حال ارسال کد..." : "دریافت کد ورود"}
                </button>
              </form>
            ) : (
              <form className="mt-7 space-y-5" onSubmit={handleVerifyOtp}>
                <div className="rounded-[1.5rem] border border-[#DCE9B0] bg-[#EEF8C7] p-4 text-sm leading-7 text-[#405F35]">
                  کد برای شماره <span dir="ltr">{phoneNumber}</span> ارسال شد.
                  {expiresInSeconds ? ` اعتبار کد ${expiresInSeconds / 60} دقیقه است.` : null}
                </div>

                {debugOtp ? (
                  <div className="rounded-[1.5rem] border border-[#F5D5C9] bg-[#FFF3E1] p-4 text-sm leading-7 text-[#7A3A27]">
                    <p className="font-black">کد تست محلی</p>
                    <p className="mt-1">
                      فقط وقتی نمایش داده می‌شود که API مقدار <span dir="ltr">otp</span> را برگرداند:{" "}
                      <span className="font-black" dir="ltr">
                        {debugOtp}
                      </span>
                    </p>
                  </div>
                ) : null}

                <label className="block">
                  <span className="text-sm font-black">کد یک‌بارمصرف</span>
                  <input
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="123456"
                    className="mt-2 w-full rounded-[1.35rem] border border-[#E9E5DC] bg-[#FFFDF8] px-5 py-3.5 text-center text-xl font-black tracking-[0.35em] outline-none transition placeholder:text-[#B7B0A5] focus:border-[#CDEB58] focus:bg-white focus:ring-4 focus:ring-[#EEF8C7]"
                    dir="ltr"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="w-full rounded-full bg-[#CDEB58] px-6 py-3.5 text-base font-black text-[#171717] shadow-[0_18px_32px_rgba(205,235,88,0.36)] transition hover:-translate-y-0.5 hover:bg-[#DDF36D] focus:outline-none focus:ring-4 focus:ring-[#EEF8C7] disabled:cursor-not-allowed disabled:bg-[#E9E5DC] disabled:shadow-none"
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
                  className="w-full rounded-full border border-[#E9E5DC] bg-white px-6 py-4 text-sm font-black text-[#77736B] transition hover:text-[#171717] focus:outline-none focus:ring-4 focus:ring-[#EEF8C7]"
                >
                  تغییر شماره موبایل
                </button>
              </form>
            )}

            {error ? (
              <div className="mt-5 rounded-[1.5rem] border border-[#F5D5C9] bg-[#FFF3E1] p-4 text-sm leading-7 text-[#7A3A27]">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
