import Link from "next/link";

/* eslint-disable @next/next/no-img-element */

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
      <span className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[0.85rem]">
        <img
          src="/brand-assets/avocado-smiling.png"
          alt=""
          className={`object-contain ${imgClassName ?? "h-[1.6rem] w-[1.6rem]"}`}
        />
      </span>
    </span>
  );
}

type FeatureProps = {
  image: string;
  alt: string;
  title: string;
  tint: string;
  status: "active" | "soon";
  children: React.ReactNode;
};

function FeatureCard({ image, alt, title, tint, status, children }: FeatureProps) {
  return (
    <div className="group relative overflow-hidden rounded-[1.5rem] border border-[#EFEAD9] bg-white/85 p-6 shadow-[0_12px_30px_rgba(85,117,54,0.06)] backdrop-blur transition duration-300 hover:-translate-y-1.5 hover:border-[#DCE9B0] hover:shadow-[0_24px_50px_rgba(85,117,54,0.12)]">
      <span
        className={`absolute left-5 top-5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.6rem] font-extrabold ${
          status === "active"
            ? "bg-[#EAF7C7] text-[#557536]"
            : "bg-[#FFF6E8] text-[#7A3A27]"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            status === "active" ? "bg-[#86B93B]" : "bg-[#FFB24D]"
          }`}
        />
        {status === "active" ? "فعال" : "به‌زودی"}
      </span>

      <div
        className={`flex h-14 w-14 items-center justify-center rounded-[1rem] ${tint} shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]`}
      >
        <img src={image} alt={alt} className="h-9 w-9 object-contain" />
      </div>
      <h3 className="mt-5 text-[1rem] font-extrabold text-[#25321F]">{title}</h3>
      <p className="mt-2 text-[0.85rem] leading-7 text-[#6B7A5A]">{children}</p>
    </div>
  );
}

