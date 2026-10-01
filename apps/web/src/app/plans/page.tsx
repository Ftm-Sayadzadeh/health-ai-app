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
      <section className="card-tint p-4 sm:p-5">
        <span className="chip chip-green">فضای برنامه‌های تو</span>
        <h1 className="mt-2 text-xl font-bold leading-tight sm:text-2xl">برنامه‌ها رو یک‌جا نگه دار</h1>
        <p className="mt-1.5 max-w-2xl text-[0.82rem] leading-6 text-[var(--text-muted)]">
          اینجا فقط برنامه‌ها و یادداشت‌هایی که خودت وارد می‌کنی نگهداری می‌شن. ساخت خودکار برنامه هنوز فعال نیست.
        </p>
      </section>

      {access.error ? <p role="alert" className="notice notice-error mt-4">{access.error}</p> : null}

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
    <section className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border-soft)] pb-4">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${isNutrition ? "bg-[var(--brand-avocado-soft)] text-[var(--brand-green)]" : "bg-[#fbf0e0] text-[#8a5a32]"}`}
            aria-hidden="true"
          >
            {isNutrition ? "ن" : "ت"}
          </span>
          <div>
            <h2 className="text-base font-bold sm:text-lg">{title}</h2>
            <p className="mt-1 text-xs leading-6 text-[var(--text-muted)]">{isNutrition ? "یادداشت برنامه‌ای که از متخصص خودت گرفتی" : "برنامه تمرینی ساده‌ای که خودت ثبت کردی"}</p>
          </div>
        </div>
        <span className={`chip shrink-0 ${intake?.completed ? "chip-green" : intake ? "chip-neutral" : "chip-neutral"}`}>
          {intake?.completed ? "پرسشنامه تکمیل" : intake ? "پرسشنامه ناقص" : "وضعیت نامشخص"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {activePlans.length ? activePlans.map((plan) => <PlanCard key={plan.id} plan={plan} />) : (
          <div className="rounded-xl border border-dashed border-[var(--border-lime)] bg-[var(--surface-soft)] p-4 text-center">
            <p className="font-bold">هنوز برنامه‌ای ثبت نشده</p>
            <p className="mt-1 text-xs leading-6 text-[var(--text-muted)]">{isNutrition ? "فقط یادداشت‌های برنامه متخصص خودت رو ثبت کن." : "برنامه‌ای که خودت دنبال می‌کنی رو به شکل یادداشت نگه دار."}</p>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <Link href={`/plans/new?type=${type}`} className="btn btn-primary">
          ثبت برنامه
        </Link>
        {intake && !intake.completed ? <Link href={`/plans/intake/${type}`} className="btn btn-secondary btn-sm">تکمیل پرسشنامه {isNutrition ? "تغذیه" : "تمرین"}</Link> : null}
      </div>

      {archivedPlans.length ? (
        <details className="mt-5 border-t border-[var(--border-soft)] pt-4">
          <summary className="cursor-pointer text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-strong)]">برنامه‌های بایگانی‌شده</summary>
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
    <article className={`rounded-xl border p-3.5 transition ${plan.status === "archived" ? "border-[var(--border-soft)] bg-[var(--surface-muted)] opacity-80" : "border-[var(--border-lime)] bg-[var(--brand-avocado-softer)]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-bold">{plan.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.68rem] text-[var(--text-muted)]">
            <span>{sourceLabels[plan.source]}</span>
            {plan.external_provider_name ? <><span aria-hidden="true">•</span><span className="max-w-36 truncate">{plan.external_provider_name}</span></> : null}
          </div>
        </div>
        <span className="chip chip-neutral shrink-0">{plan.status === "active" ? "فعال" : plan.status === "draft" ? "پیش‌نویس" : "بایگانی"}</span>
      </div>
      {(start || end) ? <p className="mt-3 text-[0.7rem] leading-6 text-[var(--text-muted)]">{start ? `از ${start}` : ""}{start && end ? " تا " : ""}{end ? end : ""}</p> : null}
      {plan.attachment ? <div className="mt-2 flex min-w-0 items-center gap-2"><span className="chip chip-neutral shrink-0">{formatFileType(plan.attachment.content_type)} • {formatFileSize(plan.attachment.size)}</span><span className="min-w-0 truncate text-[0.65rem] text-[var(--text-subtle)]" title={plan.attachment.original_name}>{plan.attachment.original_name}</span></div> : null}
      <div className="mt-3 flex items-center justify-between border-t border-[var(--border-soft)] pt-3">
        <span className="text-[0.65rem] text-[var(--text-subtle)]">به‌روزرسانی {formatUpdatedAt(plan.updated_at)}</span>
        <Link href={`/plans/${plan.id}`} className="btn btn-ghost btn-sm">مشاهده و ویرایش</Link>
      </div>
    </article>
  );
}
