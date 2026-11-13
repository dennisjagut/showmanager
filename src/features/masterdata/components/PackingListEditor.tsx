"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { MoveButtons } from "@/components/ui/MoveButtons";
import { SaveBar } from "@/components/ui/SaveBar";
import { useDraft } from "@/components/ui/use-draft";
import { savePackingList } from "@/features/masterdata/actions";
import {
  UNCATEGORIZED,
  draftFrom,
  isChanged,
  itemsOf,
  newKey,
  saveBody,
  withItems,
  type ItemDraft,
} from "@/features/masterdata/draft";
import type { PackingListDetails } from "@/lib/api/types";
import { swap } from "@/lib/lists";

const REMOVE = "btn-danger shrink-0 px-2 py-1.5 pointer-coarse:min-h-11 pointer-coarse:min-w-11";

/**
 * Name, categories and items of a packing list. Everything is changed here first and saved together with one button
 * (see useDraft); leaving the page with unsaved changes asks first.
 */
export function PackingListEditor({ details }: { details: PackingListDetails }) {
  const t = useTranslations("packingLists");
  const tc = useTranslations("common");
  const listId = details.packingList.id;
  const editor = useDraft({
    initial: draftFrom(details),
    save: async (draft) => draftFrom(await savePackingList(listId, saveBody(draft))),
    compare: isChanged,
  });
  const { draft, update } = editor;
  // Text of the "add item" field per group, and of the "add category" field
  const [newItems, setNewItems] = useState<Record<string, string>>({});
  const [newCategory, setNewCategory] = useState("");
  // Group whose "add item" field gets the focus, e.g. right after adding the category
  const [focusGroup, setFocusGroup] = useState<string | null>(null);
  function updateItem(group: string, key: string, changes: Partial<ItemDraft>) {
    update(
      withItems(
        draft,
        group,
        itemsOf(draft, group).map((i) => (i.key === key ? { ...i, ...changes } : i)),
      ),
    );
  }

  function addItem(group: string) {
    const name = (newItems[group] ?? "").trim();
    if (!name) return;
    update(withItems(draft, group, [...itemsOf(draft, group), { key: newKey(), id: null, name, quantity: "1" }]));
    setNewItems({ ...newItems, [group]: "" });
  }

  function addCategory() {
    const name = newCategory.trim();
    if (!name) return;
    const key = newKey();
    update({ ...draft, categories: [...draft.categories, { key, id: null, name, items: [] }] });
    setNewCategory("");
    setFocusGroup(key);
  }

  function removeCategory(key: string) {
    const category = draft.categories.find((c) => c.key === key);
    if (!category) return;
    if (
      category.items.length > 0 &&
      !window.confirm(t("categoryDeleteConfirm", { name: category.name, count: category.items.length }))
    )
      return;
    update({ ...draft, categories: draft.categories.filter((c) => c.key !== key) });
  }

  const hasCategories = draft.categories.length > 0;

  function items(group: string) {
    const list = itemsOf(draft, group);
    return (
      <>
        {list.length > 0 && (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {list.map((item, index) => (
              <li key={item.key} className="flex items-center gap-2 py-1.5">
                <MoveButtons
                  index={index}
                  count={list.length}
                  labels={{ up: t("moveUp", { name: item.name }), down: t("moveDown", { name: item.name }) }}
                  onMove={(direction) => update(withItems(draft, group, swap(list, index, direction)))}
                />
                <input
                  value={item.name}
                  onChange={(e) => updateItem(group, item.key, { name: e.target.value })}
                  required
                  aria-label={tc("name")}
                  className="input min-w-0 flex-1 py-1.5"
                />
                <input
                  value={item.quantity}
                  onChange={(e) => updateItem(group, item.key, { quantity: e.target.value })}
                  type="number"
                  min={1}
                  max={999}
                  inputMode="numeric"
                  aria-label={t("quantityOf", { name: item.name })}
                  className="input w-16 py-1.5 text-right tabular-nums"
                />
                <button
                  type="button"
                  onClick={() =>
                    update(
                      withItems(
                        draft,
                        group,
                        list.filter((i) => i.key !== item.key),
                      ),
                    )
                  }
                  aria-label={tc("remove", { name: item.name })}
                  title={tc("remove", { name: item.name })}
                  className={REMOVE}
                >
                  <Icon name="cross" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            value={newItems[group] ?? ""}
            onChange={(e) => setNewItems({ ...newItems, [group]: e.target.value })}
            onKeyDown={(e) => {
              // Enter adds the item instead of saving the whole list
              if (e.key === "Enter") {
                e.preventDefault();
                addItem(group);
              }
            }}
            autoFocus={focusGroup === group}
            placeholder={t("newItemPlaceholder")}
            aria-label={t("newItem")}
            className="input min-w-0 flex-1 py-1.5"
          />
          <button type="button" onClick={() => addItem(group)} className="btn-secondary py-1.5">
            {tc("add")}
          </button>
        </div>
      </>
    );
  }

  return (
    <form {...editor.form} className="space-y-4">
      <fieldset disabled={editor.saving} className="space-y-4">
        <TextField
          label={t("rename")}
          value={draft.name}
          onChange={(e) => update({ ...draft, name: e.target.value })}
          required
          inputClassName="text-lg font-semibold"
        />

        {(!hasCategories || draft.uncategorized.length > 0) && (
          <Card title={hasCategories ? t("uncategorized") : undefined}>
            {!hasCategories && draft.uncategorized.length === 0 && (
              <p className="text-sm text-zinc-500">{t("noItems")}</p>
            )}
            {items(UNCATEGORIZED)}
          </Card>
        )}

        {draft.categories.map((category, index) => (
          <Card key={category.key}>
            <div className="flex items-center gap-2">
              <MoveButtons
                index={index}
                count={draft.categories.length}
                labels={{ up: t("moveUp", { name: category.name }), down: t("moveDown", { name: category.name }) }}
                onMove={(direction) => update({ ...draft, categories: swap(draft.categories, index, direction) })}
              />
              <input
                value={category.name}
                onChange={(e) =>
                  update({
                    ...draft,
                    categories: draft.categories.map((c) =>
                      c.key === category.key ? { ...c, name: e.target.value } : c,
                    ),
                  })
                }
                required
                aria-label={t("categoryName")}
                className="input min-w-0 flex-1 py-1.5 font-semibold"
              />
              <span className="shrink-0 text-xs text-zinc-500">{t("items", { count: category.items.length })}</span>
              <button
                type="button"
                onClick={() => removeCategory(category.key)}
                aria-label={t("deleteCategory", { name: category.name })}
                title={t("deleteCategory", { name: category.name })}
                className={REMOVE}
              >
                <Icon name="cross" className="h-4 w-4" />
              </button>
            </div>
            {items(category.key)}
          </Card>
        ))}

        <Card dashed className="p-3">
          <div className="flex flex-wrap items-end gap-2">
            <TextField
              label={t("newCategory")}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
              placeholder={t("newCategoryPlaceholder")}
              className="min-w-40 flex-1"
            />
            <button type="button" onClick={addCategory} className="btn-secondary">
              {t("addCategory")}
            </button>
          </div>
        </Card>
      </fieldset>

      <SaveBar status={editor.status} onDiscard={editor.discard} />
    </form>
  );
}