function HeroScene() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[34rem] items-center justify-center">
      {/* layered ambient glow: lime + peach */}
      <div className="absolute inset-0 rounded-[3rem] bg-[radial-gradient(circle_at_50%_40%,rgba(212,242,78,0.55),rgba(234,247,199,0.3)_45%,transparent_72%)] blur-2xl" />
      <div className="absolute inset-x-6 bottom-6 h-2/3 rounded-[3rem] bg-[radial-gradient(circle_at_50%_80%,rgba(255,198,154,0.28),transparent_70%)] blur-2xl" />

      {/* organic lime surface (morphing blob) */}
      <svg
        className="animate-blob absolute inset-0 h-full w-full drop-shadow-[0_34px_70px_rgba(85,117,54,0.14)]"
        viewBox="0 0 400 400"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="heroSurface" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EAF7C7" />
            <stop offset="60%" stopColor="#F4FBE3" />
            <stop offset="100%" stopColor="#FFF6E8" />
          </linearGradient>
        </defs>
        <path
          d="M198 28C254 26 304 54 324 102C350 146 374 190 360 240C346 292 310 338 256 360C205 380 146 374 96 346C46 318 16 268 22 214C28 156 56 108 106 70C140 46 168 30 198 28Z"
          fill="url(#heroSurface)"
        />
      </svg>

      {/* subtle inner ring for depth */}
      <div className="absolute inset-10 rounded-[3rem] ring-1 ring-white/30" />

      {/* soft shadow under bowl */}
      <div className="absolute bottom-16 h-5 w-64 rounded-full bg-[#557536]/16 blur-xl" />

      {/* the bowl — strong focal point */}
      <img
        src="/brand-assets/healthy-bowl.png"
        alt="کاسه غذای سالم"
        className="animate-floaty relative h-[22rem] w-[22rem] object-contain drop-shadow-[0_34px_50px_rgba(85,117,54,0.26)] sm:h-[26rem] sm:w-[26rem] lg:h-[30rem] lg:w-[30rem]"
      />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-4 text-[#25321F] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* floating, structured product header */}
        <header className="sticky top-4 z-30 mb-4">
          <div className="flex items-center justify-between gap-4 rounded-full border border-[#EFEAD9]/80 bg-white/85 px-4 py-2.5 shadow-[0_14px_34px_rgba(85,117,54,0.1)] backdrop-blur-md sm:px-6 sm:py-3">
            <Link href="/" className="flex items-center gap-3">
              <SmilingAvocado className="h-11 w-11" imgClassName="h-20 w-20 max-w-none translate-y-1" />
              <span className="flex flex-col leading-none">
                <span className="text-[1rem] font-extrabold tracking-tight">
                  سلامت هوشمند
                </span>
                <span className="mt-1 text-[0.66rem] font-medium text-[#8A9A78]">
                  سلامت و تغذیه، فارسی
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              <a
                href="#features"
                className="rounded-full px-4 py-2 text-[0.85rem] font-bold text-[#557536] transition hover:bg-[#EAF7C7]/70"
              >
                امکانات
              </a>
              <a
                href="#about"
                className="rounded-full px-4 py-2 text-[0.85rem] font-bold text-[#6B7A5A] transition hover:bg-[#EAF7C7]/70"
              >
                درباره ما
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden rounded-full px-4 py-2 text-[0.85rem] font-bold text-[#557536] transition hover:bg-[#EAF7C7]/60 sm:inline-flex"
              >
                ورود
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-[#D4F24E] px-5 py-2.5 text-[0.85rem] font-extrabold text-[#25321F] shadow-[0_10px_22px_rgba(212,242,78,0.38)] transition hover:-translate-y-0.5 hover:bg-[#CFE84E] focus:outline-none focus:ring-4 focus:ring-[#EAF7C7]"
              >
                شروع کنید
              </Link>
            </div>
          </div>
        </header>

        <section className="grid items-center gap-12 py-6 lg:grid-cols-[1fr_1.1fr] lg:gap-12 lg:py-10">
          <div className="max-w-xl lg:pl-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF7C7] px-3.5 py-1.5 text-[0.72rem] font-extrabold text-[#557536]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#86B93B]" />
              پلتفرم فارسی سلامت و تغذیه
            </span>

            <h1 className="mt-5 text-[2.4rem] font-extrabold leading-[1.18] sm:text-5xl lg:text-[3.25rem]">
              همراه فارسی تو برای
              <span className="mt-1 block text-[#557536]">عادت‌های سالم‌تر</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-8 text-[#5F6F55] sm:text-lg">
              یه فضای آرام برای ثبت غذا، پیگیری مسیر سلامتی و ساختن عادت‌های بهتر —
              ساده، فارسی و راست‌چین.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="rounded-full bg-[#D4F24E] px-7 py-3.5 text-center text-base font-extrabold text-[#25321F] shadow-[0_18px_34px_rgba(212,242,78,0.42)] transition hover:-translate-y-0.5 hover:bg-[#CFE84E] focus:outline-none focus:ring-4 focus:ring-[#EAF7C7]"
              >
                ورود با شماره موبایل
              </Link>
              <span className="text-center text-[0.78rem] font-medium text-[#8A9A78]">
                نسخه اولیه • بدون داده نمایشی
              </span>
            </div>
          </div>

          <HeroScene />
        </section>

        <section id="features" className="py-10">
          <div className="mb-7 max-w-md">
            <p className="text-[0.72rem] font-extrabold tracking-wide text-[#86B93B]">
              همین الان فعال
            </p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              چه چیزی آماده است
            </h2>
            <p className="mt-2 text-[0.9rem] leading-7 text-[#5F6F55]">
              بر پایه حساب کاربری واقعی ساخته شده؛ قابلیت‌های بیشتر به‌زودی اضافه
              می‌شن.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <FeatureCard
              image="/brand-assets/avocado-half.png"
              alt="نیمه آووکادو"
              title="حساب کاربری آماده است"
              tint="bg-gradient-to-br from-[#FFF6E8] to-[#FFC69A]/40"
              status="active"
            >
              ورود با شماره موبایل، نشست و خروج همین الان فعالن.
            </FeatureCard>
            <FeatureCard
              image="/brand-assets/eafy-greens-cluster.png"
              alt="سبزیجات leafy"
              title="تجربه فارسی و راست‌چین"
              tint="bg-gradient-to-br from-[#EAF7C7] to-[#D4F24E]/40"
              status="active"
            >
              کل رابط فارسی و راست‌چینه؛ راحت و آشنا برای تو.
            </FeatureCard>
            <FeatureCard
              image="/brand-assets/sprout-stage-4.png"
              alt="جوانه"
              title="امکانات تغذیه و سلامت به‌زودی"
              tint="bg-gradient-to-br from-[#FFF6E8] to-[#FFB24D]/30"
              status="soon"
            >
              ثبت غذا، مسیر رشد و همراهی هوشمند در راهن.
            </FeatureCard>
          </div>
        </section>

        <section id="about" className="py-10">
          <div className="overflow-hidden rounded-[2rem] border border-[#EFEAD9] bg-gradient-to-b from-[#EAF7C7]/70 to-[#FFF6E8]/60 p-8 shadow-[0_18px_50px_rgba(85,117,54,0.08)] sm:p-10">
            <div className="grid items-center gap-8 sm:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 className="text-2xl font-extrabold leading-tight sm:text-3xl">
                  ساخته‌شده برای آرامش و واقعیت
                </h2>
                <p className="mt-3 max-w-xl text-[0.9rem] leading-8 text-[#5F6F55]">
                  اینجا جای تبلیغات کالری‌های جعلی یا نمودارهای دروغ نیست. یه محیط
                  ساده و قابل اعتماد برای همین حالا — با حساب کاربری واقعی و
                  امکاناتی که گام‌به‌گام اضافه می‌شن.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[0.72rem] font-bold text-[#557536] ring-1 ring-white/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#86B93B]" />
                    بدون داده نمایشی
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[0.72rem] font-bold text-[#557536] ring-1 ring-white/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#86B93B]" />
                    فارسی و راست‌چین
                  </span>
                </div>
              </div>
              <div className="relative mx-auto flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#D4F24E]/40 to-[#FFF6E8]" />
                <img
                  src="/brand-assets/avocado-half.png"
                  alt=""
                  className="relative h-28 w-28 object-contain drop-shadow-[0_10px_18px_rgba(85,117,54,0.18)] sm:h-32 sm:w-32"
                />
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-[#EFEAD9] py-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <SmilingAvocado className="h-6 w-6" imgClassName="h-[1rem] w-[1rem]" />
            <span className="text-[0.78rem] font-bold text-[#557536]">
              سلامت هوشمند
            </span>
          </div>
          <p className="text-[0.7rem] text-[#8A9A78]">نسخه اولیه • در حال ساخت</p>
        </footer>
      </div>
    </main>
  );
}
