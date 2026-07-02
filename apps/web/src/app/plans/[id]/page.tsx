"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { ApiError } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import { downloadPlanAttachment, formatPlanApiError, getPlan, Plan, updatePlan } from "@/lib/plans";

import { PlanForm, PlanFormValue } from "../_components/plan-form";
import { PlansLoading, PlansPageShell, usePlansAccess } from "../_components/plans-ui";

export default function PlanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const planId = Number(params.id);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [value, setValue] = useState<PlanFormValue | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmingLifecycle, setConfirmingLifecycle] = useState(false);
  const load = useCallback(async () => {
    if (!Number.isInteger(planId) || planId < 1) throw new Error("شناسه برنامه معتبر نیست.");
    const response = await getPlan(planId);
    setPlan(response);
    setValue({ title: response.title, notes: response.notes, external_provider_name: response.external_provider_name, starts_on: response.starts_on, ends_on: response.ends_on, attachment: null, remove_attachment: false });
  }, [planId]);
  const access = usePlansAccess(load);

  async function downloadAttachment() {
    if (!plan?.attachment) return;
    setError(null);
    try {
      await downloadPlanAttachment(plan.attachment);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError("دریافت فایل ممکن نشد. دوباره تلاش کن.");
    }
  }

  async function persist(status: "active" | "archived") {
    if (!plan || !value) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updatePlan(plan.id, { ...value, status });
      setPlan(updated);
      setValue({ title: updated.title, notes: updated.notes, external_provider_name: updated.external_provider_name, starts_on: updated.starts_on, ends_on: updated.ends_on, attachment: null, remove_attachment: false });
      setSuccess(status === "archived" ? "برنامه بایگانی شد." : status !== plan.status ? "برنامه دوباره فعال شد." : "تغییرات برنامه ذخیره شد.");
      setConfirmingLifecycle(false);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError(formatPlanApiError(caught));
    } finally {
      setIsSaving(false);
    }
  }

  if (access.isLoading) return <PlansPageShell><PlansLoading /></PlansPageShell>;

  return (
    <PlansPageShell>
      <div>
        <div className="mb-3 flex items-center justify-between gap-3 rounded-[1.2rem] border border-[#EFEAD9] bg-white px-4 py-2.5 shadow-[0_8px_22px_rgba(85,117,54,0.05)]"><div className="min-w-0"><p className="text-[0.68rem] font-extrabold text-[#86B93B]">جزئیات برنامه</p><h1 className="mt-0.5 truncate text-lg font-extrabold sm:text-xl">{plan?.title ?? "برنامه"}</h1></div><Link href="/plans" className="shrink-0 rounded-full border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-2 text-xs font-extrabold text-[#557536]">بازگشت</Link></div>
        {access.error ? <p role="alert" className="rounded-2xl border border-[#F5D5C9] bg-[#FFF6E8] p-4 text-sm text-[#7A3A27]">{access.error}</p> : null}
        {plan && value ? (
          <PlanForm
            planType={plan.plan_type}
            value={value}
            existingAttachment={plan.attachment}
            onChange={setValue}
            submitLabel="ذخیره تغییرات"
            isSaving={isSaving}
            error={error}
            success={success}
            onSubmit={() => persist(plan.status === "archived" ? "archived" : "active")}
            onDownload={plan.attachment ? downloadAttachment : undefined}
            statusPanel={
              <section className="rounded-[1.4rem] border border-[#E9E5DC] bg-white p-4 shadow-[0_10px_24px_rgba(85,117,54,0.04)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2"><h2 className="text-sm font-extrabold">وضعیت برنامه</h2><span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-extrabold ${plan.status === "archived" ? "bg-[#F4F1E9] text-[#77736B]" : "bg-[#EAF7C7] text-[#557536]"}`}>{plan.status === "archived" ? "بایگانی" : "فعال"}</span></div>
                    <p className="mt-1 text-xs leading-6 text-[#6B7A5A]">بایگانی برنامه رو حذف نمی‌کنه؛ فقط از فهرست فعال کنار می‌ذاره.</p>
                  </div>
                  {!confirmingLifecycle ? <button type="button" onClick={() => setConfirmingLifecycle(true)} className="shrink-0 rounded-full border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-2 text-xs font-extrabold text-[#6B7A5A]">{plan.status === "archived" ? "فعال‌کردن دوباره" : "بایگانی برنامه"}</button> : null}
                </div>
                {confirmingLifecycle ? <div className="mt-3 flex flex-col gap-3 rounded-xl bg-[#FFF6E8] p-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-bold">{plan.status === "archived" ? "این برنامه دوباره فعال بشه؟" : "این برنامه بایگانی بشه؟"}</p><div className="flex gap-2"><button type="button" disabled={isSaving} onClick={() => persist(plan.status === "archived" ? "active" : "archived")} className="rounded-full bg-[#D4F24E] px-4 py-2 text-xs font-extrabold">تایید</button><button type="button" onClick={() => setConfirmingLifecycle(false)} className="rounded-full border border-[#E9E5DC] bg-white px-4 py-2 text-xs font-bold">انصراف</button></div></div> : null}
              </section>
            }
          />
        ) : null}
      </div>
    </PlansPageShell>
  );
}
