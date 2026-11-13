import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

// Form fields with a label on top. `className` is for the wrapper (layout), `inputClassName` for the field itself.

type FieldProps = {
  label: React.ReactNode;
  hint?: React.ReactNode;
  // Message under the field, e.g. from useDraft; also marks the field as invalid
  error?: string;
  // The value differs from the saved one: a dot after the label
  changed?: boolean;
  className?: string;
};

function ChangedDot() {
  const t = useTranslations("common");
  return (
    <span
      title={t("changed")}
      className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-700 align-middle dark:bg-brand-400"
    >
      <span className="sr-only">{t("changed")}</span>
    </span>
  );
}

// `as="div"` for a group with several controls, which must not sit inside one <label>
export function Field({
  label,
  hint,
  error,
  changed = false,
  className,
  as: Tag = "label",
  children,
}: FieldProps & { as?: "label" | "div"; children: React.ReactNode }) {
  return (
    <Tag className={cn("block", className)}>
      <span className="label">
        {label}
        {changed && <ChangedDot />}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-700 dark:text-rose-400">{error}</span>}
      {hint && !error && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </Tag>
  );
}

const INVALID = "border-rose-600 dark:border-rose-400";

export function TextField({
  label,
  hint,
  error,
  changed,
  className,
  inputClassName,
  ...props
}: FieldProps & { inputClassName?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} hint={hint} error={error} changed={changed} className={className}>
      <input
        {...props}
        aria-invalid={error ? true : undefined}
        className={cn("input", error && INVALID, inputClassName)}
      />
    </Field>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  changed,
  className,
  rows = 3,
  ...props
}: FieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} hint={hint} error={error} changed={changed} className={className}>
      <textarea
        {...props}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn("input", error && INVALID)}
      />
    </Field>
  );
}

export type Option = { value: string | number; label: string };

export function SelectField({
  label,
  hint,
  changed,
  className,
  inputClassName,
  options,
  ...props
}: FieldProps & { inputClassName?: string; options: Option[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} hint={hint} changed={changed} className={className}>
      <select {...props} className={cn("input", inputClassName)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: { label: React.ReactNode; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <label className={cn("flex items-center gap-2 text-sm", className)}>
      <input {...props} type="checkbox" className="h-4 w-4 shrink-0 accent-brand-600" />
      {label}
    </label>
  );
}

// Suggestions for a text field with `list={id}`
export function DataList({ id, values }: { id: string; values: string[] }) {
  return (
    <datalist id={id}>
      {values.map((v) => (
        <option key={v} value={v} />
      ))}
    </datalist>
  );
}
