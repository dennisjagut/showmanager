import type { State } from "@/features/applications/options";
import type { Application, FestivalDetails, FestivalSave } from "@/lib/api/types";

// The festival with its applications and contacts while it is being edited. Nothing is saved until "Speichern", then
// the festival is sent with all its applications and contacts at once. Applications are identified by their season;
// removed ones stay in the list, marked, so they can be brought back until saving.

export const FESTIVAL_FIELDS = ["name", "location", "state", "month", "website", "deadline", "notes"] as const;
export type FestivalField = (typeof FESTIVAL_FIELDS)[number];

export type ApplicationDraft = {
  key: string;
  season: number;
  status: Application["status"];
  appliedOn: string;
  note: string;
  removed: boolean;
};

export type FestivalDraft = {
  fields: Record<FestivalField, string>;
  active: boolean;
  applications: ApplicationDraft[];
  // IDs from the contact list, in their order
  contacts: number[];
};

export function applicationKey(season: number): string {
  return `season-${season}`;
}

export function draftFrom({ festival, applications, contacts }: FestivalDetails): FestivalDraft {
  const fields = Object.fromEntries(FESTIVAL_FIELDS.map((k) => [k, String(festival[k] ?? "")])) as Record<
    FestivalField,
    string
  >;
  return {
    fields,
    active: festival.active,
    applications: applications.map((a) => ({
      key: applicationKey(a.season),
      season: a.season,
      status: a.status,
      appliedOn: a.appliedOn ?? "",
      note: a.note ?? "",
      removed: false,
    })),
    contacts: contacts.map((c) => c.contact.id),
  };
}

export function saveBody(draft: FestivalDraft): FestivalSave {
  const { state, month, deadline, ...fields } = draft.fields;
  return {
    ...fields,
    state: (state || null) as State | null,
    month: month ? Number(month) : null,
    deadline: deadline || null,
    active: draft.active,
    contacts: draft.contacts,
    applications: draft.applications
      .filter((a) => !a.removed)
      .map((a) => ({ season: a.season, status: a.status, appliedOn: a.appliedOn || null, note: a.note })),
  };
}

export function isFieldChanged(draft: FestivalDraft, saved: FestivalDraft, field: FestivalField): boolean {
  return draft.fields[field].trim() !== saved.fields[field];
}

// Whether status, date or note differ from the saved application
export function isApplicationEdited(application: ApplicationDraft, saved: ApplicationDraft | undefined): boolean {
  return (
    !!saved &&
    (application.status !== saved.status ||
      application.appliedOn !== saved.appliedOn ||
      application.note.trim() !== saved.note)
  );
}

// Contacts added and removed, a new order alone counts once
export function countContactChanges(draft: FestivalDraft, saved: FestivalDraft): number {
  const added = draft.contacts.filter((id) => !saved.contacts.includes(id)).length;
  const removed = saved.contacts.filter((id) => !draft.contacts.includes(id)).length;
  if (added + removed > 0) return added + removed;
  return draft.contacts.join() === saved.contacts.join() ? 0 : 1;
}

/** Changed fields of the festival, plus added, removed and edited applications and contacts */
export function countChanges(draft: FestivalDraft, saved: FestivalDraft): number {
  const fields = FESTIVAL_FIELDS.filter((k) => isFieldChanged(draft, saved, k)).length;
  const active = draft.active !== saved.active ? 1 : 0;
  const before = new Map(saved.applications.map((a) => [a.key, a]));
  const applications = draft.applications.filter(
    (a) => !before.has(a.key) || a.removed || isApplicationEdited(a, before.get(a.key)),
  ).length;
  return fields + active + applications + countContactChanges(draft, saved);
}

export function validate(draft: FestivalDraft, messages: { nameRequired: string }): Record<string, string> {
  return draft.fields.name.trim() ? {} : { name: messages.nameRequired };
}
