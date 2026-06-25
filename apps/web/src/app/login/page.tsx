"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getCurrentUser, requestOtp, verifyOtp } from "@/lib/auth";

type Step = "phone" | "otp";

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
    <main className="min-h-screen overflow-hidden px-5 py-5 text-[#171717] sm:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl items-center gap-8 py-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="order-2 hidden lg:block">
          <div className="relative mx-auto aspect-square max-w-[22rem]">
            <div className="absolute inset-3 rounded-[4rem] bg-[#EEF8C7]" />
            <div className="absolute right-10 top-12 h-32 w-48 rotate-6 rounded-[999px] bg-white shadow-[0_18px_50px_rgba(23,23,23,0.07)]" />
            <div className="absolute right-16 top-20 h-20 w-32 rounded-[999px] bg-[#CDEB58]" />
            <div className="absolute right-28 top-[6.75rem] h-8 w-8 rounded-full bg-[#8EBB7A]" />
            <div className="absolute bottom-16 left-8 h-28 w-28 rounded-[2rem] bg-[#FFF3E1] shadow-[0_18px_50px_rgba(23,23,23,0.07)]" />
            <div className="absolute bottom-24 left-16 h-8 w-8 rounded-full bg-[#F27C5B]" />
          </div>
          <div className="mx-auto mt-6 max-w-sm rounded-[2rem] border border-[#E9E5DC] bg-white/80 p-6 shadow-[0_18px_45px_rgba(23,23,23,0.04)]">
            <p className="font-black">ورود ساده و امن برای شروع</p>
            <p className="mt-3 leading-8 text-[#77736B]">
              فقط شماره موبایلت رو وارد کن. فعلا همین برای دسترسی به داشبورد پایه کافیه.
            </p>
          </div>
        </div>

        <div className="order-1 mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-6 inline-flex rounded-full border border-[#E9E5DC] bg-white/80 px-4 py-2 text-sm font-black text-[#77736B] transition hover:text-[#171717]"
          >
            بازگشت
          </Link>

          <div className="rounded-[2.2rem] border border-[#E9E5DC] bg-white p-6 shadow-[0_24px_70px_rgba(23,23,23,0.07)] sm:p-8">
            <div className="mb-8 flex items-center gap-3">
              <span
                className={`h-3 flex-1 rounded-full ${step === "phone" ? "bg-[#CDEB58]" : "bg-[#EEF8C7]"}`}
              />
              <span
                className={`h-3 flex-1 rounded-full ${step === "otp" ? "bg-[#CDEB58]" : "bg-[#EEF8C7]"}`}
              />
            </div>

            <p className="text-sm font-black text-[#8EBB7A]">خوش اومدی</p>
            <h1 className="mt-3 text-4xl font-black leading-tight">
              {step === "phone" ? "شماره موبایلت رو وارد کن" : "کد ورود رو بنویس"}
            </h1>
            <p className="mt-4 leading-8 text-[#77736B]">
              {step === "phone"
                ? "برای ادامه، کد یک‌بارمصرف به شماره موبایل ایرانی تو ارسال می‌شه."
                : "کد ارسال‌شده رو وارد کن تا داشبوردت آماده بشه."}
            </p>

            {step === "phone" ? (
              <form className="mt-8 space-y-5" onSubmit={handleRequestOtp}>
                <label className="block">
                  <span className="text-sm font-black">شماره موبایل</span>
                  <input
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    inputMode="tel"
                    placeholder="09123456789"
                    className="mt-2 w-full rounded-[1.4rem] border border-[#E9E5DC] bg-[#FFFDF8] px-5 py-4 text-left text-base outline-none transition placeholder:text-[#B7B0A5] focus:border-[#CDEB58] focus:bg-white focus:ring-4 focus:ring-[#EEF8C7]"
                    dir="ltr"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isRequestingOtp}
                  className="w-full rounded-full bg-[#CDEB58] px-6 py-4 text-sm font-black text-[#171717] shadow-[0_18px_34px_rgba(205,235,88,0.34)] transition hover:-translate-y-0.5 hover:bg-[#d9f26a] disabled:cursor-not-allowed disabled:bg-[#E9E5DC] disabled:shadow-none"
                >
                  {isRequestingOtp ? "در حال ارسال کد..." : "دریافت کد ورود"}
                </button>
              </form>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={handleVerifyOtp}>
                <div className="rounded-[1.4rem] border border-[#E9E5DC] bg-[#EEF8C7] p-4 text-sm leading-7">
                  کد برای شماره <span dir="ltr">{phoneNumber}</span> ارسال شد.
                  {expiresInSeconds ? ` اعتبار کد ${expiresInSeconds / 60} دقیقه است.` : null}
                </div>

                {debugOtp ? (
                  <div className="rounded-[1.4rem] border border-[#F5D5C9] bg-[#FFF3E1] p-4 text-sm leading-7 text-[#7A3A27]">
                    <p className="font-black">کد تست محلی</p>
                    <p className="mt-1">
                      فقط وقتی نمایش داده می‌شود که API مقدار <span dir="ltr">otp</span>{" "}
                      را برگرداند: <span className="font-black" dir="ltr">{debugOtp}</span>
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
                    className="mt-2 w-full rounded-[1.4rem] border border-[#E9E5DC] bg-[#FFFDF8] px-5 py-4 text-center text-xl font-black tracking-[0.35em] outline-none transition placeholder:text-[#B7B0A5] focus:border-[#CDEB58] focus:bg-white focus:ring-4 focus:ring-[#EEF8C7]"
                    dir="ltr"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="w-full rounded-full bg-[#CDEB58] px-6 py-4 text-sm font-black text-[#171717] shadow-[0_18px_34px_rgba(205,235,88,0.34)] transition hover:-translate-y-0.5 hover:bg-[#d9f26a] disabled:cursor-not-allowed disabled:bg-[#E9E5DC] disabled:shadow-none"
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
                  className="w-full rounded-full border border-[#E9E5DC] bg-white px-6 py-4 text-sm font-black text-[#77736B] transition hover:text-[#171717]"
                >
                  تغییر شماره موبایل
                </button>
              </form>
            )}

            {error ? (
              <div className="mt-5 rounded-[1.4rem] border border-[#F5D5C9] bg-[#FFF3E1] p-4 text-sm leading-7 text-[#7A3A27]">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
