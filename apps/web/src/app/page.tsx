import Link from "next/link";

const notes = [
  "فارسی، ساده و آرام",
  "ورود امن با کد یک‌بارمصرف",
  "قابلیت‌های تغذیه و AI در راه‌اند",
];

function WellnessIllustration() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[22rem]">
      <div className="absolute inset-4 rounded-[3.5rem] bg-[#EEF8C7] shadow-[0_24px_70px_rgba(142,187,122,0.25)]" />
      <div className="absolute left-8 top-9 h-24 w-14 rotate-[-24deg] rounded-[999px] bg-[#8EBB7A]" />
      <div className="absolute right-12 top-10 h-24 w-36 rotate-12 rounded-[999px] bg-white shadow-[0_18px_45px_rgba(23,23,23,0.08)]" />
      <div className="absolute right-16 top-16 h-16 w-24 rounded-[999px] bg-[#CDEB58]" />
      <div className="absolute right-24 top-20 h-7 w-7 rounded-full bg-[#8EBB7A]" />
      <div className="absolute bottom-14 left-12 h-28 w-28 rounded-[2.2rem] bg-[#FFF3E1] shadow-[0_18px_45px_rgba(23,23,23,0.08)]" />
      <div className="absolute bottom-20 left-20 h-8 w-8 rounded-full bg-[#F27C5B]" />
      <div className="absolute bottom-10 right-8 rounded-full bg-white px-5 py-3 text-sm font-black text-[#171717] shadow-[0_14px_34px_rgba(23,23,23,0.08)]">
        آروم‌تر، سالم‌تر
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden px-5 py-5 text-[#171717] sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col justify-between gap-10 py-6">
        <nav className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#CDEB58] shadow-[0_12px_26px_rgba(205,235,88,0.38)]">
              <span className="h-5 w-5 rounded-full bg-[#8EBB7A]" />
            </div>
            <div>
              <p className="text-base font-black">سلامت هوشمند</p>
              <p className="text-xs font-bold text-[#77736B]">نسخه در حال ساخت</p>
            </div>
          </div>
          <Link
            href="/login"
            className="rounded-full bg-[#171717] px-5 py-2.5 text-sm font-black text-white shadow-[0_12px_24px_rgba(23,23,23,0.12)] transition hover:-translate-y-0.5 hover:bg-[#2a2a2a]"
          >
            ورود
          </Link>
        </nav>

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.88fr]">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex rounded-full border border-[#E9E5DC] bg-white/80 px-4 py-2 text-sm font-black text-[#8EBB7A] shadow-sm">
              پلتفرم فارسی سلامت و تغذیه
            </p>
            <h1 className="text-5xl font-black leading-[1.18] tracking-tight sm:text-6xl">
              همراه آروم تغذیه و عادت‌های سالم تو
            </h1>
            <p className="mt-6 text-lg leading-9 text-[#77736B]">
              در حال ساختیم تا ثبت غذا، پیگیری مسیر و تصمیم‌های سالم‌تر، فارسی و ساده‌تر بشه.
              فعلا ورود و داشبورد پایه آماده‌اند.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="rounded-full bg-[#CDEB58] px-7 py-4 text-center text-sm font-black text-[#171717] shadow-[0_18px_34px_rgba(205,235,88,0.34)] transition hover:-translate-y-0.5 hover:bg-[#d9f26a]"
              >
                ورود با شماره موبایل
              </Link>
              <a
                href="http://localhost:8000/api/health/"
                className="rounded-full border border-[#E9E5DC] bg-white/80 px-7 py-4 text-center text-sm font-black text-[#77736B] transition hover:-translate-y-0.5 hover:text-[#171717]"
              >
                وضعیت API
              </a>
            </div>
          </div>

          <WellnessIllustration />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {notes.map((note) => (
            <div
              key={note}
              className="rounded-[2rem] border border-[#E9E5DC] bg-white/80 p-5 shadow-[0_18px_45px_rgba(23,23,23,0.04)]"
            >
              <p className="text-base font-black">{note}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
