import { useTranslations } from "next-intl";

// Placeholders that appear immediately when the page changes, until the data from the server arrives

export function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

export function ListSkeleton({ rows = 6, height = "h-16" }: { rows?: number; height?: string }) {
  const t = useTranslations("common");
  return (
    <div className="space-y-2" aria-busy aria-label={t("loading")}>
      {Array.from({ length: rows }, (_, i) => (
        <Bar key={i} className={`${height} w-full`} />
      ))}
    </div>
  );
}

export function PageSkeleton({ rows = 6, height }: { rows?: number; height?: string }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Bar className="h-7 w-64" />
        <Bar className="h-4 w-80 max-w-full" />
      </div>
      <ListSkeleton rows={rows} height={height} />
    </div>
  );
}
