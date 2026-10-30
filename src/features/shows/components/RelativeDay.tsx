import { useTranslations } from "next-intl";
import { daysUntil } from "@/lib/dates";

// "heute", "morgen", "in 12 Tagen", "vor 3 Tagen" …
export function RelativeDay({ date }: { date: string }) {
  const t = useTranslations("show.relative");
  const days = daysUntil(date);
  if (days === 0) return t("today");
  if (days === 1) return t("tomorrow");
  if (days === -1) return t("yesterday");
  return days > 0 ? t("future", { days }) : t("past", { days: -days });
}
