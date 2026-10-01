import Link from "next/link";

/* eslint-disable @next/next/no-img-element */

function BrandMark({ size = "h-9 w-9", imgSize = "h-16 w-16" }: { size?: string; imgSize?: string }) {
  return (
    <span className={`app-logo ${size} shrink-0`}>
      <img
        src="/brand-assets/avocado-smiling.png"
        alt=""
        aria-hidden="true"
        className={`${imgSize} max-w-none translate-y-0.5 object-contain`}
      />
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
    <div className="card group p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[var(--border-lime)]">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}>
          <img src={image} alt={alt} className="h-7 w-7 object-contain" />
        </div>
        <span
          className={`chip ${status === "active" ? "chip-green" : "chip-neutral"}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status === "active" ? "bg-[var(--brand-green)]" : "bg-[#c89a4e]"
            }`}
          />
          {status === "active" ? "فعال" : "به‌زودی"}
        </span>
      </div>
      <h3 className="mt-4 text-[0.95rem] font-bold text-[var(--text-strong)]">{title}</h3>
      <p className="mt-2 text-[0.82rem] leading-7 text-[var(--text-muted)]">{children}</p>
    </div>
  );
}

function HeroScene() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[30rem] items-center justify-center">
      {/* soft single ambient tint (replaces heavy layered glows) */}
      <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(199,229,106,0.28),transparent_62%)]" />
      {/* subtle shadow under bowl */}
      <div className="absolute bottom-14 h-4 w-52 rounded-full bg-[#557536]/15 blur-md" />
      {/* the bowl — calm focal point */}
      <img
        src="/brand-assets/healthy-bowl.png"
        alt="کاسه غذای سالم"
        className="animate-floaty relative h-[20rem] w-[20rem] object-contain drop-shadow-[0_18px_28px_rgba(85,117,54,0.18)] sm:h-[24rem] sm:w-[24rem]"
      />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-4 text-[var(--text-strong)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* refined product header */}
        <header className="sticky top-4 z-30 mb-6">
          <div className="app-header">
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark />
              <span className="flex flex-col leading-none">
                <span className="text-[0.95rem] font-bold tracking-tight">
                  سلامت هوشمند
                </span>
                <span className="mt-1 text-[0.66rem] font-medium text-[var(--text-subtle)]">
                  سلامت و تغذیه، فارسی
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              <a
                href="#features"
                className="rounded-full px-3.5 py-2 text-[0.82rem] font-bold text-[var(--brand-green)] transition hover:bg-[var(--brand-avocado-soft)]"
              >
                امکانات
              </a>
              <a
                href="#about"
                className="rounded-full px-3.5 py-2 text-[0.82rem] font-bold text-[var(--text-muted)] transition hover:bg-[var(--brand-avocado-soft)]"
              >
                درباره ما
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="btn btn-ghost btn-sm hidden sm:inline-flex"
              >
                ورود
              </Link>
              <Link href="/login" className="btn btn-primary btn-sm">
                شروع کنید
              </Link>
            </div>
          </div>
        </header>

        <section className="grid items-center gap-10 py-4 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:py-8">
          <div className="max-w-xl lg:pl-4">
            <span className="chip chip-green">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-green)]" />
              پلتفرم فارسی سلامت و تغذیه
            </span>

            <h1 className="mt-4 text-[2rem] font-bold leading-[1.22] sm:text-[2.4rem] lg:text-[2.6rem]">
              همراه فارسی تو برای
              <span className="mt-1 block text-[var(--brand-green)]">عادت‌های سالم‌تر</span>
            </h1>

            <p className="mt-4 max-w-lg text-[0.95rem] leading-8 text-[var(--text-muted)] sm:text-base">
              یه فضای آرام برای ثبت غذا، پیگیری مسیر سلامتی و ساختن عادت‌های بهتر —
              ساده، فارسی و راست‌چین.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/login" className="btn btn-primary px-7 py-3 text-base">
                ورود با شماره موبایل
              </Link>
              <span className="text-center text-[0.78rem] font-medium text-[var(--text-subtle)]">
                نسخه اولیه • بدون داده نمایشی
              </span>
            </div>
          </div>

          <HeroScene />
        </section>

        <section id="features" className="py-8">
          <div className="mb-6 max-w-md">
            <p className="text-[0.72rem] font-bold tracking-wide text-[var(--brand-green)]">
              همین الان فعال
            </p>
            <h2 className="mt-2 text-[1.5rem] font-bold sm:text-[1.75rem]">
              چه چیزی آماده است
            </h2>
            <p className="mt-2 text-[0.88rem] leading-7 text-[var(--text-muted)]">
              بر پایه حساب کاربری واقعی ساخته شده؛ قابلیت‌های بیشتر به‌زودی اضافه
              می‌شن.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard
              image="/brand-assets/avocado-half.png"
              alt="نیمه آووکادو"
              title="حساب کاربری آماده است"
              tint="bg-[#fbf0e0]"
              status="active"
            >
              ورود با شماره موبایل، نشست و خروج همین الان فعالن.
            </FeatureCard>
            <FeatureCard
              image="/brand-assets/eafy-greens-cluster.png"
              alt="سبزیجات leafy"
              title="تجربه فارسی و راست‌چین"
              tint="bg-[var(--brand-avocado-soft)]"
              status="active"
            >
              کل رابط فارسی و راست‌چینه؛ راحت و آشنا برای تو.
            </FeatureCard>
            <FeatureCard
              image="/brand-assets/sprout-stage-4.png"
              alt="جوانه"
              title="امکانات تغذیه و سلامت به‌زودی"
              tint="bg-[#f6efe0]"
              status="soon"
            >
              ثبت غذا، مسیر رشد و همراهی هوشمند در راهن.
            </FeatureCard>
          </div>
        </section>

        <section id="about" className="py-8">
          <div className="card-tint p-6 sm:p-8">
            <div className="grid items-center gap-8 sm:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 className="text-[1.5rem] font-bold leading-tight sm:text-[1.75rem]">
                  ساخته‌شده برای آرامش و واقعیت
                </h2>
                <p className="mt-3 max-w-xl text-[0.9rem] leading-8 text-[var(--text-muted)]">
                  اینجا جای تبلیغات کالری‌های جعلی یا نمودارهای دروغ نیست. یه محیط
                  ساده و قابل اعتماد برای همین حالا — با حساب کاربری واقعی و
                  امکاناتی که گام‌به‌گام اضافه می‌شه.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="chip chip-green">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-green)]" />
                    بدون داده نمایشی
                  </span>
                  <span className="chip chip-green">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-green)]" />
                    فارسی و راست‌چین
                  </span>
                </div>
              </div>
              <div className="relative mx-auto flex h-32 w-32 items-center justify-center sm:h-36 sm:w-36">
                <div className="absolute inset-0 rounded-full bg-[var(--brand-avocado-soft)]" />
                <img
                  src="/brand-assets/avocado-half.png"
                  alt=""
                  className="relative h-24 w-24 object-contain drop-shadow-[0_8px_14px_rgba(85,117,54,0.16)] sm:h-28 sm:w-28"
                />
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-[var(--border-soft)] py-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <BrandMark size="h-6 w-6" imgSize="h-10 w-10" />
            <span className="text-[0.78rem] font-bold text-[var(--brand-green)]">
              سلامت هوشمند
            </span>
          </div>
          <p className="text-[0.7rem] text-[var(--text-subtle)]">نسخه اولیه • در حال ساخت</p>
        </footer>
      </div>
    </main>
  );
}
