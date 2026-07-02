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
      accent: "bg-[#EAF7C7] text-[#557536]",
    },
    {
      key: "workout" as const,
      href: "/plans/intake/workout",
      title: "پرسشنامه تمرین",
      description: "محل تمرین، زمان در دسترس و ترجیحات ورزشی‌ات رو مشخص کن.",
      highlights: ["زمان و مکان", "تجربه و شدت", "تجهیزات و سلیقه"],
      accent: "bg-[#FFF6E8] text-[#7A3A27]",
    },
  ];

  return (
    <IntakePage>
      <section className="relative overflow-hidden rounded-[2rem] border border-[#EFEAD9] bg-gradient-to-bl from-[#EAF7C7] via-white to-[#FFF6E8] p-6 shadow-[0_24px_60px_rgba(85,117,54,0.08)] sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand-assets/avocado-half.png" alt="" className="pointer-events-none absolute -left-3 -top-5 h-28 w-28 object-contain opacity-15 sm:h-36 sm:w-36" />
        <span className="inline-flex rounded-full bg-white/80 px-3 py-1.5 text-xs font-extrabold text-[#557536]">اختیاری و مستقل</span>
        <h1 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight sm:text-[2.2rem]">پرسشنامه برنامه شخصی</h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[#5F6F55] sm:text-base">
          تغذیه یا تمرین رو جداگانه کامل کن. فعلا فقط پاسخ‌ها ذخیره می‌شن.
        </p>
      </section>

      {access.error ? <p role="alert" className="mt-5 rounded-2xl border border-[#F5D5C9] bg-[#FFF6E8] p-4 text-sm text-[#7A3A27]">{access.error}</p> : null}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {cards.map((card) => {
          const completed = status?.[card.key].completed ?? false;
          return (
            <article key={card.key} className="flex flex-col rounded-[1.75rem] border border-[#EFEAD9] bg-white p-5 shadow-[0_18px_45px_rgba(85,117,54,0.07)] sm:rounded-[2rem] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${completed ? "bg-[#EAF7C7] text-[#557536]" : "bg-[#F4F1E9] text-[#77736B]"}`}>
                  {completed ? "تکمیل شده" : "نیاز به تکمیل"}
                </span>
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-extrabold ${card.accent}`} aria-hidden="true">
                  {card.key === "nutrition" ? "ن" : "ت"}
                </span>
              </div>
              <h2 className="mt-7 text-xl font-extrabold">{card.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[#6B7A5A]">{card.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {card.highlights.map((highlight) => <span key={highlight} className="rounded-full bg-[#F7F5EF] px-3 py-1.5 text-[0.7rem] font-bold text-[#6B7A5A]">{highlight}</span>)}
              </div>
              <Link href={card.href} className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#D4F24E] px-5 py-3 text-sm font-extrabold text-[#25321F] shadow-[0_10px_22px_rgba(212,242,78,0.24)] transition hover:bg-[#CFE84E] focus:outline-none focus:ring-4 focus:ring-[#EAF7C7]">
                {completed ? "مشاهده و ویرایش" : "شروع پرسشنامه"}
              </Link>
            </article>
          );
        })}
      </div>
    </IntakePage>
  );
}
