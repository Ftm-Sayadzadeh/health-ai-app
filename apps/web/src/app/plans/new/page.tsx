"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { ApiError } from "@/lib/api-client";
import { createPlan, formatPlanApiError, PlanType } from "@/lib/plans";
import { logout } from "@/lib/auth";

import { PlanForm, PlanFormValue } from "../_components/plan-form";
import { PlansLoading, PlansPageShell, usePlansAccess } from "../_components/plans-ui";

const emptyValue: PlanFormValue = { title: "", notes: "", external_provider_name: "", starts_on: null, ends_on: null, attachment: null, remove_attachment: false };

export default function NewPlanPage() {
  return <Suspense fallback={<PlansPageShell><PlansLoading /></PlansPageShell>}><NewPlanContent /></Suspense>;
}

function NewPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedType = searchParams.get("type");
  const [planType, setPlanType] = useState<PlanType | null>(requestedType === "nutrition" || requestedType === "workout" ? requestedType : null);
  const [value, setValue] = useState<PlanFormValue>(emptyValue);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const access = usePlansAccess();

  async function save() {
    if (!planType) return;
    setIsSaving(true);
    setError(null);
    try {
      const plan = await createPlan({
        title: value.title,
        notes: value.notes,
        starts_on: value.starts_on,
        ends_on: value.ends_on,
        attachment: value.attachment,
        plan_type: planType,
        source: planType === "nutrition" ? "external_specialist" : "self",
        external_provider_name: planType === "nutrition" ? value.external_provider_name : "",
      });
      router.replace(`/plans/${plan.id}`);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError(formatPlanApiError(caught));
      setIsSaving(false);
    }
  }

  if (access.isLoading) return <PlansPageShell><PlansLoading /></PlansPageShell>;

  return (
    <PlansPageShell>
      <div>
        <div className="card mb-3 flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold text-[var(--brand-green)]">ثبت برنامه</p>
            <h1 className="mt-0.5 truncate text-lg font-bold sm:text-xl">{planType ? (planType === "nutrition" ? "افزودن برنامه متخصص" : "افزودن برنامه تمرینی") : "چه برنامه‌ای داری؟"}</h1>
          </div>
          <Link href="/plans" className="btn btn-secondary btn-sm shrink-0">بازگشت</Link>
        </div>
        {access.error ? <p role="alert" className="notice notice-error">{access.error}</p> : null}
        {!planType ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <button type="button" onClick={() => setPlanType("nutrition")} className="card flex items-start gap-3 p-5 text-right transition hover:border-[var(--border-lime)] hover:bg-[var(--brand-avocado-soft)]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-avocado-soft)] text-base font-bold text-[var(--brand-green)]" aria-hidden="true">ن</span>
              <span><span className="block text-base font-bold">برنامه تغذیه</span><span className="mt-1 block text-sm leading-7 text-[var(--text-muted)]">یادداشت برنامه‌ای که از متخصص خودت گرفتی</span></span>
            </button>
            <button type="button" onClick={() => setPlanType("workout")} className="card flex items-start gap-3 p-5 text-right transition hover:border-[#ecdcb6] hover:bg-[#fbf0e0]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fbf0e0] text-base font-bold text-[#8a5a32]" aria-hidden="true">ت</span>
              <span><span className="block text-base font-bold">برنامه تمرین</span><span className="mt-1 block text-sm leading-7 text-[var(--text-muted)]">یادداشت برنامه تمرینی ساده‌ای که خودت دنبال می‌کنی</span></span>
            </button>
          </div>
        ) : (
          <PlanForm planType={planType} value={value} onChange={setValue} submitLabel="ذخیره برنامه" isSaving={isSaving} error={error} onSubmit={save} />
        )}
      </div>
    </PlansPageShell>
  );
}
