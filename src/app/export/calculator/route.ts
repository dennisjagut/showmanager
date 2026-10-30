import { getLocale, getTranslations } from "next-intl/server";
import { csvResponse, csvText } from "@/lib/csv";
import { getCalculator } from "@/features/calculator/api";
import { calculate } from "@/features/calculator/calculation";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "category",
  "name",
  "billing",
  "amount",
  "fuel",
  "freeKm",
  "selected",
  "quantity",
  "duration",
  "cost",
] as const;

// All items with their rates and what they cost in the current inquiry. Numbers in the locale's format for Excel and Sheets.
export async function GET() {
  const [{ inquiry, items }, t, tc, locale] = await Promise.all([
    getCalculator(),
    getTranslations("csv.calculator"),
    getTranslations("common"),
    getLocale(),
  ]);
  const result = calculate(inquiry, items);
  const number = (n: number) => formatNumber(n, locale);

  const content: (string | number | null)[][] = items.map((p) => [
    t(`categories.${p.category}`),
    p.name,
    t(`billing.${p.billing}`),
    number(p.amount),
    p.category === "vehicle" ? number(p.fuelPerKm) : "",
    p.category === "vehicle" ? number(p.freeKm) : "",
    p.selected ? tc("yes") : tc("no"),
    p.quantity,
    p.duration,
    number(result.perItem[p.id] ?? 0),
  ]);
  content.push(
    [],
    [
      t("inquiry"),
      inquiry.location,
      inquiry.oneWayKm === null ? "" : t("oneWayKm", { km: number(inquiry.oneWayKm) }),
      t("daysOnSite", { count: inquiry.days }),
      t("buffer", { percent: number(inquiry.bufferPercent) }),
    ],
    [t("total"), number(result.total)],
  );

  return csvResponse(
    csvText(
      COLUMNS.map((c) => t(`columns.${c}`)),
      content,
    ),
    t("filename"),
  );
}
