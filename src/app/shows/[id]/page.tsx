import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ActionButton, RemoveButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { BackLink, Page } from "@/components/ui/Page";
import { ResetForm } from "@/components/ui/ResetForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { addGuest, deleteGuest, deleteScheduleItem, deleteShow } from "@/features/shows/actions";
import { DateBlock } from "@/features/shows/components/DateBlock";
import { RelativeDay } from "@/features/shows/components/RelativeDay";
import { ContactInfo, LogisticsInfo } from "@/features/shows/components/Infos";
import { PackingListCard } from "@/features/shows/components/PackingListCard";
import { ScheduleInput } from "@/features/shows/components/ScheduleInput";
import { formatLongDate } from "@/lib/dates";
import { guestCount, mapsLink, place } from "@/features/shows/infos";
import { getShow, getTemplates } from "@/features/shows/api";
import { SHOW_STATUS_TONE } from "@/features/shows/status";

export const dynamic = "force-dynamic";

export default async function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, templateList, t, tc, ts, locale] = await Promise.all([
    getShow(id),
    getTemplates(),
    getTranslations("show"),
    getTranslations("common"),
    getTranslations("showStatus"),
    getLocale(),
  ]);
  const { show: s, schedule, guests, packing } = data;

  const people = guestCount(guests);
  const mapUrl = mapsLink(s);
  const full = s.guestQuota !== null && people >= s.guestQuota;

  return (
    <Page>
      <BackLink href="/shows">{tc("allShows")}</BackLink>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <DateBlock date={s.date} large />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{s.title}</h1>
              <Badge tone={SHOW_STATUS_TONE[s.status]}>{ts(s.status)}</Badge>
            </div>
            <p className="text-sm text-zinc-500">
              {formatLongDate(s.date, locale)} · <RelativeDay date={s.date} />
              {s.tour && ` · ${s.tour}`}
            </p>
            {(s.venue || s.address) && (
              <p className="text-sm">
                {place(s)}
                {mapUrl && (
                  <>
                    {" "}
                    <a href={mapUrl} target="_blank" rel="noreferrer" className="link">
                      {tc("map")}
                    </a>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/shows/${s.id}/daysheet`} className="btn-secondary">
            {t("daysheet")}
          </Link>
          <Link href={`/shows/${s.id}/edit`} className="btn-primary">
            {tc("edit")}
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <Card title={t("schedule")}>
            {schedule.length === 0 && <p className="text-sm text-zinc-500">{t("noSchedule")}</p>}
            <ol className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {schedule.map((p) => (
                <li key={p.id} className="flex items-center gap-4 py-2">
                  <span className="w-14 font-mono font-semibold tabular-nums">{p.time}</span>
                  <span className="flex-1">{p.item}</span>
                  <RemoveButton
                    action={deleteScheduleItem}
                    values={{ id: p.id, showId: s.id }}
                    label={tc("remove", { name: p.item })}
                  />
                </li>
              ))}
            </ol>
            <ScheduleInput showId={s.id} templates={templateList} />
          </Card>

          <Card
            title={t("guestList")}
            actions={
              <span className={`text-sm ${full ? "font-medium text-rose-600" : "text-zinc-500"}`}>
                {s.guestQuota !== null
                  ? t("peopleOfQuota", { count: people, quota: s.guestQuota })
                  : t("people", { count: people })}
              </span>
            }
          >
            {guests.length > 0 && (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {guests.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 py-2 text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{g.name}</span>
                      {g.plusOnes > 0 && <span className="text-zinc-500"> +{g.plusOnes}</span>}
                      {(g.addedBy || g.note) && (
                        <div className="text-xs text-zinc-500">
                          {[g.addedBy && t("via", { name: g.addedBy }), g.note].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                    <RemoveButton
                      action={deleteGuest}
                      values={{ id: g.id, showId: s.id }}
                      label={tc("remove", { name: g.name })}
                    />
                  </li>
                ))}
              </ul>
            )}
            <ResetForm action={addGuest} className="grid gap-2 sm:grid-cols-[1fr_5rem_1fr_auto] sm:items-end">
              <input type="hidden" name="showId" value={s.id} />
              <TextField label={tc("name")} name="name" required />
              <TextField
                label={t("plusOnes")}
                name="plusOnes"
                type="number"
                min={0}
                max={10}
                defaultValue={0}
                inputMode="numeric"
              />
              <TextField label={t("addedBy")} name="addedBy" placeholder={t("addedByPlaceholder")} />
              <SubmitButton className="btn-secondary">{tc("add")}</SubmitButton>
            </ResetForm>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={t("infos")} className="space-y-4">
            <ContactInfo show={s} />
            <LogisticsInfo show={s} />
            {!s.contactName && !s.fee && !s.travel && !s.hotel && !s.tech && !s.notes && (
              <p className="text-sm text-zinc-500">
                {t("noInfos")}{" "}
                <Link href={`/shows/${s.id}/edit`} className="link">
                  {t("addInfos")}
                </Link>
              </p>
            )}
          </Card>

          <PackingListCard showId={s.id} packing={packing} />
        </div>
      </div>

      <ActionButton
        action={deleteShow}
        values={{ id: s.id }}
        confirm={t("deleteConfirm", { title: s.title })}
        formClassName="text-right"
        className="btn-danger text-xs"
      >
        {t("delete")}
      </ActionButton>
    </Page>
  );
}
