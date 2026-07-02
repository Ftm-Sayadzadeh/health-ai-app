"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { ApiError } from "@/lib/api-client";
import { getPlans, Plan, PlanType } from "@/lib/plans";
import { getProgramIntakeStatus, ProgramIntakeStatus } from "@/lib/program-intakes";

import { formatFileSize, formatFileType, formatPlanDate, formatUpdatedAt, PlansLoading, PlansPageShell, usePlansAccess } from "./_components/plans-ui";

const sourceLabels: Record<Plan["source"], string> = {
  self: "ثبت شخصی",
  coach: "مربی",
  admin: "مدیر",
  external_specialist: "متخصص بیرون از اپ",
  system_future: "سامانه",
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [intakeStatus, setIntakeStatus] = useState<ProgramIntakeStatus | null>(null);
  const load = useCallback(async () => {
    const response = await getPlans();
    setPlans(response.results);
    try {
      setIntakeStatus(await getProgramIntakeStatus());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) throw error;
      setIntakeStatus(null);
    }
  }, []);
  const access = usePlansAccess(load);

  if (access.isLoading) return <PlansPageShell><PlansLoading /></PlansPageShell>;

  return (
    <PlansPageShell>
      <section className="rounded-[1.75rem] border border-[#EFEAD9] bg-gradient-to-bl from-[#EAF7C7] via-white to-[#FFF6E8] p-5 shadow-[0_20px_48px_rgba(85,117,54,0.07)] sm:p-6">
        <span className="inline-flex rounded-full bg-white/80 px-3 py-1.5 text-xs font-extrabold text-[#557536]">فضای برنامه‌های تو</span>
        <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">برنامه‌ها رو یک‌جا نگه دار</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5F6F55]">
          اینجا فقط برنامه‌ها و یادداشت‌هایی که خودت وارد می‌کنی نگهداری می‌شن. ساخت خودکار برنامه هنوز فعال نیست.
        </p>
      </section>

      {access.error ? <p role="alert" className="mt-5 rounded-2xl border border-[#F5D5C9] bg-[#FFF6E8] p-4 text-sm text-[#7A3A27]">{access.error}</p> : null}

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <PlanSection type="nutrition" title="برنامه‌های تغذیه" plans={plans.filter((plan) => plan.plan_type === "nutrition")} intake={intakeStatus?.nutrition ?? null} />
        <PlanSection type="workout" title="برنامه‌های تمرین" plans={plans.filter((plan) => plan.plan_type === "workout")} intake={intakeStatus?.workout ?? null} />
      </div>
    </PlansPageShell>
  );
}

