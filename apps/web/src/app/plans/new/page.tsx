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
        <div className="mb-3 flex items-center justify-between gap-3 rounded-[1.2rem] border border-[#EFEAD9] bg-white px-4 py-2.5 shadow-[0_8px_22px_rgba(85,117,54,0.05)]"><div className="min-w-0"><p className="text-[0.68rem] font-extrabold text-[#86B93B]">ثبت برنامه</p><h1 className="mt-0.5 truncate text-lg font-extrabold sm:text-xl">{planType ? (planType === "nutrition" ? "افزودن برنامه متخصص" : "افزودن برنامه تمرینی") : "چه برنامه‌ای داری؟"}</h1></div><Link href="/plans" className="shrink-0 rounded-full border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-2 text-xs font-extrabold text-[#557536]">بازگشت</Link></div>
        {access.error ? <p role="alert" className="rounded-2xl bg-[#FFF6E8] p-4 text-sm text-[#7A3A27]">{access.error}</p> : null}
        {!planType ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <button type="button" onClick={() => setPlanType("nutrition")} className="rounded-[1.5rem] border border-[#DCE9B0] bg-white p-5 text-right shadow-[0_14px_32px_rgba(85,117,54,0.06)] hover:bg-[#F4FBE3]"><span className="text-lg font-extrabold">برنامه تغذیه</span><span className="mt-1 block text-sm leading-7 text-[#6B7A5A]">یادداشت برنامه‌ای که از متخصص خودت گرفتی</span></button>
            <button type="button" onClick={() => setPlanType("workout")} className="rounded-[1.5rem] border border-[#F5D5C9] bg-white p-5 text-right shadow-[0_14px_32px_rgba(85,117,54,0.06)] hover:bg-[#FFF6E8]"><span className="text-lg font-extrabold">برنامه تمرین</span><span className="mt-1 block text-sm leading-7 text-[#6B7A5A]">یادداشت برنامه تمرینی ساده‌ای که خودت دنبال می‌کنی</span></button>
          </div>
        ) : <PlanForm planType={planType} value={value} onChange={setValue} submitLabel="ذخیره برنامه" isSaving={isSaving} error={error} onSubmit={save} />}
      </div>
    </PlansPageShell>
  );
}
