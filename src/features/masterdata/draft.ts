import type { PackingListDetails, PackingListSave } from "@/lib/api/types";

// The packing list while it is being edited. Nothing is saved until "Speichern", then the whole draft is sent at once.
// `key` identifies rows in React (new rows have no ID yet), `id` is the ID in the database.

export type ItemDraft = { key: string; id: number | null; name: string; quantity: string };
export type CategoryDraft = { key: string; id: number | null; name: string; items: ItemDraft[] };
export type PackingListDraft = { name: string; uncategorized: ItemDraft[]; categories: CategoryDraft[] };

// Key of the group of items without a category
export const UNCATEGORIZED = "uncategorized";

let counter = 0;
export function newKey(): string {
  counter += 1;
  return `new-${counter}`;
}

export function draftFrom({ packingList, groups }: PackingListDetails): PackingListDraft {
  const items = (list: PackingListDetails["groups"][number]["items"]) =>
    list.map((i) => ({ key: `item-${i.id}`, id: i.id, name: i.name, quantity: String(i.quantity) }));
  return {
    name: packingList.name,
    uncategorized: items(groups.find((g) => !g.category)?.items ?? []),
    categories: groups.flatMap((g) =>
      g.category
        ? [{ key: `category-${g.category.id}`, id: g.category.id, name: g.category.name, items: items(g.items) }]
        : [],
    ),
  };
}

export function saveBody(draft: PackingListDraft): PackingListSave {
  const items = (list: ItemDraft[]) =>
    list.map((i) => ({ id: i.id, name: i.name.trim(), quantity: Number(i.quantity) >= 1 ? Number(i.quantity) : null }));
  return {
    name: draft.name.trim(),
    uncategorized: items(draft.uncategorized),
    categories: draft.categories.map((c) => ({ id: c.id, name: c.name.trim(), items: items(c.items) })),
  };
}

// Whether the draft differs from what was saved last
export function isChanged(draft: PackingListDraft, saved: PackingListDraft): boolean {
  return JSON.stringify(saveBody(draft)) !== JSON.stringify(saveBody(saved));
}

// Items of a group (category key or UNCATEGORIZED)
export function itemsOf(draft: PackingListDraft, group: string): ItemDraft[] {
  if (group === UNCATEGORIZED) return draft.uncategorized;
  return draft.categories.find((c) => c.key === group)?.items ?? [];
}

// Replaces the items of a group
export function withItems(draft: PackingListDraft, group: string, items: ItemDraft[]): PackingListDraft {
  if (group === UNCATEGORIZED) return { ...draft, uncategorized: items };
  return { ...draft, categories: draft.categories.map((c) => (c.key === group ? { ...c, items } : c)) };
}
