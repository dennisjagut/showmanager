import { getLocale, getTranslations } from "next-intl/server";
import { daysheetPdf } from "@/features/shows/daysheet-pdf";
import { LOGISTICS_FIELDS } from "@/features/shows/infos";
import { getShow } from "@/features/shows/api";

export const dynamic = "force-dynamic";

const UMLAUTS: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", Ä: "Ae", Ö: "Oe", Ü: "Ue", ß: "ss" };

// Plain ASCII name: filename* (UTF-8) is not evaluated by every browser
function filename(text: string): string {
  return text
    .replace(/[äöüÄÖÜß]/g, (c) => UMLAUTS[c])
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9 _-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, t, ti, ts, locale] = await Promise.all([
    getShow(id),
    getTranslations("show"),
    getTranslations("showInfo"),
    getTranslations("showStatus"),
    getLocale(),
  ]);

  const pdf = await daysheetPdf(data, {
    locale,
    title: t("daysheet"),
    status: data.show.status === "confirmed" ? null : ts(data.show.status),
    schedule: t("daysheetSchedule"),
    noSchedule: t("noSchedule"),
    contact: ti("contact"),
    logistics: Object.fromEntries(LOGISTICS_FIELDS.map((f) => [f, ti(f)])) as Record<
      (typeof LOGISTICS_FIELDS)[number],
      string
    >,
    guestList: (count) => t("guestListCount", { count }),
    addedBy: (name) => t("via", { name }),
    page: (page, total) => t("page", { page, total }),
  });
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename(`${t("daysheet")} ${data.show.date} ${data.show.title}`)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
