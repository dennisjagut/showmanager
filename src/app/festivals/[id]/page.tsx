import { getTranslations } from "next-intl/server";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Page, PageHeader } from "@/components/ui/Page";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { deleteApplication, deleteFestival, saveApplication } from "@/features/applications/actions";
import { Contact, WebsiteLink } from "@/features/applications/components/Contact";
import { Deadline } from "@/features/applications/components/Deadline";
import { FestivalForm } from "@/features/applications/components/FestivalForm";
import { getFestival } from "@/features/applications/api";
import { APPLICATION_STATUSES, APPLICATION_STATUS_TONE } from "@/features/applications/status";
import type { ApplicationWithDeadline } from "@/lib/api/types";
import { type SearchParams, param } from "@/lib/search-params";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function FestivalPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const [data, t, tc, ts] = await Promise.all([
    getFestival(id),
    getTranslations("festival"),
    getTranslations("common"),
    getTranslations("applicationStatus"),
  ]);
  const { festival: f, applications, seasons } = data;

  // The season the overview showed, for the back link and as the suggestion for a new application
  const requested = Number(param(sp, "season"));
  const season = seasons.all.includes(requested) ? requested : seasons.current;
  const existing = new Set(applications.map((a) => a.season));
  const newSeasons = seasons.all.filter((s) => !existing.has(s));

  return (
    <Page>
      <PageHeader
        back={{ href: `/?season=${season}`, label: tc("backToOverview") }}
        title={
          <>
            {f.name}
            {!f.active && <span className="ml-2 align-middle text-sm font-normal text-rose-600">{t("inactive")}</span>}
          </>
        }
        description={
          <>
            <p>{[f.location, f.state, f.month].filter(Boolean).join(" · ")}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-zinc-900 dark:text-zinc-100">
              <WebsiteLink url={f.website} />
              <Contact text={f.contact} />
            </div>
          </>
        }
        actions={param(sp, "saved") && <Notice>{tc("saved")}</Notice>}
      />

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="space-y-3">
          <h2 className="section-title">{t("applications")}</h2>
          {applications.map((a) => (
            <ApplicationCard key={a.id} application={a} deadline={f.deadline} />
          ))}
          {applications.length === 0 && (
            <p className="text-sm text-zinc-500">{t("noApplications", { status: ts("open") })}</p>
          )}
          {newSeasons.length > 0 && (
            <Card dashed className="p-3">
              <form action={saveApplication} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="festivalId" value={f.id} />
                <input type="hidden" name="status" value="open" />
                <SelectField
                  label={t("addSeason")}
                  name="season"
                  inputClassName="py-1.5"
                  defaultValue={newSeasons.includes(season) ? season : undefined}
                  options={newSeasons.map((s) => ({ value: s, label: String(s) }))}
                />
                <SubmitButton className="btn-secondary">{t("create")}</SubmitButton>
              </form>
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <Card title={t("masterData")}>
            <FestivalForm festival={f} />
          </Card>
          <ActionButton
            action={deleteFestival}
            values={{ id: f.id }}
            confirm={t("deleteConfirm", { name: f.name })}
            formClassName="text-right"
            className="btn-danger text-xs"
          >
            {t("delete")}
          </ActionButton>
        </section>
      </div>
    </Page>
  );
}

async function ApplicationCard({
  application: a,
  deadline,
}: {
  application: ApplicationWithDeadline;
  // free text of the festival
  deadline: string | null;
}) {
  const [t, ts, th, tc] = await Promise.all([
    getTranslations("festival"),
    getTranslations("applicationStatus"),
    getTranslations("applicationStatusHint"),
    getTranslations("common"),
  ]);
  return (
    <Card
      title={t("season", { season: a.season })}
      actions={<Badge tone={APPLICATION_STATUS_TONE[a.status]}>{ts(a.status)}</Badge>}
    >
      <form action={saveApplication} className="space-y-3">
        <input type="hidden" name="festivalId" value={a.festivalId} />
        <input type="hidden" name="season" value={a.season} />
        {deadline && (
          <p className="text-xs text-zinc-500">
            {t("deadlineLabel")} <Deadline text={deadline} info={a.deadline} highlight={a.status === "open"} />
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <SelectField
            label={t("status")}
            name="status"
            defaultValue={a.status}
            options={APPLICATION_STATUSES.map((s) => ({
              value: s,
              label: t("statusOption", { label: ts(s), hint: th(s) }),
            }))}
          />
          <TextField
            label={t("appliedOn")}
            type="date"
            name="appliedOn"
            defaultValue={a.appliedOn ?? ""}
            inputClassName="w-44"
          />
        </div>
        <TextAreaField
          label={t("note")}
          name="note"
          defaultValue={a.note ?? ""}
          rows={2}
          placeholder={t("notePlaceholder")}
        />
        <div className="flex items-center justify-between">
          <SubmitButton className="btn-primary">{tc("save")}</SubmitButton>
          <SubmitButton
            formAction={deleteApplication}
            confirm={t("removeConfirm", { season: a.season })}
            className="btn-danger text-xs"
          >
            {t("remove")}
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}
