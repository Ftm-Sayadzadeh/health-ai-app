import React, {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import "../tokens/tokens.css";
import "./components.css";

type Tone = "actual" | "plan" | "neutral" | "danger";
type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AvocadoProvider({ children }: React.PropsWithChildren) {
  return (
    <div className="av-root" lang="fa" dir="rtl">
      {children}
    </div>
  );
}

export function DirectionIsolate({
  children,
  direction = "auto",
  className,
}: React.PropsWithChildren<{ direction?: "auto" | "ltr" | "rtl"; className?: string }>) {
  return (
    <bdi className={cx("av-bidi", className)} dir={direction}>
      {children}
    </bdi>
  );
}

export function TrackMarker({ tone, label }: { tone: "actual" | "plan"; label: string }) {
  return (
    <span className="av-track-marker" data-tone={tone}>
      <span className="av-track-marker__shape" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    loading = false,
    loadingLabel = "در حال انجام",
    fullWidth = false,
    disabled,
    children,
    className,
    ...props
  },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      className={cx("av-button", fullWidth && "av-button--full", className)}
      data-variant={variant}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <span className="av-button__spinner" aria-hidden="true" />}
      <span>{loading ? loadingLabel : children}</span>
    </button>
  );
});

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  unit?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { id, label, hint, error, unit, required, className, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  return (
    <label className={cx("av-field", error && "av-field--error", className)} htmlFor={inputId}>
      <span className="av-field__label">
        {label}
        {required && <span className="av-field__required"> · ضروری</span>}
      </span>
      <span className="av-field__control">
        <input
          {...props}
          id={inputId}
          ref={ref}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? descriptionId : undefined}
        />
        {unit && <span className="av-field__unit">{unit}</span>}
      </span>
      {(error || hint) && (
        <small id={descriptionId} className="av-field__description">
          {error ?? hint}
        </small>
      )}
    </label>
  );
});

export interface PhoneFieldProps extends Omit<FieldProps, "type" | "dir"> {
  countryCode?: string;
}

export const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(function PhoneField(
  { countryCode = "+98", ...props },
  ref,
) {
  return (
    <div className="av-phone-field">
      <span className="av-field__label">{props.label}</span>
      <div className="av-phone-field__control" dir="ltr">
        <span>{countryCode}</span>
        <Field
          {...props}
          ref={ref}
          label=""
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
        />
      </div>
    </div>
  );
});

export interface OtpInputProps {
  value: string;
  onValueChange: (value: string) => void;
  length?: number;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function OtpInput({
  value,
  onValueChange,
  length = 6,
  label = "کد تأیید",
  error,
  disabled,
}: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const cells = Array.from({ length }, (_, index) => value[index] ?? "");

  function commit(nextCells: string[]) {
    onValueChange(nextCells.join("").replace(/\D/g, "").slice(0, length));
  }

  function onCellChange(index: number, rawValue: string) {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const next = [...cells];
    next[index] = digit;
    commit(next);
    if (digit) inputs.current[index + 1]?.focus();
  }

  function onPaste(event: React.ClipboardEvent) {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!digits) return;
    event.preventDefault();
    onValueChange(digits);
    inputs.current[Math.min(digits.length, length) - 1]?.focus();
  }

  return (
    <fieldset className="av-otp" aria-invalid={error ? true : undefined}>
      <legend>{label}</legend>
      <div className="av-otp__cells" dir="ltr" onPaste={onPaste}>
        {cells.map((cell, index) => (
          <input
            key={index}
            ref={(node) => { inputs.current[index] = node; }}
            value={cell}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            disabled={disabled}
            aria-label={`رقم ${new Intl.NumberFormat("fa-IR").format(index + 1)}`}
            onChange={(event) => onCellChange(index, event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !cell) inputs.current[index - 1]?.focus();
              if (event.key === "ArrowRight") inputs.current[index + 1]?.focus();
              if (event.key === "ArrowLeft") inputs.current[index - 1]?.focus();
            }}
          />
        ))}
      </div>
      {error && <small className="av-otp__error">{error}</small>}
    </fieldset>
  );
}

export interface FoodEntryRowProps {
  name: string;
  amount: string;
  meal: string;
  calories?: string;
  saved?: boolean;
  onRepeat?: () => void;
  onEdit?: () => void;
}

export function FoodEntryRow({
  name,
  amount,
  meal,
  calories,
  saved,
  onRepeat,
  onEdit,
}: FoodEntryRowProps) {
  return (
    <article className="av-food-row">
      <span className="av-food-row__glyph" aria-hidden="true">{saved ? "★" : name.slice(0, 1)}</span>
      <div className="av-food-row__copy">
        <strong>{name}</strong>
        <span>{meal} · {amount}</span>
      </div>
      {calories && <DirectionIsolate className="av-food-row__value" direction="ltr">{calories}</DirectionIsolate>}
      <div className="av-food-row__actions">
        {onEdit && <Button variant="quiet" onClick={onEdit}>ویرایش</Button>}
        {onRepeat && <Button variant="secondary" onClick={onRepeat}>ثبت دوباره</Button>}
      </div>
    </article>
  );
}

export interface MealGroupProps {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  onAdd?: () => void;
}

