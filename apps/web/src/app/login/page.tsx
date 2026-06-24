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
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <Link href="/" className="mb-8 text-sm font-semibold text-emerald-700">
          بازگشت به صفحه اصلی
        </Link>

        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">ورود با شماره موبایل</p>
          <h1 className="mt-3 text-3xl font-bold">ورود به داشبورد</h1>
          <p className="mt-4 leading-7 text-slate-600">
            شماره موبایل ایرانی خود را وارد کنید تا کد یک‌بارمصرف برای ورود دریافت کنید.
          </p>

          {step === "phone" ? (
            <form className="mt-8 space-y-5" onSubmit={handleRequestOtp}>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">شماره موبایل</span>
                <input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  inputMode="tel"
                  placeholder="09123456789"
                  className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 text-left text-base outline-none transition focus:border-emerald-700"
                  dir="ltr"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isRequestingOtp}
                className="w-full rounded-md bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isRequestingOtp ? "در حال ارسال..." : "دریافت کد"}
              </button>
            </form>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={handleVerifyOtp}>
              <div className="rounded-md bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                کد ورود برای شماره <span dir="ltr">{phoneNumber}</span> ارسال شد.
                {expiresInSeconds ? ` اعتبار کد ${expiresInSeconds / 60} دقیقه است.` : null}
              </div>

              {debugOtp ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">کد توسعه محلی</p>
                  <p className="mt-2">
                    این کد فقط وقتی نمایش داده می‌شود که API مقدار <span dir="ltr">otp</span>{" "}
                    را برگرداند: <span className="font-bold" dir="ltr">{debugOtp}</span>
                  </p>
                </div>
              ) : null}

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">کد یک‌بارمصرف</span>
                <input
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="123456"
                  className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 text-center text-lg tracking-[0.35em] outline-none transition focus:border-emerald-700"
                  dir="ltr"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isVerifyingOtp}
                className="w-full rounded-md bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
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
                className="w-full rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800"
              >
                تغییر شماره موبایل
              </button>
            </form>
          )}

          {error ? (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-7 text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
