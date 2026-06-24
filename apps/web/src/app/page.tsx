import Link from "next/link";

const foundationItems = [
  {
    title: "تجربه فارسی و RTL",
    body: "رابط کاربری از ابتدا برای فارسی، موبایل و استفاده روزمره طراحی می‌شود.",
  },
  {
    title: "سلامت و تغذیه با کمک AI",
    body: "قابلیت‌های هوشمند برای تغذیه، کالری و سبک زندگی در فازهای بعدی اضافه می‌شوند.",
  },
  {
    title: "آماده برای مربی و کاربر",
    body: "زیرساخت ورود، API و داشبورد پایه آماده شده و ویژگی‌های محصول مرحله‌ای جلو می‌روند.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen px-5 py-6 text-stone-950 sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-center gap-10 py-10">
        <nav className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-black text-emerald-950">سلامت هوشمند</p>
            <p className="text-xs font-semibold text-emerald-700">نسخه در حال توسعه</p>
          </div>
          <Link
            href="/login"
            className="rounded-full bg-emerald-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
          >
            ورود
          </Link>
        </nav>

        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm">
              پلتفرم فارسی سلامت، تغذیه، کالری و مربی‌گری
            </p>
            <h1 className="max-w-4xl text-4xl font-black leading-[1.25] tracking-tight text-emerald-950 sm:text-5xl">
              یک همراه آرام و هوشمند برای ساختن عادت‌های سالم‌تر
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-700">
              این محصول در حال توسعه است تا ثبت تغذیه، مدیریت کالری، برنامه‌ریزی سبک زندگی و
              ارتباط کاربر و مربی را با تجربه‌ای فارسی، ساده و قابل اعتماد کنار هم بیاورد.
              قابلیت‌های هوش مصنوعی در فازهای بعدی و با تایید کاربر اضافه می‌شوند.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="rounded-full bg-emerald-800 px-6 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                ورود با شماره موبایل
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-emerald-200 bg-white/80 px-6 py-3.5 text-center text-sm font-bold text-emerald-900 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300"
              >
                مشاهده داشبورد
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-2xl shadow-emerald-950/10 backdrop-blur">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-emerald-900 to-emerald-700 p-6 text-white">
              <p className="text-sm font-bold text-emerald-100">وضعیت فعلی محصول</p>
              <h2 className="mt-4 text-2xl font-black">زیرساخت ورود و داشبورد آماده است</h2>
              <p className="mt-4 leading-8 text-emerald-50">
                این نسخه فقط احراز هویت OTP، داشبورد پایه و مسیرهای اصلی وب را آماده می‌کند.
              </p>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-sm font-bold text-emerald-900">ورود امن‌تر برای MVP</p>
                <p className="mt-1 text-sm leading-7 text-slate-600">
                  ورود با شماره موبایل و کد یک‌بارمصرف به بک‌اند متصل است.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">بدون داده ساختگی</p>
                <p className="mt-1 text-sm leading-7 text-slate-600">
                  هنوز آمار، پروفایل، برنامه غذایی یا قابلیت مربی‌گری نمایشی اضافه نشده است.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {foundationItems.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-white/80 bg-white/75 p-6 shadow-sm shadow-emerald-950/5 backdrop-blur"
            >
              <p className="text-base font-black text-emerald-950">{item.title}</p>
              <p className="mt-3 leading-8 text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <a
            href="http://localhost:8000/api/health/"
            className="text-sm font-semibold text-slate-500 transition hover:text-emerald-800"
          >
            بررسی سلامت API
          </a>
        </div>
      </section>
    </main>
  );
}
