"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { getProgramIntakeStatus, ProgramIntakeStatus } from "@/lib/program-intakes";

import { IntakePage, LoadingCard, useIntakeAccess } from "./_components/intake-ui";

export default function ProgramIntakeHubPage() {
  const [status, setStatus] = useState<ProgramIntakeStatus | null>(null);
  const loadStatus = useCallback(async () => setStatus(await getProgramIntakeStatus()), []);
  const access = useIntakeAccess(loadStatus);

  if (access.isLoading) return <IntakePage><LoadingCard /></IntakePage>;

  const cards = [
    {
      key: "nutrition" as const,
      href: "/plans/intake/nutrition",
      title: "پرسشنامه تغذیه",
      description: "ترجیحات غذایی، زمان آشپزی و سبک معمول غذا خوردنت رو ثبت کن.",
      highlights: ["الگوی وعده‌ها", "آشپزی و بودجه", "سلیقه غذایی"],
      badge: "ن",
      accent: "bg-[var(--brand-avocado-soft)] text-[var(--brand-green)]",
    },
    {
      key: "workout" as const,
      href: "/plans/intake/workout",
      title: "پرسشنامه تمرین",
      description: "محل تمرین، زمان در دسترس و ترجیحات ورزشی‌ات رو مشخص کن.",
      highlights: ["زمان و مکان", "تجربه و شدت", "تجهیزات و سلیقه"],
      badge: "ت",
      accent: "bg-[#fbf0e0] text-[#8a5a32]",
    },
  ];

  return (
    <IntakePage>
      <section className="card-tint p-5 sm:p-6">
        <span className="chip chip-green">اختیاری و مستقل</span>
        <h1 className="mt-3 max-w-xl text-2xl font-bold leading-tight">پرسشنامه برنامه شخصی</h1>
        <p className="mt-2 max-w-xl text-[0.85rem] leading-7 text-[var(--text-muted)]">
          تغذیه یا تمرین رو جداگانه کامل کن. فعلا فقط پاسخ‌ها ذخیره می‌شن.
        </p>
      </section>

      {access.error ? <p role="alert" className="notice notice-error mt-4">{access.error}</p> : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const completed = status?.[card.key].completed ?? false;
          return (
            <article key={card.key} className="card flex flex-col p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <span className={`chip ${completed ? "chip-green" : "chip-neutral"}`}>
                  {completed ? "تکمیل شده" : "نیاز به تکمیل"}
                </span>
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg text-base font-bold ${card.accent}`} aria-hidden="true">
                  {card.badge}
                </span>
              </div>
              <h2 className="mt-5 text-lg font-bold">{card.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{card.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {card.highlights.map((highlight) => <span key={highlight} className="chip chip-neutral">{highlight}</span>)}
              </div>
              <Link href={card.href} className="btn btn-primary mt-6 w-full">
                {completed ? "مشاهده و ویرایش" : "شروع پرسشنامه"}
              </Link>
            </article>
          );
        })}
      </div>
    </IntakePage>
  );
}
