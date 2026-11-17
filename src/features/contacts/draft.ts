import type { ContactDetails, ContactSave } from "@/lib/api/types";
import { CONTACT_ROLES, type ContactRole } from "./kinds";

// The contact while it is being edited. Nothing is saved until "Speichern", then fields, roles and links are sent at
// once. `key` identifies links in React: the ID of the linked contact, or a counter for a new contact that is only
// created when saving.

export const CONTACT_FIELDS = ["name", "email", "phone", "website", "street", "location", "notes"] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

export type LinkDraft = {
  key: string;
  // null: a new contact of the other kind, created with `name` when saving
  contactId: number | null;
  name: string;
  position: string;
};

export type ContactDraft = {
  fields: Record<ContactField, string>;
  roles: ContactRole[];
  links: LinkDraft[];
};

let counter = 0;
export function newLinkKey(): string {
  counter += 1;
  return `new-${counter}`;
}

export function linkKey(contactId: number): string {
  return `contact-${contactId}`;
}

export function draftFrom({ contact, roles, links }: ContactDetails): ContactDraft {
  const fields = Object.fromEntries(CONTACT_FIELDS.map((k) => [k, contact[k] ?? ""])) as Record<ContactField, string>;
  return {
    fields,
    roles,
    links: links.map((l) => ({
      key: linkKey(l.contact.id),
      contactId: l.contact.id,
      name: l.contact.name,
      position: l.position ?? "",
    })),
  };
}

// The links as the API takes them: an existing contact by ID, a new one by name
export function linksBody(links: LinkDraft[]): ContactSave["links"] {
  return links.map((l) =>
    l.contactId === null
      ? { name: l.name.trim(), position: l.position.trim() }
      : { contactId: l.contactId, position: l.position.trim() },
  );
}

export function saveBody(draft: ContactDraft): ContactSave {
  return {
    ...draft.fields,
    roles: CONTACT_ROLES.filter((r) => draft.roles.includes(r)),
    links: linksBody(draft.links),
  };
}

export function isFieldChanged(draft: ContactDraft, saved: ContactDraft, field: ContactField): boolean {
  return draft.fields[field].trim() !== saved.fields[field];
}

export function areRolesChanged(draft: ContactDraft, saved: ContactDraft): boolean {
  return draft.roles.length !== saved.roles.length || draft.roles.some((r) => !saved.roles.includes(r));
}

/** Changed fields, the roles as one change, plus added, removed and edited links */
export function countChanges(draft: ContactDraft, saved: ContactDraft): number {
  const fields = CONTACT_FIELDS.filter((k) => isFieldChanged(draft, saved, k)).length;
  const roles = areRolesChanged(draft, saved) ? 1 : 0;
  const before = new Map(saved.links.map((l) => [l.key, l]));
  const keys = new Set(draft.links.map((l) => l.key));
  const addedOrEdited = draft.links.filter((l) => l.position.trim() !== before.get(l.key)?.position).length;
  const removed = saved.links.filter((l) => !keys.has(l.key)).length;
  return fields + roles + addedOrEdited + removed;
}

export function validate(
  draft: ContactDraft,
  messages: { nameRequired: string; linkNameRequired: string },
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.fields.name.trim()) errors.name = messages.nameRequired;
  for (const l of draft.links) {
    if (l.contactId === null && !l.name.trim()) errors[l.key] = messages.linkNameRequired;
  }
  return errors;
}
