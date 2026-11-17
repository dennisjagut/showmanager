"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DataList, Field, SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { SaveBar } from "@/components/ui/SaveBar";
import { useDraft } from "@/components/ui/use-draft";
import { saveContact } from "@/features/contacts/actions";
import {
  areRolesChanged,
  countChanges,
  draftFrom,
  isFieldChanged,
  linkKey,
  newLinkKey,
  saveBody,
  validate,
  type ContactField,
  type LinkDraft,
} from "@/features/contacts/draft";
import { CONTACT_KIND_ICON, otherKind, rolesFor, type ContactRole } from "@/features/contacts/kinds";
import type { ContactDetails, ContactRef } from "@/lib/api/types";
import { RoleToggles } from "./RoleToggles";

// Value of the "new contact" entry in the select for adding a link
const NEW = "new";

/**
 * Edit mode of a contact: fields, roles and the links to people or organizations in one draft, saved with one button.
 * "Abbrechen" and saving both go back to the read view.
 */
export function ContactEditor({
  details,
  candidates,
  readHref,
}: {
  details: ContactDetails;
  // Contacts of the other kind that can be linked
  candidates: ContactRef[];
  readHref: string;
}) {
  const t = useTranslations("contacts");
  const tf = useTranslations("contactForm");
  const tk = useTranslations("contactKind");
  const tc = useTranslations("common");
  const router = useRouter();
  const { contact } = details;
  const other = otherKind(contact.kind);

  const editor = useDraft({
    initial: draftFrom(details),
    save: async (draft) => {
      const next = draftFrom(await saveContact(contact.id, saveBody(draft)));
      router.push(`${readHref}?saved=1`);
      return next;
    },
    compare: countChanges,
    validate: (draft) => validate(draft, { nameRequired: tc("nameRequired"), linkNameRequired: t("linkNameRequired") }),
  });
  const { draft, saved, update, errors } = editor;

  const linked = new Set(draft.links.map((l) => l.contactId));
  const free = candidates.filter((c) => !linked.has(c.id));
  const [choice, setChoice] = useState("");
  const before = new Map(saved.links.map((l) => [l.key, l]));

  function field(name: ContactField) {
    return {
      name,
      value: draft.fields[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        update({ ...draft, fields: { ...draft.fields, [name]: e.target.value } }),
      changed: isFieldChanged(draft, saved, name),
      error: errors[name],
    };
  }

  function toggleRole(role: ContactRole) {
    const roles = draft.roles.includes(role) ? draft.roles.filter((r) => r !== role) : [...draft.roles, role];
    update({ ...draft, roles });
  }

  function changeLink(key: string, changes: Partial<LinkDraft>) {
    update({ ...draft, links: draft.links.map((l) => (l.key === key ? { ...l, ...changes } : l)) });
  }

  function addLink() {
    if (!choice) return;
    const picked = free.find((c) => String(c.id) === choice);
    const added: LinkDraft = picked
      ? { key: linkKey(picked.id), contactId: picked.id, name: picked.name, position: "" }
      : { key: newLinkKey(), contactId: null, name: "", position: "" };
    update({ ...draft, links: [...draft.links, added] });
    setChoice("");
  }

  return (
    <form {...editor.form} noValidate className="space-y-6">
      <fieldset disabled={editor.saving} className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="space-y-3">
          <h2 className="section-title">{t("details")}</h2>
          <Card className="space-y-4">
            <TextField label={tf(`name.${contact.kind}`)} required autoComplete="off" {...field("name")} />
            <Field as="div" label={t("roles")} changed={areRolesChanged(draft, saved)}>
              <RoleToggles roles={rolesFor(contact.kind)} selected={draft.roles} onToggle={toggleRole} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label={tf("email")} type="email" autoComplete="off" {...field("email")} />
              <TextField label={tf("phone")} type="tel" autoComplete="off" {...field("phone")} />
            </div>
            <TextField label={tf("website")} type="url" placeholder="https://" {...field("website")} />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label={tf("street")} autoComplete="off" {...field("street")} />
              <TextField
                label={tf("location")}
                placeholder={tf("locationPlaceholder")}
                autoComplete="off"
                {...field("location")}
              />
            </div>
            <TextAreaField
              label={tf("notes")}
              placeholder={tf(`notesPlaceholder.${contact.kind}`)}
              {...field("notes")}
            />
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="section-title">{t(`links.${contact.kind}`)}</h2>
          <p className="text-sm text-zinc-500">{t(`linksHint.${contact.kind}`)}</p>
          {draft.links.map((l) => {
            const isNew = !before.has(l.key);
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
                        onChange={(e) => changeLink(l.key, { name: e.target.value })}
                        error={errors[l.key]}
                        autoFocus
                        autoComplete="off"
                        hint={t("newLinkHint", { kind: tk(other) })}
                      />
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <Link href={`/contacts/${l.contactId}`} className="font-medium link">
                          {l.name}
                        </Link>
                        {isNew && <Badge tone="info">{tc("new")}</Badge>}
                      </div>
                    )}
                    <TextField
                      label={t("position")}
                      list="positions"
                      placeholder={t("positionPlaceholder")}
                      value={l.position}
                      onChange={(e) => changeLink(l.key, { position: e.target.value })}
                      changed={!isNew && l.position.trim() !== before.get(l.key)?.position}
                      inputClassName="py-1.5"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => update({ ...draft, links: draft.links.filter((x) => x.key !== l.key) })}
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
          {draft.links.length === 0 && <p className="text-sm text-zinc-500">{t(`noLinks.${contact.kind}`)}</p>}
          {saved.links
            .filter((l) => !draft.links.some((x) => x.key === l.key))
            .map((l) => (
              <p key={l.key} className="text-sm text-rose-700 line-through dark:text-rose-400">
                {t("linkRemoved", { name: l.name })}
              </p>
            ))}
          <Card dashed className="p-3">
            <div className="flex flex-wrap items-end gap-2">
              <SelectField
                label={t(`addLink.${contact.kind}`)}
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
              <button
                type="button"
                onClick={addLink}
                disabled={!choice}
                className="btn-secondary pointer-coarse:min-h-11"
              >
                {tc("add")}
              </button>
            </div>
          </Card>
          <DataList id="positions" values={t.raw("positionSuggestions") as string[]} />
        </section>
      </fieldset>

      <SaveBar
        status={editor.status}
        changes={editor.changes}
        errorCount={editor.errorCount}
        onDiscard={() => router.push(readHref)}
        discardLabel={tc("cancel")}
        alwaysVisible
      />
    </form>
  );
}
