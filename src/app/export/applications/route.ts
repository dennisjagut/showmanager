import { getLocale, getTranslations } from "next-intl/server";
import { listFestivals } from "@/features/applications/api";
import { csvResponse, csvText } from "@/lib/csv";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "name",
  "location",
  "state",
  "month",
  "website",
  "deadline",
  "contact",
  "notes",
  "active",
  "status",
  "appliedOn",
  "note",
] as const;

// Festivals with their application in one season, e.g. for Google Sheets or Excel
export async function GET(request: Request) {
  const [{ season, rows }, t, ts, tc, locale] = await Promise.all([
    listFestivals(new URL(request.url).searchParams.get("season") ?? ""),
    getTranslations("csv.applications"),
    getTranslations("applicationStatus"),
    getTranslations("common"),
    getLocale(),
  ]);

  const header = COLUMNS.map((c) => (c === "status" ? t("status", { season }) : t(c)));
  const content = rows.map(({ festival: f, application: a }) => [
    f.name,
    f.location,
    f.state,
    f.month,
    f.website,
    f.deadline,
    f.contact,
    f.notes,
    f.active ? tc("yes") : tc("no"),
    ts(a?.status ?? "open"),
    formatDate(a?.appliedOn, locale),
    a?.note,
  ]);

  return csvResponse(csvText(header, content), t("filename", { season }));
}
