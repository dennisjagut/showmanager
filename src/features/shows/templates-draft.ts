import type { ScheduleTemplate, TemplatesSave } from "@/lib/api/types";

// The list of templates while it is being edited. Nothing is saved until "Speichern", then the whole list is sent.
// `key` identifies rows in React (new rows have no ID yet), `id` is the ID in the database. Removed templates stay in
// the list, marked, so they can be brought back until the list is saved.

export type TemplateDraft = { key: string; id: number | null; name: string; repeatable: boolean; removed: boolean };

let counter = 0;
export function newKey(): string {
  counter += 1;
  return `new-${counter}`;
}

export function draftFrom(list: ScheduleTemplate[]): TemplateDraft[] {
  return list.map((t) => ({
    key: `template-${t.id}`,
    id: t.id,
    name: t.name,
    repeatable: t.repeatable,
    removed: false,
  }));
}

export function saveBody(draft: TemplateDraft[]): TemplatesSave {
  return {
    templates: draft
      .filter((t) => !t.removed)
      .map((t) => ({ id: t.id, name: t.name.trim(), repeatable: t.repeatable })),
  };
}

// Whether name or "mehrfach" differ from the saved template
export function isEdited(template: TemplateDraft, saved: TemplateDraft | undefined): boolean {
  return !!saved && (template.name.trim() !== saved.name || template.repeatable !== saved.repeatable);
}

/** Added, removed and edited templates, plus one if the saved ones are in a different order */
export function countChanges(draft: TemplateDraft[], saved: TemplateDraft[]): number {
  const before = new Map(saved.map((t) => [t.key, t]));
  let count = draft.filter((t) => !before.has(t.key) || t.removed || isEdited(t, before.get(t.key))).length;
  // Only templates that are kept count for the order, so removing one is not also a change of order
  const kept = new Set(draft.filter((t) => !t.removed && before.has(t.key)).map((t) => t.key));
  const order = (list: TemplateDraft[]) =>
    list
      .filter((t) => kept.has(t.key))
      .map((t) => t.key)
      .join();
  if (order(draft) !== order(saved)) count += 1;
  return count;
}

/** Error messages by row key: empty names, and names that an earlier template already has (ignoring case) */
export function validate(
  draft: TemplateDraft[],
  messages: { required: string; duplicate: (name: string) => string },
): Record<string, string> {
  const errors: Record<string, string> = {};
  const seen = new Set<string>();
  for (const t of draft) {
    if (t.removed) continue;
    const name = t.name.trim();
    if (!name) errors[t.key] = messages.required;
    else if (seen.has(name.toLowerCase())) errors[t.key] = messages.duplicate(name);
    seen.add(name.toLowerCase());
  }
  return errors;
}
