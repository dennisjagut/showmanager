"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useOptimistic, useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { PhoneLink } from "@/features/contacts/components/ContactChannels";
import { ContactPicker, type PickerFilters } from "@/features/contacts/components/ContactPicker";
import { CONTACT_KIND_ICON } from "@/features/contacts/kinds";
import { setShowContacts } from "@/features/shows/actions";
import { contactsOf, positionAt } from "@/features/shows/infos";
import type { ContactDetails, ShowContact, ShowContacts } from "@/lib/api/types";
import { cn } from "@/lib/cn";

type Role = ShowContact["role"];

const ROLES: { role: Role; key: keyof ShowContacts; defaults: PickerFilters }[] = [
  { role: "promoter", key: "promoters", defaults: { kind: null, role: "promoter" } },
  { role: "contact", key: "contacts", defaults: { kind: "person", role: null } },
];

/**
 * Promoters and people to talk to of a show, linked from the contact list. "+ …" opens the picker in a drawer (on the
 * phone a sheet from the bottom); a choice there and ✕ here save right away.
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
  const [shown, setShown] = useState<Role>("promoter");
  const [saving, startSaving] = useTransition();
  const [current, setOptimistic] = useOptimistic(contacts);

  const ids = (role: Role) => contactsOf(current, role).map((d) => d.contact.id);
  const promoterIds = ids("promoter");

  function save(changes: Partial<ShowContacts>, then?: () => void) {
    const body: ShowContacts = { promoters: ids("promoter"), contacts: ids("contact"), ...changes };
    const details = new Map(allContacts.map((d) => [d.contact.id, d]));
    startSaving(async () => {
      setOptimistic(
        ROLES.flatMap(({ role, key }) =>
          (body[key] ?? []).flatMap((id) => {
            const d = details.get(id);
            return d ? [{ role, details: d }] : [];
          }),
        ),
      );
      await setShowContacts(showId, body);
      then?.();
    });
  }

  function open(role: Role) {
    setShown(role);
    setPicking(role);
    // Contacts added in another tab meanwhile show up in the list
    router.refresh();
  }

  // People of the show's promoters come first when picking people to talk to
  const promoterPeople = allContacts.filter(
    (d) => d.contact.kind === "person" && d.links.some((l) => promoterIds.includes(l.contact.id)),
  );
  const promoterNames = contactsOf(current, "promoter")
    .filter((d) => d.contact.kind === "organization")
    .map((d) => d.contact.name);
  const config = ROLES.find((r) => r.role === shown)!;

  return (
    <Card title={t("title")} className={cn("space-y-4", saving && "opacity-70 transition-opacity")}>
      {ROLES.map(({ role }) => {
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
                {t(`add.${role}`)}
              </button>
            </div>
            {list.length === 0 && <p className="text-sm text-zinc-500">{t(`empty.${role}`)}</p>}
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {list.map((d) => {
                const c = d.contact;
                const position = positionAt(d, promoterIds);
                return (
                  <li key={c.id} className="flex items-start gap-2 py-2 text-sm">
                    <span aria-hidden>{CONTACT_KIND_ICON[c.kind]}</span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/contacts/${c.id}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
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
                        save({ [role === "promoter" ? "promoters" : "contacts"]: ids(role).filter((x) => x !== c.id) })
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
        suggested={
          shown === "contact" && promoterPeople.length > 0
            ? {
                label:
                  promoterNames.length > 0 ? t("atPromoter", { names: promoterNames.join(", ") }) : t("ofPromoter"),
                ids: promoterPeople.map((d) => d.contact.id),
              }
            : undefined
        }
        saving={saving}
        onConfirm={(picked) => save({ [config.key]: picked }, () => setPicking(null))}
      />
    </Card>
  );
}
