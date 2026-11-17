import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import type { Tone } from "@/components/ui/tones";
import type { Deadline as DeadlineInfo } from "@/lib/api/types";
import { formatDayMonth } from "@/lib/dates";

const TONE: Record<DeadlineInfo["state"], Tone> = { passed: "danger", soon: "warning", later: "neutral" };

/** The deadline of the festival in one season, without the year: it repeats every year */
export function Deadline({
  info,
  highlight,
}: {
  info: DeadlineInfo | null;
  // only color-code applications that are still open
  highlight: boolean;
}) {
  const t = useTranslations("deadline");
  const locale = useLocale();
  if (!info) return <span className="text-zinc-400">–</span>;
  return (
    <Badge tone={highlight ? TONE[info.state] : "neutral"}>
      {formatDayMonth(info.date, locale)}
      {highlight && info.state !== "later" && ` · ${t(info.state)}`}
    </Badge>
  );
}
