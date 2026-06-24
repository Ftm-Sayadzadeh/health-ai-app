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
    <main className="min-h-screen px-5 py-6 text-stone-950 sm:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="order-2 hidden rounded-[2rem] border border-white/80 bg-white/70 p-6 shadow-xl shadow-emerald-950/10 backdrop-blur lg:block">
          <div className="rounded-[1.5rem] bg-emerald-900 p-7 text-white">
            <p className="text-sm font-bold text-emerald-100">ورود ساده و متمرکز</p>
            <h2 className="mt-4 text-3xl font-black leading-snug">
              فقط شماره موبایل، کد یک‌بارمصرف و ورود به داشبورد
            </h2>
            <p className="mt-5 leading-8 text-emerald-50">
              این صفحه فقط برای احراز هویت MVP ساخته شده است و هنوز هیچ پروفایل یا جریان
              محصولی دیگری اضافه نمی‌کند.
            </p>
          </div>
          <div className="mt-4 rounded-3xl bg-emerald-50 p-5">
            <p className="font-black text-emerald-950">راهنمای تست محلی</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              اگر بک‌اند در حالت توسعه مقدار OTP را برگرداند، همان کد در باکس کوچک توسعه
              نمایش داده می‌شود.
            </p>
          </div>
        </div>

        <div className="order-1 mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-6 inline-flex rounded-full border border-emerald-100 bg-white/70 px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm transition hover:border-emerald-200"
          >
            بازگشت به صفحه اصلی
          </Link>

          <div className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-2xl shadow-emerald-950/10 backdrop-blur sm:p-8">
            <div className="mb-8 flex items-center gap-3">
              <span
                className={`h-2.5 flex-1 rounded-full ${step === "phone" ? "bg-emerald-700" : "bg-emerald-200"}`}
              />
              <span
                className={`h-2.5 flex-1 rounded-full ${step === "otp" ? "bg-emerald-700" : "bg-emerald-200"}`}
              />
            </div>

            <p className="text-sm font-bold text-emerald-700">ورود با شماره موبایل</p>
            <h1 className="mt-3 text-3xl font-black text-emerald-950">
              {step === "phone" ? "شماره موبایل خود را وارد کنید" : "کد ورود را وارد کنید"}
            </h1>
            <p className="mt-4 leading-8 text-slate-600">
              {step === "phone"
                ? "برای ورود به داشبورد، شماره موبایل ایرانی خود را وارد کنید."
                : "کد یک‌بارمصرف ارسال‌شده را وارد کنید تا ورود شما تایید شود."}
            </p>

            {step === "phone" ? (
              <form className="mt-8 space-y-5" onSubmit={handleRequestOtp}>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">شماره موبایل</span>
                  <input
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    inputMode="tel"
                    placeholder="09123456789"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-left text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    dir="ltr"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isRequestingOtp}
                  className="w-full rounded-2xl bg-emerald-800 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
                >
                  {isRequestingOtp ? "در حال ارسال کد..." : "دریافت کد"}
                </button>
              </form>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={handleVerifyOtp}>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-7 text-emerald-950">
                  کد ورود برای شماره <span dir="ltr">{phoneNumber}</span> ارسال شد.
                  {expiresInSeconds ? ` اعتبار کد ${expiresInSeconds / 60} دقیقه است.` : null}
                </div>

                {debugOtp ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
                    <p className="font-black">کد توسعه محلی</p>
                    <p className="mt-1">
                      این کد فقط وقتی نمایش داده می‌شود که API مقدار <span dir="ltr">otp</span>{" "}
                      را برگرداند: <span className="font-black" dir="ltr">{debugOtp}</span>
                    </p>
                  </div>
                ) : null}

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">کد یک‌بارمصرف</span>
                  <input
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="123456"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-xl font-black tracking-[0.35em] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    dir="ltr"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="w-full rounded-2xl bg-emerald-800 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
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
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 transition hover:border-emerald-200 hover:text-emerald-800"
                >
                  تغییر شماره موبایل
                </button>
              </form>
            )}

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-7 text-red-700">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
