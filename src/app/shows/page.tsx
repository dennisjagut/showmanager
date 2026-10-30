import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Card";
import { FilterChip } from "@/components/ui/Chip";
import { LoadingLink } from "@/components/ui/LoadingLink";
import { Page, PageHeader } from "@/components/ui/Page";
import { Segmented, segmentClass } from "@/components/ui/Segmented";
import { Countdown } from "@/features/shows/components/Countdown";
import { DateBlock } from "@/features/shows/components/DateBlock";
import { listShows } from "@/features/shows/api";
import { SHOW_STATUS_TONE } from "@/features/shows/status";
import { linkWith, param, type SearchParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

const VIEWS = ["upcoming", "past", "all"] as const;

export default async function ShowOverview({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const view = VIEWS.find((v) => v === param(sp, "view")) ?? "upcoming";
  const tour = param(sp, "tour");
  const [{ next, confirmed, options, tours: tourList, shows: visible }, t, ts] = await Promise.all([
    listShows(sp),
    getTranslations("shows"),
    getTranslations("showStatus"),
  ]);
  const link = (changes: Record<string, string | null>) => linkWith("/shows", sp, changes);

  return (
    <Page>
      <PageHeader
        title={t("title")}
        description={t("summary", { confirmed, options })}
        actions={
          <>
            <Link href="/shows/templates" className="btn-secondary">
              {t("templates")}
            </Link>
            <Link href="/shows/new" className="btn-primary">
              {t("newShow")}
            </Link>
          </>
        }
      />

      {next && (
        <Link
          href={`/shows/${next.show.id}`}
          className="flex items-center gap-4 rounded-xl bg-gradient-to-br from-brand-600 to-fuchsia-600 p-4 text-white shadow-sm transition hover:opacity-95"
        >
          <Countdown date={next.show.date} />
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold">{next.show.title}</div>
            <div className="truncate text-sm opacity-90">
              {[next.show.venue, next.show.address].filter(Boolean).join(" · ")}
            </div>
            <div className="mt-1 text-sm opacity-90">
              {next.showtime ? `${t("showtime", { time: next.showtime })} · ` : ""}
              {t("toShow")}
            </div>
          </div>
        </Link>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Segmented>
          {VIEWS.map((key) => (
            <LoadingLink key={key} href={link({ view: key })} className={segmentClass(view === key)}>
              {t(`views.${key}`)}
            </LoadingLink>
          ))}
        </Segmented>
        {tourList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <FilterChip href={link({ tour: null })} active={!tour}>
              {t("allTours")}
            </FilterChip>
            {tourList.map((name) => (
              <FilterChip key={name} href={link({ tour: name })} active={tour === name} dimmed={!!tour}>
                {name}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      <ul className="space-y-2">
        {visible.map(({ show: s, showtime, guestCount }) => (
          <li key={s.id}>
            <Link
              href={`/shows/${s.id}`}
              className={`flex items-center gap-4 card p-3 transition hover:border-brand-300 dark:hover:border-brand-700 ${s.status === "cancelled" ? "opacity-60" : ""}`}
            >
              <DateBlock date={s.date} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-medium ${s.status === "cancelled" ? "line-through" : ""}`}>{s.title}</span>
                  <Badge tone={SHOW_STATUS_TONE[s.status]}>{ts(s.status)}</Badge>
                  {s.tour && <span className="text-xs text-zinc-500">{s.tour}</span>}
                </div>
                <div className="truncate text-sm text-zinc-500">
                  {[s.venue, s.address].filter(Boolean).join(" · ") || t("venueOpen")}
                </div>
              </div>
              <div className="hidden shrink-0 text-right text-xs text-zinc-500 sm:block">
                {showtime && (
                  <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {t("time", { time: showtime })}
                  </div>
                )}
                {(guestCount > 0 || s.guestQuota) && (
                  <div>
                    {s.guestQuota
                      ? t("guestsOfQuota", { count: guestCount, quota: s.guestQuota })
                      : t("guests", { count: guestCount })}
                  </div>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <EmptyState>
          {view === "upcoming" ? t("emptyUpcoming") : t("empty")}{" "}
          <Link href="/shows/new" className="link">
            {t("create")}
          </Link>
        </EmptyState>
      )}
    </Page>
  );
}
