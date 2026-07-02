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
      <section className="rounded-[1.5rem] border border-[#DCE9B0] bg-gradient-to-l from-[#F4FBE3] to-white p-3.5 shadow-[0_12px_28px_rgba(85,117,54,0.05)] sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-[#EAF7C7] px-3 py-1.5 text-xs font-extrabold text-[#557536]">
              {planType === "nutrition" ? "برنامه متخصص خودت" : "برنامه تمرینی شخصی"}
            </span>
            <h2 className="mt-2 text-sm font-extrabold leading-6 sm:text-base">{planType === "nutrition" ? "برنامه‌ای که از متخصص خودت گرفتی را اینجا نگهداری کن." : "برنامه تمرینی ساده‌ای که خودت داری را ثبت کن."}</h2>
          </div>
          <span className="text-xs font-bold text-[#8A9A78]">{planType === "nutrition" ? "منبع: متخصص بیرون از اپ" : "منبع: ثبت شخصی"}</span>
        </div>
        <label className="mt-3 block text-sm font-bold text-[#557536]">
          عنوان برنامه
          <input value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} maxLength={120} className="mt-1.5 w-full rounded-2xl border border-[#E9E5DC] bg-white px-4 py-3 text-[#25321F] outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" placeholder={planType === "nutrition" ? "مثلا برنامه متخصص من" : "مثلا برنامه تمرینی هفتگی من"} />
        </label>
      </section>

      <div className="grid items-stretch gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex flex-col rounded-[1.5rem] border border-[#EFEAD9] bg-white p-4 shadow-[0_12px_28px_rgba(85,117,54,0.05)] sm:p-5">
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF7C7] text-lg font-extrabold text-[#557536]" aria-hidden="true">+</span><h2 className="text-lg font-extrabold">فایل برنامه</h2></div>
          <p className="mt-2 text-xs leading-6 text-[#6B7A5A]">می‌تونی عکس یا PDF برنامه‌ات رو اضافه کنی. حداکثر حجم فایل ۱۰ مگابایته.</p>
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => chooseFile(event.target.files?.[0])} className="sr-only" />
          {visibleAttachment ? (
            <div className="mt-4 rounded-[1.2rem] border border-[#DCE9B0] bg-[#F4FBE3] p-4">
              <p className="text-sm font-extrabold">فایل برنامه پیوست شد</p>
              <p className="mt-1 text-[0.7rem] font-bold text-[#557536]">{formatFileType(attachmentType)} • {formatFileSize(attachmentSize ?? 0)}</p>
              <p className="mt-1 truncate text-[0.65rem] text-[#8A9A78]" title={attachmentName}>{attachmentName}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => inputRef.current?.click()} className="rounded-full bg-white px-3 py-2 text-[0.7rem] font-extrabold text-[#557536]">جایگزینی فایل</button>
                {onDownload && !(visibleAttachment instanceof File) ? <button type="button" onClick={onDownload} className="rounded-full bg-white px-3 py-2 text-[0.7rem] font-extrabold text-[#557536]">مشاهده فایل</button> : null}
                <button type="button" onClick={removeFile} className="rounded-full bg-[#FFF6E8] px-3 py-2 text-[0.7rem] font-extrabold text-[#7A3A27]">حذف فایل</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 flex min-h-36 w-full flex-1 flex-col items-center justify-center rounded-[1.2rem] border-2 border-dashed border-[#C9D99E] bg-[#FFFDF8] px-4 py-5 text-center transition hover:border-[#AFC86E] hover:bg-[#F4FBE3]">
              <span className="block text-sm font-extrabold text-[#557536]">انتخاب عکس یا PDF</span>
              <span className="mt-2 block text-[0.68rem] text-[#8A9A78]">JPG، PNG، WEBP، PDF • حداکثر ۱۰ مگابایت</span>
            </button>
          )}
          <button type="button" disabled className="mt-4 w-full cursor-not-allowed rounded-full border border-[#E9E5DC] bg-[#F7F5EF] px-4 py-2.5 text-xs font-bold text-[#8A9A78] opacity-80">استخراج متن با هوش مصنوعی — به‌زودی</button>
          <p className="mt-2 text-[0.66rem] leading-5 text-[#8A9A78]">در آینده نتیجه استخراج‌شده قبل از ذخیره توسط خودت بررسی و ویرایش می‌شه.</p>
        </section>

        <section className="rounded-[1.5rem] border border-[#EFEAD9] bg-white p-4 shadow-[0_12px_28px_rgba(85,117,54,0.05)] sm:p-5">
          <h2 className="text-lg font-extrabold">متن و یادداشت برنامه</h2>
          <p className="mt-1 text-xs leading-6 text-[#6B7A5A]">می‌تونی متن رو دستی وارد کنی یا فقط فایل برنامه رو نگه داری.</p>
          <label className="mt-4 block text-sm font-bold text-[#557536]">
            یادداشت‌ها
            <textarea value={value.notes} onChange={(event) => onChange({ ...value, notes: event.target.value })} maxLength={5000} rows={8} className="mt-2 w-full resize-y rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3.5 leading-7 text-[#25321F] outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" placeholder="متن یا نکته‌های برنامه رو اینجا بنویس..." />
            <span className="mt-1 block text-left text-[0.68rem] font-normal text-[#8A9A78]" dir="ltr">{value.notes.length.toLocaleString("fa-IR")} / ۵٬۰۰۰</span>
          </label>
        </section>
      </div>

      <section className="rounded-[1.5rem] border border-[#EFEAD9] bg-white p-4 shadow-[0_12px_28px_rgba(85,117,54,0.05)] sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="text-sm font-extrabold">بازه زمانی برنامه</h2><p id="plan-date-help" className="mt-1 text-[0.68rem] leading-5 text-[#8A9A78]">تاریخ‌ها اختیاری هستند. اگر برنامه زمان مشخصی دارد، بازه آن را وارد کن.</p></div>
          <span className="rounded-full bg-[#F7F5EF] px-2.5 py-1 text-[0.65rem] font-bold text-[#77736B]">اختیاری</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {planType === "nutrition" ? <label className="text-sm font-bold text-[#557536]">نام متخصص<input value={value.external_provider_name} onChange={(event) => onChange({ ...value, external_provider_name: event.target.value })} maxLength={120} className="mt-2 w-full rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3.5 outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" placeholder="اختیاری" /></label> : <div className="hidden sm:block" />}
          <label className="text-sm font-bold text-[#557536]">تاریخ شروع<input aria-describedby="plan-date-help" type="date" value={value.starts_on ?? ""} onChange={(event) => onChange({ ...value, starts_on: event.target.value || null })} dir="ltr" className="mt-2 w-full rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3.5 text-left outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" /></label>
          <label className="text-sm font-bold text-[#557536]">تاریخ پایان<input aria-describedby="plan-date-help" type="date" value={value.ends_on ?? ""} onChange={(event) => onChange({ ...value, ends_on: event.target.value || null })} dir="ltr" className="mt-2 w-full rounded-2xl border border-[#E9E5DC] bg-[#FFFDF8] px-4 py-3.5 text-left outline-none focus:border-[#D4F24E] focus:ring-4 focus:ring-[#EAF7C7]" /></label>
        </div>
        <p className="mt-3 text-[0.65rem] leading-5 text-[#8A9A78]">ورودی تاریخ با ابزار خود مرورگر انجام می‌شود؛ تاریخ ذخیره‌شده در فهرست با ارقام فارسی نمایش داده می‌شود.</p>
      </section>

      <div className="rounded-[1.4rem] border border-[#DCE9B0] bg-[#F4FBE3] p-4 text-xs leading-6 text-[#557536]">{planType === "nutrition" ? "اپ فقط یادداشت‌ها و فایل واردشده توسط تو را نگه می‌دارد و برنامه را بررسی پزشکی، تجویز، تأیید یا تغییر نمی‌دهد." : "اپ فقط یادداشت‌ها و فایل واردشده توسط تو را نگه می‌دارد و برنامه تمرینی یا توصیه‌ای تولید نمی‌کند."}</div>

      {(validationError || error) ? <p role="alert" className="rounded-2xl border border-[#F5D5C9] bg-[#FFF6E8] p-4 text-sm text-[#7A3A27]">{validationError || error}</p> : null}
      {success ? <p role="status" className="rounded-2xl border border-[#DCE9B0] bg-[#F4FBE3] p-4 text-sm font-bold text-[#557536]">{success}</p> : null}

      {statusPanel}

      <div className="sticky bottom-3 z-20 flex items-center justify-between gap-3 rounded-[1.4rem] border border-[#EFEAD9] bg-white/95 p-3 shadow-[0_16px_40px_rgba(85,117,54,0.12)] backdrop-blur sm:static">
        <button type="submit" disabled={isSaving} className="w-full rounded-full bg-[#D4F24E] px-7 py-3.5 text-sm font-extrabold shadow-[0_14px_28px_rgba(212,242,78,0.3)] hover:bg-[#CFE84E] disabled:opacity-60 sm:w-auto">{isSaving ? "در حال ذخیره..." : submitLabel}</button>
        <span className="hidden text-xs text-[#8A9A78] sm:block">فایل و یادداشت‌ها همون‌طور که وارد کردی ذخیره می‌شن.</span>
      </div>
    </form>
  );
}
