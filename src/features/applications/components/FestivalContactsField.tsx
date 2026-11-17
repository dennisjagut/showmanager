"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { ContactPicker } from "@/features/contacts/components/ContactPicker";
import { CONTACT_KIND_ICON } from "@/features/contacts/kinds";
import type { ContactDetails } from "@/lib/api/types";

/**
 * Contacts of a festival in its editor, only from the contact list. "+ Kontakt" opens the picker in a drawer (on the
 * phone a sheet from the bottom); the choice only changes the draft, it is saved with the rest of the festival.
 */
export function FestivalContactsField({
  festivalName,
  value,
  changed,
  allContacts,
  onChange,
}: {
  festivalName: string;
  // Contact IDs in their order
  value: number[];
  changed: boolean;
  // The whole contact list, to pick from
  allContacts: ContactDetails[];
  onChange: (ids: number[]) => void;
}) {
  const t = useTranslations("festival");
  const tf = useTranslations("festivalForm");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const byId = new Map(allContacts.map((d) => [d.contact.id, d]));
  const linked = value.flatMap((id) => byId.get(id) ?? []);

  // Suggested first: organizations named like the festival, and the people of the organizations already linked
  const name = festivalName.trim().toLowerCase();
  const orgIds = linked.filter((d) => d.contact.kind === "organization").map((d) => d.contact.id);
  const suggested = allContacts.filter(
    (d) =>
      (d.contact.kind === "organization" && name.length > 2 && d.contact.name.toLowerCase().includes(name)) ||
      (d.contact.kind === "person" && d.links.some((l) => orgIds.includes(l.contact.id))),
  );

  return (
    <Field as="div" label={tf("contacts")} changed={changed}>
      {linked.length > 0 ? (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {linked.map(({ contact: c }) => (
            <li key={c.id} className="flex items-start gap-2 py-1.5 text-sm">
              <span aria-hidden>{CONTACT_KIND_ICON[c.kind]}</span>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{c.name}</div>
                {(c.email || c.phone) && (
                  <div className="truncate text-xs text-zinc-500">{[c.email, c.phone].filter(Boolean).join(" · ")}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onChange(value.filter((id) => id !== c.id))}
                aria-label={t("removeContact", { name: c.name })}
                title={t("removeContact", { name: c.name })}
                className="btn-danger shrink-0 px-2 py-1 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
              >
                <Icon name="cross" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">{t("noContacts")}</p>
      )}
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          // Contacts added in another tab meanwhile show up in the list
          router.refresh();
        }}
        className="mt-2 btn-secondary px-2.5 py-1 text-xs pointer-coarse:min-h-11"
      >
        {t("addContact")}
      </button>

      <ContactPicker
        open={open}
        onClose={() => setOpen(false)}
        title={t("pickContacts")}
        description={t("pickContactsHint")}
        contacts={allContacts}
        selected={value}
        defaults={{ kind: null, role: null }}
        suggested={
          suggested.length > 0 ? { label: t("suggestedContacts"), ids: suggested.map((d) => d.contact.id) } : undefined
        }
        onConfirm={(ids) => {
          onChange(ids);
          setOpen(false);
        }}
      />
    </Field>
  );
}
