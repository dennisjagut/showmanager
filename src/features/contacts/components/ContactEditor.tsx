"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Field, TextAreaField, TextField } from "@/components/ui/Field";
import { SaveBar } from "@/components/ui/SaveBar";
import { useDraft } from "@/components/ui/use-draft";
import { saveContact } from "@/features/contacts/actions";
import {
  areRolesChanged,
  countChanges,
  draftFrom,
  isFieldChanged,
  saveBody,
  validate,
  type ContactField,
} from "@/features/contacts/draft";
import { rolesFor, type ContactRole } from "@/features/contacts/kinds";
import type { ContactDetails, ContactRef } from "@/lib/api/types";
import { ContactLinksEditor } from "./ContactLinksEditor";
import { RoleToggles } from "./RoleToggles";

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
  const tc = useTranslations("common");
  const router = useRouter();
  const { contact } = details;

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
          <ContactLinksEditor
            kind={contact.kind}
            links={draft.links}
            onChange={(links) => update({ ...draft, links })}
            candidates={candidates}
            saved={saved.links}
            errors={errors}
          />
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
