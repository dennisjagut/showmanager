"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useOptimistic, useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PhoneLink } from "@/features/contacts/components/ContactChannels";
import { ContactPicker, type PickerFilters } from "@/features/contacts/components/ContactPicker";
import { CONTACT_KIND_ICON, type ContactKind } from "@/features/contacts/kinds";
import { setShowContacts } from "@/features/shows/actions";
import { contactsOf, positionAt } from "@/features/shows/infos";
import type { ContactDetails, ShowContact, ShowContacts } from "@/lib/api/types";
import { cn } from "@/lib/cn";

type Role = ShowContact["role"];

// Per role: how the picker opens. The venue is a single organization, promoters and people to talk to can be several.
const ROLES: { role: Role; defaults: PickerFilters; single?: boolean; onlyKind?: ContactKind }[] = [
  { role: "venue", defaults: { kind: "organization", role: "venue" }, single: true, onlyKind: "organization" },
  { role: "promoter", defaults: { kind: null, role: "promoter" } },
  { role: "contact", defaults: { kind: "person", role: null } },
];

// The IDs per role as the API takes them
function body(ids: (role: Role) => number[]): ShowContacts {
  return { venue: ids("venue")[0] ?? null, promoters: ids("promoter"), contacts: ids("contact") };
}

/**
 * Venue, promoters and people to talk to of a show, linked from the contact list. The buttons open the picker in a
 * drawer (on the phone a sheet from the bottom); a choice there and ✕ here save right away.
 */
export function ShowContactsCard({
  showId,
  contacts,
  allContacts,
}: {
  showId: number;
  contacts: ShowContact[];
  // The whole contact list, to pick from
  allContacts: ContactDetails[];
}) {
  const t = useTranslations("showContacts");
  const router = useRouter();
  const [picking, setPicking] = useState<Role | null>(null);
  // The role whose picker is open or was open last, so the drawer keeps its content while it closes
  const [shown, setShown] = useState<Role>("venue");
  const [saving, startSaving] = useTransition();
  const [current, setOptimistic] = useOptimistic(contacts);
  const details = new Map(allContacts.map((d) => [d.contact.id, d]));

  const ids = (role: Role) => contactsOf(current, role).map((d) => d.contact.id);
  const promoterIds = ids("promoter");
  const venue = contactsOf(current, "venue")[0];

  // Saves all roles, with the IDs of one role replaced
  function save(role: Role, roleIds: number[], then?: () => void) {
    const next = (r: Role) => (r === role ? roleIds : ids(r));
    startSaving(async () => {
      setOptimistic(
        ROLES.flatMap(({ role: r }) =>
          next(r).flatMap((id) => {
            const d = details.get(id);
            return d ? [{ role: r, details: d }] : [];
          }),
        ),
      );
      await setShowContacts(showId, body(next));
      then?.();
    });
  }

  function open(role: Role) {
    setShown(role);
    setPicking(role);
    // Contacts added in another tab meanwhile show up in the list
    router.refresh();
  }

  // Suggested first: for promoters the venue (clubs often book themselves), for people those of venue and promoters
  const organizations = [...(venue ? [venue] : []), ...contactsOf(current, "promoter")].filter(
    (d, i, list) => d.contact.kind === "organization" && list.findIndex((x) => x.contact.id === d.contact.id) === i,
  );
  const orgIds = organizations.map((d) => d.contact.id);
  const people = allContacts.filter(
    (d) => d.contact.kind === "person" && d.links.some((l) => orgIds.includes(l.contact.id)),
  );
  const suggested =
    shown === "promoter" && venue
      ? { label: t("theVenue"), ids: [venue.contact.id] }
      : shown === "contact" && people.length > 0
        ? {
            label: t("atOrganizations", { names: organizations.map((d) => d.contact.name).join(", ") }),
            ids: people.map((d) => d.contact.id),
          }
        : undefined;
  const config = ROLES.find((r) => r.role === shown)!;

  return (
    <Card title={t("title")} className={cn("space-y-4", saving && "opacity-70 transition-opacity")}>
      {ROLES.map(({ role, single }) => {
        const list = contactsOf(current, role);
        return (
          <section key={role} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">{t(`roles.${role}`)}</h3>
              <button
                type="button"
                onClick={() => open(role)}
                className="btn-secondary px-2.5 py-1 text-xs pointer-coarse:min-h-11"
              >
                {single && list.length > 0 ? t("change") : t(`add.${role}`)}
              </button>
            </div>
            {list.length === 0 && <p className="text-sm text-zinc-500">{t(`empty.${role}`)}</p>}
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {list.map((d) => {
                const c = d.contact;
                const position = positionAt(d, promoterIds);
                const address = role === "venue" ? [c.street, c.location].filter(Boolean).join(", ") : null;
                return (
                  <li key={c.id} className="flex items-start gap-2 py-2 text-sm">
                    <span aria-hidden>{CONTACT_KIND_ICON[c.kind]}</span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/contacts/${c.id}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                      {address && <div className="text-xs text-zinc-500">{address}</div>}
                      {position && <div className="text-xs text-zinc-500">{position}</div>}
                      <div className="flex flex-wrap gap-x-3 text-xs">
                        {c.phone && <PhoneLink phone={c.phone} />}
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="truncate link">
                            {c.email}
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        save(
                          role,
                          ids(role).filter((x) => x !== c.id),
                        )
                      }
                      aria-label={t("remove", { name: c.name })}
                      title={t("remove", { name: c.name })}
                      className="btn-danger shrink-0 px-2 py-1.5 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
                    >
                      <Icon name="cross" className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <ContactPicker
        open={picking !== null}
        onClose={() => setPicking(null)}
        title={t(`pick.${shown}`)}
        description={t("pickHint")}
        contacts={allContacts}
        selected={ids(shown)}
        defaults={config.defaults}
        single={config.single}
        onlyKind={config.onlyKind}
        suggested={suggested}
        saving={saving}
        onConfirm={(picked) => save(shown, picked, () => setPicking(null))}
      />
    </Card>
  );
}
