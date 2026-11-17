"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DataList, SelectField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { linkKey, newLinkKey, type LinkDraft } from "@/features/contacts/draft";
import { CONTACT_KIND_ICON, otherKind, type ContactKind } from "@/features/contacts/kinds";
import type { ContactRef } from "@/lib/api/types";

// Value of the "new contact" entry in the select for adding a link
const NEW = "new";

/**
 * The organizations of a person or the people of an organization, each with a position: existing contacts of the other
 * kind, or new ones by name that are created when saving. Used when creating a contact and in its editor.
 */
export function ContactLinksEditor({
  kind,
  links,
  onChange,
  candidates,
  saved,
  errors = {},
  linkNames = true,
}: {
  // Kind of the contact being edited; the links are of the other kind
  kind: ContactKind;
  links: LinkDraft[];
  onChange: (links: LinkDraft[]) => void;
  // Contacts of the other kind that can be linked
  candidates: ContactRef[];
  // The links as saved, to mark changes and list removed ones; none for a new contact
  saved?: LinkDraft[];
  // Messages by link key, e.g. a missing name
  errors?: Record<string, string>;
  // Names as links to the contact; off where leaving the page would lose the input
  linkNames?: boolean;
}) {
  const t = useTranslations("contacts");
  const tk = useTranslations("contactKind");
  const tc = useTranslations("common");
  const other = otherKind(kind);
  const [choice, setChoice] = useState("");
  const linked = new Set(links.map((l) => l.contactId));
  const free = candidates.filter((c) => !linked.has(c.id));
  const before = new Map((saved ?? []).map((l) => [l.key, l]));

  function change(key: string, changes: Partial<LinkDraft>) {
    onChange(links.map((l) => (l.key === key ? { ...l, ...changes } : l)));
  }

  function add() {
    if (!choice) return;
    const picked = free.find((c) => String(c.id) === choice);
    const added: LinkDraft = picked
      ? { key: linkKey(picked.id), contactId: picked.id, name: picked.name, position: "" }
      : { key: newLinkKey(), contactId: null, name: "", position: "" };
    onChange([...links, added]);
    setChoice("");
  }

  return (
    <div className="space-y-3">
      {links.map((l) => {
        const isNew = saved !== undefined && !before.has(l.key);
        return (
          <Card key={l.key} className="space-y-3 p-3">
            <div className="flex items-start gap-2">
              <span aria-hidden className="pt-2">
                {CONTACT_KIND_ICON[other]}
              </span>
              <div className="min-w-0 flex-1 space-y-3">
                {l.contactId === null ? (
                  <TextField
                    label={t("newLinkName", { kind: tk(other) })}
                    value={l.name}
                    onChange={(e) => change(l.key, { name: e.target.value })}
                    error={errors[l.key]}
                    required
                    autoFocus
                    autoComplete="off"
                    hint={t("newLinkHint", { kind: tk(other) })}
                  />
                ) : (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {linkNames ? (
                      <Link href={`/contacts/${l.contactId}`} className="font-medium link">
                        {l.name}
                      </Link>
                    ) : (
                      <span className="font-medium">{l.name}</span>
                    )}
                    {isNew && <Badge tone="info">{tc("new")}</Badge>}
                  </div>
                )}
                <TextField
                  label={t("position")}
                  list="positions"
                  placeholder={t("positionPlaceholder")}
                  value={l.position}
                  onChange={(e) => change(l.key, { position: e.target.value })}
                  changed={saved !== undefined && !isNew && l.position.trim() !== before.get(l.key)?.position}
                  autoComplete="off"
                  inputClassName="py-1.5"
                />
              </div>
              <button
                type="button"
                onClick={() => onChange(links.filter((x) => x.key !== l.key))}
                aria-label={t("removeLink", { name: l.name || tk(other) })}
                title={t("removeLink", { name: l.name || tk(other) })}
                className="btn-danger shrink-0 px-2 py-1.5 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
              >
                <Icon name="cross" className="h-4 w-4" />
              </button>
            </div>
          </Card>
        );
      })}
      {links.length === 0 && <p className="text-sm text-zinc-500">{t(`noLinks.${kind}`)}</p>}
      {(saved ?? [])
        .filter((l) => !links.some((x) => x.key === l.key))
        .map((l) => (
          <p key={l.key} className="text-sm text-rose-700 line-through dark:text-rose-400">
            {t("linkRemoved", { name: l.name })}
          </p>
        ))}
      <Card dashed className="p-3">
        <div className="flex flex-wrap items-end gap-2">
          <SelectField
            label={t(`addLink.${kind}`)}
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            className="min-w-48 flex-1"
            inputClassName="py-1.5"
            options={[
              { value: "", label: t("choose") },
              ...free.map((c) => ({ value: c.id, label: c.name })),
              { value: NEW, label: t("newLink", { kind: tk(other) }) },
            ]}
          />
          <button type="button" onClick={add} disabled={!choice} className="btn-secondary pointer-coarse:min-h-11">
            {tc("add")}
          </button>
        </div>
      </Card>
      <DataList id="positions" values={t.raw("positionSuggestions") as string[]} />
    </div>
  );
}
