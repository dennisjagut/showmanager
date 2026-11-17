import type { Tone } from "@/components/ui/tones";
import type { Contact, ContactDetails } from "@/lib/api/types";

// Kinds and roles of contacts, the same lists as in backend/contacts/models.py. The labels are in the messages under
// "contactKind" and "contactRole".

export type ContactKind = Contact["kind"];
export type ContactRole = ContactDetails["roles"][number];

export const CONTACT_KINDS = ["person", "organization"] as const satisfies readonly ContactKind[];

export const CONTACT_KIND_ICON: Record<ContactKind, string> = { person: "👤", organization: "🏢" };

// In this order everywhere: what matters most for booking shows first
export const CONTACT_ROLES = [
  "promoter",
  "venue",
  "festival",
  "booking",
  "management",
  "label",
  "media",
  "service",
  "other",
] as const satisfies readonly ContactRole[];

// Roles only an organization can have: a person is not a venue, but can be its booker (linked with a position)
const ORGANIZATION_ROLES: readonly ContactRole[] = ["venue", "festival", "label"];

export function rolesFor(kind: ContactKind): ContactRole[] {
  return CONTACT_ROLES.filter((r) => kind === "organization" || !ORGANIZATION_ROLES.includes(r));
}

// People are linked to organizations and the other way round
export function otherKind(kind: ContactKind): ContactKind {
  return kind === "person" ? "organization" : "person";
}

export const CONTACT_ROLE_TONE: Record<ContactRole, Tone> = {
  promoter: "success",
  venue: "info",
  festival: "warning",
  booking: "danger",
  management: "neutral",
  label: "neutral",
  media: "neutral",
  service: "muted",
  other: "muted",
};

export function isContactKind(value: unknown): value is ContactKind {
  return typeof value === "string" && (CONTACT_KINDS as readonly string[]).includes(value);
}

export function isContactRole(value: unknown): value is ContactRole {
  return typeof value === "string" && (CONTACT_ROLES as readonly string[]).includes(value);
}
