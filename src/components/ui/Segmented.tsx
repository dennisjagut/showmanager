import { cn } from "@/lib/cn";

// Group of buttons or links where exactly one is selected, e.g. "Kommende · Vergangene · Alle"
export function Segmented({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("inline-flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800", className)}>{children}</div>
  );
}

export function segmentClass(active: boolean): string {
  return cn(
    "rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap",
    active
      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
  );
}