function PlanSection({ type, title, plans, intake }: { type: PlanType; title: string; plans: Plan[]; intake: ProgramIntakeStatus["nutrition"] | null }) {
  const activePlans = plans.filter((plan) => plan.status !== "archived");
  const archivedPlans = plans.filter((plan) => plan.status === "archived");
  const isNutrition = type === "nutrition";

  return (
    <section className="rounded-[1.75rem] border border-[#EFEAD9] bg-white p-4 shadow-[0_16px_38px_rgba(85,117,54,0.06)] sm:p-5">
      <div className="flex items-start justify-between gap-3 border-b border-[#EFEAD9] pb-4">
        <div>
          <h2 className="text-lg font-extrabold sm:text-xl">{title}</h2>
          <p className="mt-1 text-xs leading-6 text-[#6B7A5A]">{isNutrition ? "یادداشت برنامه‌ای که از متخصص خودت گرفتی" : "برنامه تمرینی ساده‌ای که خودت ثبت کردی"}</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-[0.68rem] font-extrabold ${intake?.completed ? "bg-[#EAF7C7] text-[#557536]" : intake ? "bg-[#F4F1E9] text-[#77736B]" : "bg-[#F7F5EF] text-[#8A9A78]"}`}>
          {intake?.completed ? "پرسشنامه تکمیل" : intake ? "پرسشنامه ناقص" : "وضعیت نامشخص"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {activePlans.length ? activePlans.map((plan) => <PlanCard key={plan.id} plan={plan} />) : (
          <div className="rounded-[1.25rem] border border-dashed border-[#DCE9B0] bg-[#FFFDF8] p-4 text-center">
            <p className="font-extrabold">هنوز برنامه‌ای ثبت نشده</p>
            <p className="mt-1 text-xs leading-6 text-[#6B7A5A]">{isNutrition ? "فقط یادداشت‌های برنامه متخصص خودت رو ثبت کن." : "برنامه‌ای که خودت دنبال می‌کنی رو به شکل یادداشت نگه دار."}</p>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <Link href={`/plans/new?type=${type}`} className="inline-flex items-center justify-center rounded-full bg-[#D4F24E] px-5 py-3 text-sm font-extrabold shadow-[0_10px_22px_rgba(212,242,78,0.24)] hover:bg-[#CFE84E]">
          ثبت برنامه
        </Link>
        {intake && !intake.completed ? <Link href={`/plans/intake/${type}`} className="inline-flex items-center justify-center rounded-full border border-[#DCE9B0] bg-[#F4FBE3] px-5 py-2.5 text-xs font-extrabold text-[#557536]">تکمیل پرسشنامه {isNutrition ? "تغذیه" : "تمرین"}</Link> : null}
      </div>

      {archivedPlans.length ? (
        <details className="mt-5 border-t border-[#EFEAD9] pt-4">
          <summary className="cursor-pointer text-xs font-extrabold text-[#6B7A5A]">برنامه‌های بایگانی‌شده</summary>
          <div className="mt-3 space-y-3">{archivedPlans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}</div>
        </details>
      ) : null}
    </section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const start = formatPlanDate(plan.starts_on);
  const end = formatPlanDate(plan.ends_on);
  return (
    <article className={`rounded-[1.2rem] border p-3.5 ${plan.status === "archived" ? "border-[#E9E5DC] bg-[#F7F5EF] opacity-80" : "border-[#DCE9B0] bg-[#F4FBE3]/45"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><h3 className="truncate font-extrabold">{plan.title}</h3><div className="mt-1 flex flex-wrap items-center gap-2 text-[0.68rem] text-[#6B7A5A]"><span>{sourceLabels[plan.source]}</span>{plan.external_provider_name ? <><span aria-hidden="true">•</span><span className="max-w-36 truncate">{plan.external_provider_name}</span></> : null}</div></div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[0.65rem] font-bold text-[#557536]">{plan.status === "active" ? "فعال" : plan.status === "draft" ? "پیش‌نویس" : "بایگانی"}</span>
      </div>
      {(start || end) ? <p className="mt-3 text-[0.7rem] leading-6 text-[#6B7A5A]">{start ? `از ${start}` : ""}{start && end ? " تا " : ""}{end ? end : ""}</p> : null}
      {plan.attachment ? <div className="mt-2 flex min-w-0 items-center gap-2"><span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[0.65rem] font-bold text-[#557536]">{formatFileType(plan.attachment.content_type)} • {formatFileSize(plan.attachment.size)}</span><span className="min-w-0 truncate text-[0.65rem] text-[#8A9A78]" title={plan.attachment.original_name}>{plan.attachment.original_name}</span></div> : null}
      <div className="mt-3 flex items-center justify-between border-t border-[#DCE9B0]/70 pt-3">
        <span className="text-[0.65rem] text-[#8A9A78]">به‌روزرسانی {formatUpdatedAt(plan.updated_at)}</span>
        <Link href={`/plans/${plan.id}`} className="rounded-full bg-white px-3 py-1.5 text-[0.7rem] font-extrabold text-[#557536] shadow-sm">مشاهده و ویرایش</Link>
      </div>
    </article>
  );
}
