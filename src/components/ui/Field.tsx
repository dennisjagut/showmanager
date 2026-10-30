import { cn } from "@/lib/cn";

// Form fields with a label on top. `className` is for the wrapper (layout), `inputClassName` for the field itself.

type FieldProps = { label: React.ReactNode; hint?: React.ReactNode; className?: string };

// `as="div"` for a group with several controls, which must not sit inside one <label>
export function Field({
  label,
  hint,
  className,
  as: Tag = "label",
  children,
}: FieldProps & { as?: "label" | "div"; children: React.ReactNode }) {
  return (
    <Tag className={cn("block", className)}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </Tag>
  );
}

export function TextField({
  label,
  hint,
  className,
  inputClassName,
  ...props
}: FieldProps & { inputClassName?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input {...props} className={cn("input", inputClassName)} />
    </Field>
  );
}

export function TextAreaField({
  label,
  hint,
  className,
  rows = 3,
  ...props
}: FieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} hint={hint} className={className}>
      <textarea {...props} rows={rows} className="input" />
    </Field>
  );
}

export type Option = { value: string | number; label: string };

export function SelectField({
  label,
  hint,
  className,
  inputClassName,
  options,
  ...props
}: FieldProps & { inputClassName?: string; options: Option[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} hint={hint} className={className}>
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
