import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-semibold text-emerald-700">
          بازگشت به صفحه اصلی
        </Link>
        <div className="mt-10 rounded-md border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">داشبورد</p>
          <h1 className="mt-3 text-3xl font-bold">داشبورد هنوز فقط یک جایگاه اولیه است</h1>
          <p className="mt-5 max-w-3xl leading-8 text-slate-700">
            در این مرحله هیچ داده کاربری، برنامه غذایی، برنامه تمرینی، قابلیت مربی یا هوش
            مصنوعی پیاده‌سازی نشده است. این صفحه فقط مسیر و ظاهر اولیه داشبورد فارسی را نشان
            می‌دهد.
          </p>
        </div>
      </section>
    </main>
  );
}
