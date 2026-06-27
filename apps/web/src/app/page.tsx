import Link from "next/link";

function AvocadoMark() {
  return (
    <span className="relative flex h-10 w-10 items-center justify-center rounded-[1.25rem] bg-[#CDEB58] shadow-[0_10px_24px_rgba(142,187,122,0.22)]">
      <span className="absolute h-6 w-4 rotate-[-18deg] rounded-[70%_70%_58%_58%] bg-[#7EAF6B]" />
      <span className="absolute mt-1 h-3.5 w-2.5 rotate-[-18deg] rounded-full bg-[#EEF8C7]" />
      <span className="absolute mt-2 h-1.5 w-1.5 rounded-full bg-[#F27C5B]" />
    </span>
  );
}

function AvocadoHero() {
  return (
    <div className="relative mx-auto w-full max-w-[20.5rem]">
      <div className="absolute -right-3 top-7 h-12 w-12 rounded-full bg-[#EEF8C7]" />
      <div className="absolute -left-1 top-16 h-7 w-7 rounded-full bg-[#FFF3E1]" />
      <div className="absolute left-7 top-1 h-3 w-3 rounded-full bg-[#F27C5B]/70" />
      <div className="absolute bottom-8 right-7 h-5 w-5 rotate-12 rounded-full border-[3px] border-[#CDEB58]" />

      <div className="relative overflow-hidden rounded-[2.35rem] border border-[#E9E5DC] bg-white p-4 shadow-[0_22px_56px_rgba(82,116,64,0.12)]">
        <div className="rounded-[1.9rem] bg-[#FFF3E1] px-4 pb-4 pt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-black text-[#6D9D5B]">
              نسخه در حال ساخت
            </span>
            <span className="h-7 w-7 rounded-full bg-[#CDEB58] shadow-[0_8px_18px_rgba(205,235,88,0.36)]" />
          </div>

          <svg
            aria-hidden="true"
            className="mx-auto h-auto w-full max-w-[14.75rem]"
            viewBox="0 0 320 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="160" cy="282" rx="86" ry="18" fill="#7EAF6B" opacity="0.16" />
            <path
              d="M201 43C193 21 163 22 151 41C134 42 111 53 94 79C73 111 67 151 76 191C88 247 119 281 160 281C201 281 232 247 244 191C253 151 247 111 226 79C219 68 210 56 201 43Z"
              fill="#79AD66"
            />
            <path
              d="M194 62C188 45 164 46 155 62C143 62 125 72 111 94C95 119 90 151 98 184C108 230 132 258 160 258C188 258 212 230 222 184C230 151 225 119 209 94C204 84 199 74 194 62Z"
              fill="#EFF8C9"
            />
            <path
              d="M160 93C141 110 122 139 123 176C124 221 142 244 160 244C178 244 196 221 197 176C198 139 179 110 160 93Z"
              fill="#F8FFE2"
              opacity="0.85"
            />
            <circle cx="160" cy="194" r="42" fill="#F27C5B" />
            <circle cx="151" cy="183" r="14" fill="#FFB39E" opacity="0.55" />
            <path
              d="M189 42C198 25 218 21 237 29C226 48 209 56 189 42Z"
              fill="#8EBB7A"
            />
            <path
              d="M184 48C199 42 216 38 231 32"
              stroke="#5D8C50"
              strokeLinecap="round"
              strokeWidth="5"
            />
            <path
              d="M91 95C78 111 70 133 68 156"
              stroke="#5D8C50"
              strokeLinecap="round"
              strokeWidth="8"
              opacity="0.28"
            />
            <circle cx="236" cy="107" r="7" fill="#CDEB58" />
            <circle cx="91" cy="232" r="6" fill="#F27C5B" opacity="0.65" />
          </svg>
        </div>

        <div className="mt-4 rounded-[1.45rem] bg-[#FFFDF8] p-3.5">
          <p className="text-sm font-black text-[#171717]">شروعی نرم برای عادت‌های سالم</p>
          <p className="mt-1.5 text-sm leading-7 text-[#77736B]">
            فعلا نسخه پایه آماده است؛ تجربه کامل تغذیه و همراهی هوشمند مرحله‌به‌مرحله اضافه می‌شود.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden px-4 py-3 text-[#171717] sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-6xl flex-col gap-5 py-2">
        <header className="flex items-center justify-between gap-4 rounded-[1.65rem] border border-[#E9E5DC] bg-white/86 px-3.5 py-2.5 shadow-[0_12px_34px_rgba(82,116,64,0.07)] backdrop-blur sm:px-4">
          <Link href="/" className="flex items-center gap-3">
            <AvocadoMark />
            <div>
              <p className="text-sm font-black sm:text-base">سلامت هوشمند</p>
              <p className="text-[0.7rem] font-bold text-[#77736B] sm:text-xs">فارسی، آرام، در حال ساخت</p>
            </div>
          </Link>

          <Link
            href="/login"
            className="rounded-full bg-[#CDEB58] px-5 py-2.5 text-sm font-black text-[#171717] shadow-[0_12px_24px_rgba(205,235,88,0.34)] transition hover:-translate-y-0.5 hover:bg-[#DDF36D] focus:outline-none focus:ring-4 focus:ring-[#EEF8C7]"
          >
            ورود
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-7 rounded-[2.4rem] border border-[#E9E5DC]/80 bg-white/42 p-5 shadow-[0_18px_58px_rgba(82,116,64,0.06)] sm:p-6 lg:grid-cols-[1.05fr_0.78fr] lg:p-8">
          <div className="max-w-xl">
            <p className="mb-4 inline-flex rounded-full bg-[#EEF8C7] px-3.5 py-2 text-xs font-black text-[#5E8D51]">
              پلتفرم فارسی سلامت و تغذیه
            </p>

            <h1 className="max-w-[34rem] text-4xl font-extrabold leading-[1.25] sm:text-5xl lg:text-[3.25rem]">
              همراه آروم تغذیه و عادت‌های سالم تو
            </h1>

            <p className="mt-5 max-w-lg text-base leading-8 text-[#77736B] sm:text-lg">
              در حال ساختیم تا ثبت غذا، پیگیری مسیر و تصمیم‌های سالم‌تر، فارسی و ساده‌تر بشه.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="rounded-full bg-[#CDEB58] px-7 py-3.5 text-center text-base font-black text-[#171717] shadow-[0_18px_32px_rgba(205,235,88,0.36)] transition hover:-translate-y-0.5 hover:bg-[#DDF36D] focus:outline-none focus:ring-4 focus:ring-[#EEF8C7]"
              >
                ورود با شماره موبایل
              </Link>
              <span className="rounded-full bg-white/72 px-4 py-3 text-center text-sm font-bold text-[#8A8479]">
                نسخه اولیه، بدون قابلیت‌های نمایشی
              </span>
            </div>
          </div>

          <AvocadoHero />
        </div>
      </section>
    </main>
  );
}
