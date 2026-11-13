import type { Application, FestivalDetails, FestivalSave } from "@/lib/api/types";

// The festival with its applications while it is being edited. Nothing is saved until "Speichern", then the festival is
// sent with all its applications at once. Applications are identified by their season; removed ones stay in the list,
// marked, so they can be brought back until saving.

// German federal states
export const STATES = ["BB", "BE", "BW", "BY", "HB", "HE", "HH", "MV", "NI", "NW", "RP", "SH", "SL", "SN", "ST", "TH"];

export const FESTIVAL_FIELDS = [
  "name",
  "location",
  "state",
  "month",
  "website",
  "deadline",
  "contact",
  "notes",
] as const;
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
};

export function applicationKey(season: number): string {
  return `season-${season}`;
}

export function draftFrom({ festival, applications }: FestivalDetails): FestivalDraft {
  const fields = Object.fromEntries(FESTIVAL_FIELDS.map((k) => [k, festival[k] ?? ""])) as Record<
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
  };
}

export function saveBody(draft: FestivalDraft): FestivalSave {
  return {
    ...draft.fields,
    active: draft.active,
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

/** Changed fields of the festival, plus added, removed and edited applications */
export function countChanges(draft: FestivalDraft, saved: FestivalDraft): number {
  const fields = FESTIVAL_FIELDS.filter((k) => isFieldChanged(draft, saved, k)).length;
  const active = draft.active !== saved.active ? 1 : 0;
  const before = new Map(saved.applications.map((a) => [a.key, a]));
  const applications = draft.applications.filter(
    (a) => !before.has(a.key) || a.removed || isApplicationEdited(a, before.get(a.key)),
  ).length;
  return fields + active + applications;
}

export function validate(draft: FestivalDraft, messages: { nameRequired: string }): Record<string, string> {
  return draft.fields.name.trim() ? {} : { name: messages.nameRequired };
}
