import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import type { Tone } from "@/components/ui/tones";
import type { Deadline as DeadlineInfo } from "@/lib/api/types";
import { formatDate } from "@/lib/dates";

const TONE: Record<DeadlineInfo["state"], Tone> = { passed: "danger", soon: "warning", later: "neutral" };

/** Shows the free text and – if the API could derive one – the approximate date for the season. */
export function Deadline({
  text,
  info,
  highlight,
  inline = false,
}: {
  text: string | null;
  info: DeadlineInfo | null;
  // only color-code applications that are still open
  highlight: boolean;
  // Text and date side by side (in a line of text) instead of one above the other (in a table cell)
  inline?: boolean;
}) {
  const t = useTranslations("deadline");
  const locale = useLocale();
  if (!text) return <span className="text-zinc-400">–</span>;
  if (!info) return <span>{text}</span>;
  return (
    <span
      className={inline ? "inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5" : "inline-flex flex-col gap-0.5"}
    >
      <span>{text}</span>
      <span title={t("approximate")}>
        <Badge tone={highlight ? TONE[info.state] : "neutral"}>
          ~{formatDate(info.date, locale)}
          {info.uncertain && " ?"}
          {highlight && info.state !== "later" && ` · ${t(info.state)}`}
        </Badge>
      </span>
    </span>
  );
}
