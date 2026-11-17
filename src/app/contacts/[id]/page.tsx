import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Facts, type Fact } from "@/components/ui/Facts";
import { Notice } from "@/components/ui/Notice";
import { Page, PageHeader } from "@/components/ui/Page";
import { WebsiteLink } from "@/features/applications/components/Contact";
import { deleteContact } from "@/features/contacts/actions";
import { getContact, getContactOptions } from "@/features/contacts/api";
import { PhoneLink } from "@/features/contacts/components/ContactChannels";
import { ContactEditor } from "@/features/contacts/components/ContactEditor";
import { CONTACT_KIND_ICON, CONTACT_ROLE_TONE, otherKind } from "@/features/contacts/kinds";
import { getShowsOfContact } from "@/features/shows/api";
import { SHOW_STATUS_TONE } from "@/features/shows/status";
import { formatDate } from "@/lib/dates";
import { mapsSearchUrl } from "@/lib/maps";
import { param, type SearchParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
};

// A contact opens as a read view; "Bearbeiten" switches the same page to the edit mode (?bearbeiten=1)
export default async function ContactPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const [details, shows, t, tf, tk, tr, tc, tsc, ts, locale] = await Promise.all([
    getContact(id),
    getShowsOfContact(id),
    getTranslations("contacts"),
    getTranslations("contactForm"),
    getTranslations("contactKind"),
    getTranslations("contactRole"),
    getTranslations("common"),
    getTranslations("showContacts"),
    getTranslations("showStatus"),
    getLocale(),
  ]);
  const { contact: c, roles, links } = details;
  const readHref = `/contacts/${c.id}`;

  if (param(sp, "bearbeiten") === "1") {
    const candidates = await getContactOptions({ kind: otherKind(c.kind) });
    return (
      <Page>
        <PageHeader title={t("editTitle", { name: c.name })} />
        {/* A new key for another contact, so the editor does not keep the draft of the previous one */}
        <ContactEditor key={c.id} details={details} candidates={candidates} readHref={readHref} />
      </Page>
    );
  }

  const address = [c.street, c.location].filter(Boolean).join(", ");
  const facts: Fact[] = [
    {
      label: tf("email"),
      value: c.email && (
        <a href={`mailto:${c.email}`} className="link">
          {c.email}
        </a>
      ),
    },
    { label: tf("phone"), value: c.phone && <PhoneLink phone={c.phone} /> },
    { label: tf("website"), value: c.website && <WebsiteLink url={c.website} /> },
    {
      label: tf("address"),
      value: address && (
        <>
          {c.street && <div>{c.street}</div>}
          {c.location && <div>{c.location}</div>}
          <a href={mapsSearchUrl(address)} target="_blank" rel="noreferrer" className="link">
            {tc("map")}
          </a>
        </>
      ),
    },
    { label: tf("notes"), value: c.notes && <span className="whitespace-pre-line">{c.notes}</span> },
  ];

  return (
    <Page>
      <PageHeader
        back={{ href: "/contacts", label: t("allContacts") }}
        title={
          <>
            <span aria-hidden className="mr-2">
              {CONTACT_KIND_ICON[c.kind]}
            </span>
            {c.name}
          </>
        }
        description={
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span>{tk(c.kind)}</span>
            {roles.map((r) => (
              <Badge key={r} tone={CONTACT_ROLE_TONE[r]}>
                {tr(r)}
              </Badge>
            ))}
          </div>
        }
        actions={
          <>
            {param(sp, "saved") && <Notice>{tc("saved")}</Notice>}
            <Link href={`${readHref}?bearbeiten=1`} className="btn-secondary pointer-coarse:min-h-11">
              {tc("edit")}
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="space-y-3">
          <h2 className="section-title">{t("details")}</h2>
          <Card>
            {facts.some((fact) => fact.value) ? (
              <Facts items={facts} />
            ) : (
              <p className="text-sm text-zinc-500">{t("noDetails")}</p>
            )}
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="section-title">{t(`links.${c.kind}`)}</h2>
          {links.length > 0 ? (
            <Card className="p-0">
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {links.map((l) => (
                  <li key={l.contact.id} className="flex items-start gap-2 px-4 py-3 text-sm">
                    <span aria-hidden>{CONTACT_KIND_ICON[l.contact.kind]}</span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/contacts/${l.contact.id}`} className="font-medium link">
                        {l.contact.name}
                      </Link>
                      {l.position && <div className="text-zinc-500">{l.position}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <p className="text-sm text-zinc-500">{t(`noLinks.${c.kind}`)}</p>
          )}
          <h2 className="pt-3 section-title">{t("shows")}</h2>
          {shows.length > 0 ? (
            <Card className="p-0">
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {shows.map(({ show: s, roles: showRoles }) => (
                  <li key={s.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                    <span className="w-24 shrink-0 text-zinc-500 tabular-nums">{formatDate(s.date, locale)}</span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/shows/${s.id}`} className="font-medium link">
                        {s.title}
                      </Link>
                      <div className="text-zinc-500">{showRoles.map((r) => tsc(`roleAtShow.${r}`)).join(" · ")}</div>
                    </div>
                    {s.status !== "confirmed" && <Badge tone={SHOW_STATUS_TONE[s.status]}>{ts(s.status)}</Badge>}
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <p className="text-sm text-zinc-500">{t("noShows")}</p>
          )}
          <ActionButton
            action={deleteContact}
            values={{ id: c.id }}
            confirm={t("deleteConfirm", { name: c.name })}
            formClassName="text-right"
            className="btn-danger text-xs"
          >
            {t(`delete.${c.kind}`)}
          </ActionButton>
        </section>
      </div>
    </Page>
  );
}
