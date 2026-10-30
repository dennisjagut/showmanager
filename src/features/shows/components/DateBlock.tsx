import { useLocale } from "next-intl";
import { dateParts } from "@/lib/dates";

export function DateBlock({ date, large = false }: { date: string; large?: boolean }) {
  const { weekday, day, month, year } = dateParts(date, useLocale());
  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-900 ring-1 ring-brand-200 ring-inset dark:bg-brand-950 dark:text-brand-100 dark:ring-brand-800 ${large ? "h-20 w-20" : "h-16 w-16"}`}
    >
      <span className="text-[11px] font-medium uppercase opacity-70">{weekday}</span>
      <span className={`leading-none font-bold tabular-nums ${large ? "text-3xl" : "text-2xl"}`}>{day}</span>
      <span className="text-[11px] font-medium uppercase opacity-70">
        {month} {String(year).slice(2)}
      </span>
    </div>
  );
}
