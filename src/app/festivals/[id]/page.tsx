import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Facts, type Fact } from "@/components/ui/Facts";
import { Notice } from "@/components/ui/Notice";
import { Page, PageHeader } from "@/components/ui/Page";
import { deleteFestival } from "@/features/applications/actions";
import { Contact, WebsiteLink } from "@/features/applications/components/Contact";
import { Deadline } from "@/features/applications/components/Deadline";
import { FestivalEditor } from "@/features/applications/components/FestivalEditor";
import { getFestival } from "@/features/applications/api";
import { APPLICATION_STATUS_TONE } from "@/features/applications/status";
import type { ApplicationWithDeadline } from "@/lib/api/types";
import { formatDate } from "@/lib/dates";
import { type SearchParams, param } from "@/lib/search-params";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

// A festival opens as a read view; "Bearbeiten" switches the same page to the edit mode (?bearbeiten=1)
export default async function FestivalPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const [data, t, tf, tc, ts] = await Promise.all([
    getFestival(id),
    getTranslations("festival"),
    getTranslations("festivalForm"),
    getTranslations("common"),
    getTranslations("applicationStatus"),
  ]);
  const { festival: f, applications, seasons } = data;

  // The season the overview showed, for the back link and as the suggestion for a new application
  const requested = Number(param(sp, "season"));
  const season = seasons.all.includes(requested) ? requested : seasons.current;
  const readHref = `/festivals/${f.id}?season=${season}`;

  if (param(sp, "bearbeiten") === "1") {
    return (
      <Page>
        <PageHeader title={t("editTitle", { name: f.name })} />
        {/* A new key for another festival, so the editor does not keep the draft of the previous one */}
        <FestivalEditor key={f.id} details={data} season={season} readHref={readHref} />
      </Page>
    );
  }

  const facts: Fact[] = [
    { label: tf("deadline"), value: f.deadline },
    { label: tf("contact"), value: f.contact && <Contact text={f.contact} /> },
    { label: tf("website"), value: f.website && <WebsiteLink url={f.website} /> },
    { label: tf("notes"), value: f.notes && <span className="whitespace-pre-line">{f.notes}</span> },
  ];

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
        description={[f.location, f.state, f.month].filter(Boolean).join(" · ")}
        actions={
          <>
            {param(sp, "saved") && <Notice>{tc("saved")}</Notice>}
            <Link href={`${readHref}&bearbeiten=1`} className="btn-secondary pointer-coarse:min-h-11">
              {tc("edit")}
            </Link>
          </>
        }
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
        </section>

        <section className="space-y-3">
          <h2 className="section-title">{t("masterData")}</h2>
          <Card>
            {facts.some((fact) => fact.value) ? (
              <Facts items={facts} />
            ) : (
              <p className="text-sm text-zinc-500">{t("noMasterData")}</p>
            )}
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
  const [t, tf, ts, locale] = await Promise.all([
    getTranslations("festival"),
    getTranslations("festivalForm"),
    getTranslations("applicationStatus"),
    getLocale(),
  ]);
  return (
    <Card
      title={t("season", { season: a.season })}
      actions={<Badge tone={APPLICATION_STATUS_TONE[a.status]}>{ts(a.status)}</Badge>}
    >
      <Facts
        items={[
          {
            label: tf("deadline"),
            value: deadline && <Deadline text={deadline} info={a.deadline} highlight={a.status === "open"} inline />,
          },
          { label: t("appliedOn"), value: a.appliedOn && formatDate(a.appliedOn, locale) },
          { label: t("note"), value: a.note && <span className="whitespace-pre-line">{a.note}</span> },
        ]}
      />
    </Card>
  );
}
