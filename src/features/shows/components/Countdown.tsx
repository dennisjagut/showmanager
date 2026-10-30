import { useTranslations } from "next-intl";
import { daysUntil } from "@/lib/dates";

// "in 24 days" as a big number, today/tomorrow as a word – always fits into the fixed box
export function Countdown({ date }: { date: string }) {
  const t = useTranslations("shows.countdown");
  const days = daysUntil(date);
  const word = days === 0 ? t("today") : days === 1 ? t("tomorrow") : null;
  return (
    <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-white/15 text-center">
      <span className="text-[11px] font-medium uppercase opacity-80">{word ? t("next") : t("in")}</span>
      {word ? (
        <span className="text-base leading-tight font-bold">{word}</span>
      ) : (
        <span className="text-3xl leading-none font-bold tabular-nums">{days}</span>
      )}
      <span className="text-[11px] font-medium uppercase opacity-80">{word ? t("show") : t("days")}</span>
    </div>
  );
}