export function MealGroup({ title, count, children, defaultExpanded = true, onAdd }: MealGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const regionId = useId();
  return (
    <section className="av-meal-group">
      <header>
        <button
          className="av-meal-group__toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls={regionId}
          onClick={() => setExpanded((current) => !current)}
        >
          <span><strong>{title}</strong><small>{new Intl.NumberFormat("fa-IR").format(count)} مورد</small></span>
          <span aria-hidden="true">⌄</span>
        </button>
        {onAdd && <Button variant="quiet" onClick={onAdd}>افزودن</Button>}
      </header>
      <div id={regionId} hidden={!expanded}>{children}</div>
    </section>
  );
}

export interface PlanCardProps {
  type: "meal" | "workout";
  title: string;
  source: string;
  period: string;
  status: string;
  onView: () => void;
  onCopyToLog?: () => void;
}

export function PlanCard({ type, title, source, period, status, onView, onCopyToLog }: PlanCardProps) {
  return (
    <article className="av-plan-card">
      <TrackMarker tone="plan" label={type === "meal" ? "برنامه غذایی" : "برنامه تمرینی"} />
      <span className="av-plan-card__status">{status}</span>
      <h3>{title}</h3>
      <p>{source}</p>
      <DirectionIsolate className="av-plan-card__period">{period}</DirectionIsolate>
      <div className="av-plan-card__actions">
        <Button variant="secondary" onClick={onView}>مشاهده برنامه</Button>
        {onCopyToLog && <Button onClick={onCopyToLog}>ثبت بر اساس برنامه</Button>}
      </div>
    </article>
  );
}

export interface FileUploadProps {
  accept?: string;
  maxSizeMb?: number;
  file?: File | null;
  onFileChange: (file: File | null) => void;
  error?: string;
}

export function FileUpload({
  accept = "application/pdf,image/*",
  maxSizeMb = 10,
  file,
  onFileChange,
  error,
}: FileUploadProps) {
  const inputId = useId();
  return (
    <section className="av-upload" aria-labelledby={`${inputId}-title`}>
      <h3 id={`${inputId}-title`}>بارگذاری برنامه</h3>
      <label className="av-upload__drop" htmlFor={inputId}>
        <input
          id={inputId}
          type="file"
          accept={accept}
          onChange={(event) => onFileChange(event.currentTarget.files?.[0] ?? null)}
        />
        <strong>PDF یا تصویر را انتخاب کنید</strong>
        <span>حداکثر {new Intl.NumberFormat("fa-IR").format(maxSizeMb)} مگابایت</span>
      </label>
      {file && (
        <div className="av-upload__file">
          <DirectionIsolate>{file.name}</DirectionIsolate>
          <Button variant="quiet" onClick={() => onFileChange(null)}>حذف</Button>
        </div>
      )}
      {error && <p className="av-upload__error" role="alert">{error}</p>}
    </section>
  );
}

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet = forwardRef<HTMLDialogElement, BottomSheetProps>(function BottomSheet(
  { open, onOpenChange, title, children },
  forwardedRef,
) {
  const localRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useImperativeHandle(forwardedRef, () => localRef.current as HTMLDialogElement);

  useEffect(() => {
    const dialog = localRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={localRef}
      className="av-sheet"
      aria-labelledby={titleId}
      onClose={() => onOpenChange(false)}
      onCancel={(event) => { event.preventDefault(); onOpenChange(false); }}
    >
      <div className="av-sheet__handle" aria-hidden="true" />
      <header>
        <h2 id={titleId}>{title}</h2>
        <Button variant="quiet" aria-label="بستن" onClick={() => onOpenChange(false)}>×</Button>
      </header>
      {children}
    </dialog>
  );
});

export interface BottomNavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export function BottomNavigation({
  items,
  current,
  onChange,
}: {
  items: BottomNavigationItem[];
  current: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="av-bottom-nav" aria-label="ناوبری اصلی">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={current === item.id ? "page" : undefined}
          onClick={() => onChange(item.id)}
        >
          <span aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function SystemState({
  status,
  title,
  description,
  action,
}: {
  status: "loading" | "empty" | "error" | "success";
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  if (status === "loading") {
    return <div className="av-state" aria-busy="true" aria-label={title}><span /><span /><span /></div>;
  }
  return (
    <section className="av-state" data-status={status} role={status === "error" ? "alert" : undefined}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <article className="metric-card" data-tone={tone === "neutral" ? undefined : tone}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </article>
  );
}

export function QuickAction({
  href,
  label,
  description,
  icon,
}: {
  href: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <a className="quick-action" href={href}>
      {icon}
      <strong>{label}</strong>
      {description && <span>{description}</span>}
    </a>
  );
}

export function StatePanel({
  state,
  title,
  description,
  action,
}: {
  state: "loading" | "empty" | "error" | "success";
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  if (state === "loading") {
    return (
      <section className="state-panel" data-state="loading" aria-busy="true" aria-label={title}>
        <span />
        <span />
        <span />
      </section>
    );
  }
  return (
    <section className="state-panel" data-state={state} role={state === "error" ? "alert" : undefined}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </section>
  );
}

export function FilterChip({
  pressed,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }) {
  return (
    <button className="filter-chip" type="button" aria-pressed={pressed ? "true" : "false"} {...props}>
      {children}
    </button>
  );
}

export type AvocadoComponentTone = Tone;
