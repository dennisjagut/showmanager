import { getLocale, getTranslations } from "next-intl/server";
import { guestCount } from "@/features/shows/infos";
import { allShowDetails } from "@/features/shows/api";
import { csvResponse, csvText } from "@/lib/csv";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "date",
  "title",
  "tour",
  "status",
  "venue",
  "address",
  "contact",
  "phone",
  "email",
  "fee",
  "guestQuota",
  "guests",
  "hotel",
  "travel",
  "tech",
  "notes",
  "schedule",
  "guestList",
] as const;

// All shows, one row per show. Schedule and guest list each go into one cell with line breaks.
export async function GET() {
  const [list, t, ts, locale] = await Promise.all([
    allShowDetails(),
    getTranslations("csv.shows"),
    getTranslations("showStatus"),
    getLocale(),
  ]);

  const content = list.map(({ show: s, schedule, guests }) => {
    return [
      formatDate(s.date, locale),
      s.title,
      s.tour,
      ts(s.status),
      s.venue,
      s.address,
      s.contactName,
      s.contactPhone,
      s.contactEmail,
      s.fee,
      s.guestQuota,
      guestCount(guests),
      s.hotel,
      s.travel,
      s.tech,
      s.notes,
      schedule.map((p) => `${p.time} ${p.item}`).join("\n"),
      guests
        .map((g) =>
          [
            g.name,
            g.plusOnes > 0 ? ` +${g.plusOnes}` : "",
            g.addedBy ? ` (${t("addedBy", { name: g.addedBy })})` : "",
            g.note ? `: ${g.note}` : "",
          ].join(""),
        )
        .join("\n"),
    ];
  });

  return csvResponse(
    csvText(
      COLUMNS.map((c) => t(`columns.${c}`)),
      content,
    ),
    t("filename"),
  );
}
