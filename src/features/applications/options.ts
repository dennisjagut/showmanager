import { useLocale, useTranslations } from "next-intl";
import type { Option } from "@/components/ui/Field";
import type { Festival } from "@/lib/api/types";
import { monthNames } from "@/lib/dates";

export type State = NonNullable<Festival["state"]>;

// Codes of the 16 German federal states
export const STATES: State[] = [
  "BB",
  "BE",
  "BW",
  "BY",
  "HB",
  "HE",
  "HH",
  "MV",
  "NI",
  "NW",
  "RP",
  "SH",
  "SL",
  "SN",
  "ST",
  "TH",
];

// Options of the select fields of a festival: the federal states by name, the months from January to December
export function useFestivalOptions(): { states: Option[]; months: Option[] } {
  const t = useTranslations("states");
  const locale = useLocale();
  return {
    states: STATES.map((s) => ({ value: s, label: t(s) })).sort((a, b) => a.label.localeCompare(b.label, locale)),
    months: monthNames(locale).map((name, i) => ({ value: i + 1, label: name })),
  };
}
