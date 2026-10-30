import { cn } from "@/lib/cn";

// White box with a border. `dashed` is for "add" rows and empty states.
export function Card({
  id,
  title,
  actions,
  dashed = false,
  className,
  children,
}: {
  id?: string;
  title?: React.ReactNode;
  // shown to the right of the title
  actions?: React.ReactNode;
  dashed?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "space-y-3 card",
        dashed && "border-dashed border-zinc-300 bg-transparent dark:border-zinc-700 dark:bg-transparent",
        className,
      )}
    >
      {(title || actions) && (
        <div className="flex items-baseline justify-between gap-2">
          {title && <h2 className="section-title">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <Card dashed className="p-8 text-center text-zinc-500">
      {children}
    </Card>
  );
}
