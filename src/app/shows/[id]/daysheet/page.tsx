import { getLocale, getTranslations } from "next-intl/server";
import { BackLink, Page } from "@/components/ui/Page";
import { ContactInfo, LogisticsInfo } from "@/features/shows/components/Infos";
import { PdfButton } from "@/features/shows/components/PdfButton";
import { PrintButton } from "@/features/shows/components/PrintButton";
import { formatLongDate } from "@/lib/dates";
import { guestCount, mapsLink, place } from "@/features/shows/infos";
import { getShow } from "@/features/shows/api";

export const dynamic = "force-dynamic";

// Compact overview of the day for band and crew – to print or on the phone
export default async function Daysheet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, t, tc, ts, locale] = await Promise.all([
    getShow(id),
    getTranslations("show"),
    getTranslations("common"),
    getTranslations("showStatus"),
    getLocale(),
  ]);
  const { show: s, schedule, guests } = data;
  const mapUrl = mapsLink(s);

  return (
    <Page width="medium">
      <div className="flex items-center justify-between print:hidden">
        <BackLink href={`/shows/${s.id}`}>{tc("backToShow")}</BackLink>
        <div className="flex gap-2">
          <PrintButton />
          {/* A real PDF from the server: works where the print dialog is missing (phone, in-app browser) */}
          <PdfButton href={`/shows/${s.id}/daysheet/pdf`} />
        </div>
      </div>

      <article className="space-y-6 card p-6 print:border-0 print:p-0 print:dark:bg-white print:dark:text-zinc-900">
        <header className="border-b border-zinc-200 pb-4 dark:border-zinc-700">
          <p className="section-title">
            {t("daysheet")}
            {s.status !== "confirmed" && ` · ${ts(s.status)}`}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{s.title}</h1>
          <p className="text-lg">{formatLongDate(s.date, locale)}</p>
          {(s.venue || s.address) && (
            <p className="mt-1">
              {place(s)}
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noreferrer" className="ml-2 link print:hidden">
                  {tc("map")}
                </a>
              )}
            </p>
          )}
        </header>

        <section>
          <h2 className="mb-2 section-title">{t("daysheetSchedule")}</h2>
          {schedule.length > 0 ? (
            <table className="w-full text-base">
              <tbody>
                {schedule.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td className="w-20 py-1.5 font-mono font-bold tabular-nums">{p.time}</td>
                    <td className="py-1.5">{p.item}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-zinc-500">{t("noSchedule")}</p>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
          <ContactInfo show={s} />
          <LogisticsInfo show={s} />
        </section>

        {guests.length > 0 && (
          <section>
            <h2 className="mb-2 section-title">{t("guestListCount", { count: guestCount(guests) })}</h2>
            <ul className="columns-2 text-sm">
              {guests.map((g) => (
                <li key={g.id}>
                  {g.name}
                  {g.plusOnes > 0 && ` +${g.plusOnes}`}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </Page>
  );
}
