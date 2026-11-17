import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Card";
import { FilterChip } from "@/components/ui/Chip";
import { LoadingLink } from "@/components/ui/LoadingLink";
import { Page, PageHeader } from "@/components/ui/Page";
import { Segmented, segmentClass } from "@/components/ui/Segmented";
import { getContacts } from "@/features/contacts/api";
import { ContactChannels } from "@/features/contacts/components/ContactChannels";
import { ContactSearch } from "@/features/contacts/components/ContactSearch";
import {
  CONTACT_KINDS,
  CONTACT_KIND_ICON,
  CONTACT_ROLES,
  CONTACT_ROLE_TONE,
  isContactKind,
  isContactRole,
  rolesFor,
} from "@/features/contacts/kinds";
import type { ContactDetails } from "@/lib/api/types";
import { linkWith, param, type SearchParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

export default async function Contacts({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const [list, t, tk, tr] = await Promise.all([
    getContacts(sp),
    getTranslations("contacts"),
    getTranslations("contactKinds"),
    getTranslations("contactRole"),
  ]);
  const kindParam = param(sp, "kind");
  const roleParam = param(sp, "role");
  const kind = isContactKind(kindParam) ? kindParam : null;
  const role = isContactRole(roleParam) ? roleParam : null;
  const link = (changes: Record<string, string | null>) => linkWith("/contacts", sp, changes);
  // With a kind chosen, only its roles; a chosen role stays visible so it can be removed again
  const roles = CONTACT_ROLES.filter((r) => (kind ? rolesFor(kind).includes(r) : true) || r === role);
  const total = list.kinds.person + list.kinds.organization;
  const filtered = !!(kind || role || param(sp, "q"));

  return (
    <Page>
      <PageHeader
        title={t("title")}
        description={t("intro")}
        actions={
          <>
            <a href="/export/contacts" className="btn-secondary">
              {t("exportCsv")}
            </a>
            <Link href="/contacts/new?kind=person" className="btn-secondary">
              {t("newPerson")}
            </Link>
            <Link href="/contacts/new?kind=organization" className="btn-primary">
              {t("newOrganization")}
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <nav aria-label={t("kindsLabel")} className="max-w-full overflow-x-auto">
          <Segmented>
            <LoadingLink href={link({ kind: null })} className={segmentClass(!kind)}>
              {tk("all")} <span className="tabular-nums opacity-60">{total}</span>
            </LoadingLink>
            {CONTACT_KINDS.map((k) => (
              <LoadingLink key={k} href={link({ kind: k })} className={segmentClass(kind === k)}>
                <span aria-hidden>{CONTACT_KIND_ICON[k]}</span> {tk(k)}{" "}
                <span className="tabular-nums opacity-60">{list.kinds[k]}</span>
              </LoadingLink>
            ))}
          </Segmented>
        </nav>
        <ContactSearch />
      </div>

      <div className="flex flex-wrap gap-2">
        {roles.map((r) => (
          <FilterChip
            key={r}
            // Clicking the active role again removes the filter
            href={link({ role: role === r ? null : r })}
            tone={CONTACT_ROLE_TONE[r]}
            active={role === r}
            dimmed={!!role}
          >
            {tr(r)}
            <span className="font-semibold tabular-nums">{list.roles[r]}</span>
          </FilterChip>
        ))}
      </div>

      {list.rows.length === 0 ? (
        <EmptyState>{filtered ? t("noResults") : t("empty")}</EmptyState>
      ) : (
        <>
          {/* Table from medium width */}
          <div className="hidden overflow-hidden card p-0 md:block">
            <table className="w-full table-fixed text-sm">
              <thead className="bg-zinc-50 text-left text-xs tracking-wide text-zinc-500 uppercase dark:bg-zinc-800/50">
                <tr>
                  <th className="w-[28%] px-3 py-2">{t("columns.name")}</th>
                  <th className="w-[22%] px-3 py-2">{t("columns.roles")}</th>
                  <th className="w-[22%] px-3 py-2">{t("columns.contact")}</th>
                  <th className="w-[28%] px-3 py-2">{t("columns.links")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {list.rows.map((row) => (
                  <tr key={row.contact.id} className="align-top">
                    <td className="px-3 py-2.5">
                      <NameCell row={row} />
                    </td>
                    <td className="px-3 py-2.5">
                      <RoleBadges row={row} />
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      <ContactChannels contact={row.contact} />
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      <Links row={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards on the phone */}
          <ul className="space-y-3 md:hidden">
            {list.rows.map((row) => (
              <li key={row.contact.id} className="space-y-2 card p-3 text-sm">
                <NameCell row={row} />
                <RoleBadges row={row} />
                <div className="text-xs">
                  <ContactChannels contact={row.contact} />
                </div>
                <div className="text-xs">
                  <Links row={row} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Page>
  );
}

function NameCell({ row: { contact: c } }: { row: ContactDetails }) {
  return (
    <div className="flex gap-2">
      <span aria-hidden>{CONTACT_KIND_ICON[c.kind]}</span>
      <div className="min-w-0">
        <Link href={`/contacts/${c.id}`} className="font-medium hover:underline">
          {c.name}
        </Link>
        {c.location && <div className="text-xs text-zinc-500">{c.location}</div>}
      </div>
    </div>
  );
}

async function RoleBadges({ row }: { row: ContactDetails }) {
  const tr = await getTranslations("contactRole");
  if (row.roles.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {row.roles.map((r) => (
        <Badge key={r} tone={CONTACT_ROLE_TONE[r]}>
          {tr(r)}
        </Badge>
      ))}
    </div>
  );
}

// Organizations of a person or people of an organization, each with the position
function Links({ row }: { row: ContactDetails }) {
  return (
    <ul className="space-y-0.5">
      {row.links.map((l) => (
        <li key={l.contact.id} className="truncate">
          <Link href={`/contacts/${l.contact.id}`} className="link">
            {l.contact.name}
          </Link>
          {l.position && <span className="text-zinc-500"> · {l.position}</span>}
        </li>
      ))}
    </ul>
  );
}
