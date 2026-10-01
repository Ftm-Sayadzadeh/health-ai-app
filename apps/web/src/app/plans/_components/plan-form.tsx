"use client";

import { FormEvent, ReactNode, useRef, useState } from "react";

import { PlanAttachment, PlanType, UpdatePlanInput } from "@/lib/plans";
import { formatFileSize, formatFileType } from "./plans-ui";

export type PlanFormValue = Omit<UpdatePlanInput, "status">;

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const maxFileSize = 10 * 1024 * 1024;

export function PlanForm({
  planType,
  value,
  existingAttachment,
  submitLabel,
  isSaving,
  error,
  success,
  onChange,
  onSubmit,
  onDownload,
  statusPanel,
}: {
  planType: PlanType;
  value: PlanFormValue;
  existingAttachment?: PlanAttachment | null;
  submitLabel: string;
  isSaving: boolean;
  error: string | null;
  success?: string | null;
  onChange: (value: PlanFormValue) => void;
  onSubmit: () => Promise<void>;
  onDownload?: () => Promise<void>;
  statusPanel?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const visibleAttachment = value.attachment ?? (!value.remove_attachment ? existingAttachment : null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setValidationError(null);
    if (!value.title.trim()) {
      setValidationError("یک عنوان کوتاه برای برنامه بنویس.");
      return;
    }
    if (!value.notes.trim() && !visibleAttachment) {
      setValidationError("برای برنامه یادداشت بنویس یا یک فایل اضافه کن.");
      return;
    }
    if (value.starts_on && value.ends_on && value.ends_on < value.starts_on) {
      setValidationError("تاریخ پایان نمی‌تونه قبل از تاریخ شروع باشه.");
      return;
    }
    await onSubmit();
  }

  function chooseFile(file: File | undefined) {
    setValidationError(null);
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      setValidationError("فایل باید JPG، PNG، WEBP یا PDF باشه.");
      return;
    }
    if (file.size > maxFileSize) {
      setValidationError("حجم فایل باید حداکثر ۱۰ مگابایت باشه.");
      return;
    }
    onChange({ ...value, attachment: file, remove_attachment: false });
  }

  function removeFile() {
    if (inputRef.current) inputRef.current.value = "";
    onChange({
      ...value,
      attachment: null,
      remove_attachment: Boolean(existingAttachment),
    });
  }

  const attachmentName = visibleAttachment instanceof File ? visibleAttachment.name : visibleAttachment?.original_name;
  const attachmentSize = visibleAttachment instanceof File ? visibleAttachment.size : visibleAttachment?.size;
  const attachmentType = visibleAttachment instanceof File ? visibleAttachment.type : visibleAttachment?.content_type;

  return (
    <form onSubmit={submit} className="space-y-4">
      <section className="card-tint p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="chip chip-green">
              {planType === "nutrition" ? "برنامه متخصص خودت" : "برنامه تمرینی شخصی"}
            </span>
            <h2 className="mt-2 text-sm font-bold leading-6 sm:text-base">{planType === "nutrition" ? "برنامه‌ای که از متخصص خودت گرفتی را اینجا نگهداری کن." : "برنامه تمرینی ساده‌ای که خودت داری را ثبت کن."}</h2>
          </div>
          <span className="text-xs font-bold text-[var(--text-subtle)]">{planType === "nutrition" ? "منبع: متخصص بیرون از اپ" : "منبع: ثبت شخصی"}</span>
        </div>
        <label className="mt-3 block field-label">
          عنوان برنامه
          <input value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} maxLength={120} className="field-input mt-1.5" placeholder={planType === "nutrition" ? "مثلا برنامه متخصص من" : "مثلا برنامه تمرینی هفتگی من"} />
        </label>
      </section>

      <div className="grid items-stretch gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="card flex flex-col p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-avocado-soft)] text-lg font-bold text-[var(--brand-green)]" aria-hidden="true">+</span>
            <h2 className="text-base font-bold">فایل برنامه</h2>
          </div>
          <p className="mt-2 text-xs leading-6 text-[var(--text-muted)]">می‌تونی عکس یا PDF برنامه‌ات رو اضافه کنی. حداکثر حجم فایل ۱۰ مگابایته.</p>
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => chooseFile(event.target.files?.[0])} className="sr-only" />
          {visibleAttachment ? (
            <div className="mt-4 rounded-xl border border-[var(--border-lime)] bg-[var(--brand-avocado-soft)] p-4">
              <p className="text-sm font-bold">فایل برنامه پیوست شد</p>
              <p className="mt-1 text-[0.7rem] font-bold text-[var(--brand-green)]">{formatFileType(attachmentType)} • {formatFileSize(attachmentSize ?? 0)}</p>
              <p className="mt-1 truncate text-[0.65rem] text-[var(--text-subtle)]" title={attachmentName}>{attachmentName}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => inputRef.current?.click()} className="btn btn-secondary btn-sm">جایگزینی فایل</button>
                {onDownload && !(visibleAttachment instanceof File) ? <button type="button" onClick={onDownload} className="btn btn-secondary btn-sm">مشاهده فایل</button> : null}
                <button type="button" onClick={removeFile} className="btn btn-danger btn-sm">حذف فایل</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 flex min-h-32 w-full flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-lime)] bg-[var(--surface-input)] px-4 py-5 text-center transition hover:border-[var(--brand-avocado)] hover:bg-[var(--brand-avocado-soft)]">
              <span className="block text-sm font-bold text-[var(--brand-green)]">انتخاب عکس یا PDF</span>
              <span className="mt-1 block text-[0.68rem] text-[var(--text-subtle)]">JPG، PNG، WEBP، PDF • حداکثر ۱۰ مگابایت</span>
            </button>
          )}
          <button type="button" disabled className="btn btn-secondary mt-4 w-full cursor-not-allowed opacity-70">استخراج متن با هوش مصنوعی — به‌زودی</button>
          <p className="mt-2 text-[0.66rem] leading-5 text-[var(--text-subtle)]">در آینده نتیجه استخراج‌شده قبل از ذخیره توسط خودت بررسی و ویرایش می‌شه.</p>
        </section>

        <section className="card p-4 sm:p-5">
          <h2 className="text-base font-bold">متن و یادداشت برنامه</h2>
          <p className="mt-1 text-xs leading-6 text-[var(--text-muted)]">می‌تونی متن رو دستی وارد کنی یا فقط فایل برنامه رو نگه داری.</p>
          <label className="mt-4 block field-label">
            یادداشت‌ها
            <textarea value={value.notes} onChange={(event) => onChange({ ...value, notes: event.target.value })} maxLength={5000} rows={8} className="field-input mt-2 resize-y" placeholder="متن یا نکته‌های برنامه رو اینجا بنویس..." />
            <span className="mt-1 block text-left text-[0.68rem] font-normal text-[var(--text-subtle)]" dir="ltr">{value.notes.length.toLocaleString("fa-IR")} / ۵٬۰۰۰</span>
          </label>
        </section>
      </div>

      <section className="card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold">بازه زمانی برنامه</h2>
            <p id="plan-date-help" className="mt-1 text-[0.68rem] leading-5 text-[var(--text-subtle)]">تاریخ‌ها اختیاری هستند. اگر برنامه زمان مشخصی دارد، بازه آن را وارد کن.</p>
          </div>
          <span className="chip chip-neutral">اختیاری</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {planType === "nutrition" ? <label className="field-label">نام متخصص<input value={value.external_provider_name} onChange={(event) => onChange({ ...value, external_provider_name: event.target.value })} maxLength={120} className="field-input mt-2" placeholder="اختیاری" /></label> : <div className="hidden sm:block" />}
          <label className="field-label">تاریخ شروع<input aria-describedby="plan-date-help" type="date" value={value.starts_on ?? ""} onChange={(event) => onChange({ ...value, starts_on: event.target.value || null })} dir="ltr" className="field-input mt-2 text-left" /></label>
          <label className="field-label">تاریخ پایان<input aria-describedby="plan-date-help" type="date" value={value.ends_on ?? ""} onChange={(event) => onChange({ ...value, ends_on: event.target.value || null })} dir="ltr" className="field-input mt-2 text-left" /></label>
        </div>
        <p className="mt-3 text-[0.65rem] leading-5 text-[var(--text-subtle)]">ورودی تاریخ با ابزار خود مرورگر انجام می‌شود؛ تاریخ ذخیره‌شده در فهرست با ارقام فارسی نمایش داده می‌شود.</p>
      </section>

      <div className="notice notice-info">{planType === "nutrition" ? "اپ فقط یادداشت‌ها و فایل واردشده توسط تو را نگه می‌دارد و برنامه را بررسی پزشکی، تجویز، تأیید یا تغییر نمی‌دهد." : "اپ فقط یادداشت‌ها و فایل واردشده توسط تو را نگه می‌دارد و برنامه تمرینی یا توصیه‌ای تولید نمی‌کند."}</div>

      {(validationError || error) ? <p role="alert" className="notice notice-error">{validationError || error}</p> : null}
      {success ? <p role="status" className="notice notice-success">{success}</p> : null}

      {statusPanel}

      <div className="sticky bottom-3 z-20 flex items-center justify-between gap-3 rounded-xl border border-[var(--border-soft)] bg-white/95 p-3 backdrop-blur sm:static">
        <button type="submit" disabled={isSaving} className="btn btn-primary w-full sm:w-auto">{isSaving ? "در حال ذخیره..." : submitLabel}</button>
        <span className="hidden text-xs text-[var(--text-subtle)] sm:block">فایل و یادداشت‌ها همون‌طور که وارد کردی ذخیره می‌شن.</span>
      </div>
    </form>
  );
}
