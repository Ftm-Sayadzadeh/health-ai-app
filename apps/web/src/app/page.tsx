import Link from "next/link";

const foundationItems = [
  "ثبت و پیگیری سبک زندگی در فازهای آینده",
  "تجربه فارسی و راست به چپ از اولین روز",
  "آمادگی برای API، داشبورد و سرویس‌های پس‌زمینه",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-center gap-10">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold text-emerald-700">
            نسخه پایه محصول سلامت فارسی
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            زیرساخت اولیه برای مدیریت سلامت، تغذیه، تمرین و سبک زندگی
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-700">
            این نسخه فقط پایه فنی محصول را آماده می‌کند: وب‌اپ فارسی، API، پایگاه داده،
            Redis و Celery. قابلیت‌های هوش مصنوعی، برنامه غذایی، تمرین و مربی در فازهای بعدی
            و با تایید کاربر اضافه می‌شوند.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-md bg-emerald-700 px-5 py-3 text-sm font-semibold text-white"
            >
              ورود با شماره موبایل
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800"
            >
              مشاهده داشبورد
            </Link>
            <a
              href="http://localhost:8000/api/health/"
              className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800"
            >
              بررسی سلامت API
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {foundationItems.map((item) => (
            <div key={item} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <p className="leading-7 text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
