import { cn } from "@/lib/cn";

export type Fact = { label: string; value: React.ReactNode };

// Values of a read view, each with its label on top like a field in the edit mode, so switching modes keeps everything
// in place. Empty values are left out.
export function Facts({ items, className }: { items: Fact[]; className?: string }) {
  const shown = items.filter((item) => item.value);
  if (shown.length === 0) return null;
  return (
    <dl className={cn("space-y-3 text-sm", className)}>
      {shown.map((item) => (
        <div key={item.label}>
          <dt className="label">{item.label}</dt>
          <dd className="break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
