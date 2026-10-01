"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { ApiError } from "@/lib/api-client";
import { logout } from "@/lib/auth";
import { downloadPlanAttachment, formatPlanApiError, getPlan, Plan, updatePlan } from "@/lib/plans";
import { getNutritionPlanStructure, NutritionPlanStructure } from "@/lib/structured-nutrition-plan";

import { NutritionStructureSection } from "../_components/nutrition-structure";
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
  const [nutritionStructure, setNutritionStructure] = useState<NutritionPlanStructure | null>(null);
  const [structureError, setStructureError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!Number.isInteger(planId) || planId < 1) throw new Error("شناسه برنامه معتبر نیست.");
    const response = await getPlan(planId);
    setPlan(response);
    setValue({ title: response.title, notes: response.notes, external_provider_name: response.external_provider_name, starts_on: response.starts_on, ends_on: response.ends_on, attachment: null, remove_attachment: false });
    setNutritionStructure(null);
    setStructureError(null);
    if (response.plan_type === "nutrition") {
      try {
        setNutritionStructure(await getNutritionPlanStructure(response.id));
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 401) throw caught;
        setStructureError("دریافت وعده‌های برنامه ممکن نشد. دوباره تلاش کن.");
      }
    }
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
      if (updated.plan_type === "nutrition") {
        try {
          setNutritionStructure(await getNutritionPlanStructure(updated.id));
          setStructureError(null);
        } catch (caught) {
          if (caught instanceof ApiError && caught.status === 401) throw caught;
          setStructureError("برنامه ذخیره شد، اما تازه‌سازی وعده‌ها ممکن نشد.");
        }
      }
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
        <div className="card mb-3 flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold text-[var(--brand-green)]">جزئیات برنامه</p>
            <h1 className="mt-0.5 truncate text-lg font-bold sm:text-xl">{plan?.title ?? "برنامه"}</h1>
          </div>
          <Link href="/plans" className="btn btn-secondary btn-sm shrink-0">بازگشت</Link>
        </div>
        {access.error ? <p role="alert" className="notice notice-error">{access.error}</p> : null}
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
              <section className="card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold">وضعیت برنامه</h2>
                      <span className={`chip ${plan.status === "archived" ? "chip-neutral" : "chip-green"}`}>{plan.status === "archived" ? "بایگانی" : "فعال"}</span>
                    </div>
                    <p className="mt-1 text-xs leading-6 text-[var(--text-muted)]">بایگانی برنامه رو حذف نمی‌کنه؛ فقط از فهرست فعال کنار می‌ذاره.</p>
                  </div>
                  {!confirmingLifecycle ? <button type="button" onClick={() => setConfirmingLifecycle(true)} className="btn btn-secondary btn-sm shrink-0">{plan.status === "archived" ? "فعال‌کردن دوباره" : "بایگانی برنامه"}</button> : null}
                </div>
                {confirmingLifecycle ? (
                  <div className="mt-3 flex flex-col gap-3 rounded-lg bg-[var(--danger-soft)] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-bold">{plan.status === "archived" ? "این برنامه دوباره فعال بشه؟" : "این برنامه بایگانی بشه؟"}</p>
                    <div className="flex gap-2">
                      <button type="button" disabled={isSaving} onClick={() => persist(plan.status === "archived" ? "active" : "archived")} className="btn btn-primary btn-sm">تایید</button>
                      <button type="button" onClick={() => setConfirmingLifecycle(false)} className="btn btn-secondary btn-sm">انصراف</button>
                    </div>
                  </div>
                ) : null}
              </section>
            }
          />
        ) : null}
        {structureError ? <p role="alert" className="notice notice-error mt-4">{structureError}</p> : null}
        {plan?.plan_type === "nutrition" && nutritionStructure ? <NutritionStructureSection structure={nutritionStructure} onChange={setNutritionStructure} /> : null}
      </div>
    </PlansPageShell>
  );
}
