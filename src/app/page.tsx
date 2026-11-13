import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui/Card";
import { FilterChip } from "@/components/ui/Chip";
import { Page, PageHeader } from "@/components/ui/Page";
import { Contact, WebsiteLink } from "@/features/applications/components/Contact";
import { Deadline } from "@/features/applications/components/Deadline";
import { FilterBar } from "@/features/applications/components/FilterBar";
import { StatusSelect } from "@/features/applications/components/StatusSelect";
import { getOverview } from "@/features/applications/api";
import { APPLICATION_STATUSES, APPLICATION_STATUS_TONE, isApplicationStatus } from "@/features/applications/status";
import { formatDate } from "@/lib/dates";
import { linkWith, param, type SearchParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

export default async function Overview({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const [overview, t, ts, locale] = await Promise.all([
    getOverview(sp),
    getTranslations("applications"),
    getTranslations("applicationStatus"),
    getLocale(),
  ]);
  const { season, festivals, counts, sent, soonOpen, soonDays, rows } = overview;
  const status = param(sp, "status");
  const activeStatus = isApplicationStatus(status) ? status : null;

  return (
    <Page>
      <PageHeader
        title={t("title", { season })}
        description={
          <>
            {t("summary", { festivals, sent })}
            {soonOpen > 0 && (
              <>
                {" · "}
                <Link
                  href={`/?season=${season}&status=open&deadline=soon&sort=deadline`}
                  className="font-medium text-amber-700 dark:text-amber-400"
                >
                  {t("soonOpen", { count: soonOpen, days: soonDays })}
                </Link>
              </>
            )}
          </>
        }
        actions={
          <>
            <a href={`/export/applications?season=${season}`} className="btn-secondary">
              {t("exportCsv")}
            </a>
            <Link href="/festivals/new" className="btn-primary">
              {t("newFestival")}
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {APPLICATION_STATUSES.map((s) => (
          <FilterChip
            key={s}
            // Clicking the active status again removes the filter
            href={linkWith("/", sp, { status: activeStatus === s ? null : s })}
            tone={APPLICATION_STATUS_TONE[s]}
            active={activeStatus === s}
            dimmed={!!activeStatus}
          >
            {ts(s)}
            <span className="font-semibold tabular-nums">{counts[s] ?? 0}</span>
          </FilterChip>
        ))}
      </div>

      <FilterBar season={season} seasons={overview.seasons.all} states={overview.states} soonDays={soonDays} />

      <p className="text-sm text-zinc-500">{t("results", { count: rows.length })}</p>

      {/* Table from medium width */}
      <div className="hidden overflow-hidden card p-0 md:block">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-zinc-50 text-left text-xs tracking-wide text-zinc-500 uppercase dark:bg-zinc-800/50">
            <tr>
              <th className="w-[22%] px-3 py-2">{t("columns.festival")}</th>
              <th className="w-[9%] px-3 py-2">{t("columns.month")}</th>
              <th className="w-[13%] px-3 py-2">{t("columns.deadline")}</th>
              <th className="w-[22%] px-3 py-2">{t("columns.contact")}</th>
              <th className="w-[13%] px-3 py-2">{t("columns.status", { season })}</th>
              <th className="w-[21%] px-3 py-2">{t("columns.appliedNote")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map(({ festival: f, application: a, status, deadline }) => (
              <tr key={f.id} className={`align-top ${f.active ? "" : "opacity-50"}`}>
                <td className="px-3 py-2.5">
                  <Link href={`/festivals/${f.id}?season=${season}`} className="font-medium hover:underline">
                    {f.name}
                  </Link>
                  {!f.active && <span className="ml-1.5 text-xs text-rose-600">{t("inactive")}</span>}
                  <div className="text-xs text-zinc-500">{[f.location, f.state].filter(Boolean).join(" · ")}</div>
                  {f.website && (
                    <div className="truncate text-xs">
                      <WebsiteLink url={f.website} />
                    </div>
                  )}
                  {f.notes && <div className="mt-1 text-xs text-zinc-500 italic">{f.notes}</div>}
                </td>
                <td className="px-3 py-2.5">{f.month ?? <span className="text-zinc-400">–</span>}</td>
                <td className="px-3 py-2.5 text-xs">
                  <Deadline text={f.deadline} info={deadline} highlight={status === "open"} />
                </td>
                <td className="px-3 py-2.5 text-xs">
                  <Contact text={f.contact} />
                </td>
                <td className="px-3 py-2.5">
                  <StatusSelect festivalId={f.id} season={season} status={status} festivalName={f.name} />
                </td>
                <td className="px-3 py-2.5 text-xs">
                  {a?.appliedOn && (
                    <div className="font-medium">{t("appliedOnShort", { date: formatDate(a.appliedOn, locale) })}</div>
                  )}
                  {a?.note && <div className="text-zinc-600 dark:text-zinc-400">{a.note}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards on the phone */}
      <ul className="space-y-3 md:hidden">
        {rows.map(({ festival: f, application: a, status, deadline }) => (
          <li key={f.id} className={`space-y-2 card p-3 text-sm ${f.active ? "" : "opacity-50"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/festivals/${f.id}?season=${season}`} className="font-medium hover:underline">
                  {f.name}
                </Link>
                <div className="text-xs text-zinc-500">
                  {[f.location, f.state, f.month].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="w-40 shrink-0">
                <StatusSelect festivalId={f.id} season={season} status={status} festivalName={f.name} />
              </div>
            </div>
            {f.deadline && (
              <div className="text-xs">
                <span className="text-zinc-500">{t("deadlineLabel")} </span>
                <Deadline text={f.deadline} info={deadline} highlight={status === "open"} inline />
              </div>
            )}
            {f.contact && (
              <div className="text-xs">
                <Contact text={f.contact} />
              </div>
            )}
            {(a?.appliedOn || a?.note) && (
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                {a?.appliedOn && `${t("appliedOnSentence", { date: formatDate(a.appliedOn, locale) })} `}
                {a?.note}
              </div>
            )}
          </li>
        ))}
      </ul>

      {rows.length === 0 && <EmptyState>{t("empty")}</EmptyState>}
    </Page>
  );
}
