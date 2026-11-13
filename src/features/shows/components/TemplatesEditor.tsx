"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Checkbox, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { MoveButtons } from "@/components/ui/MoveButtons";
import { SaveBar } from "@/components/ui/SaveBar";
import { useDraft } from "@/components/ui/use-draft";
import { saveTemplates } from "@/features/shows/actions";
import {
  countChanges,
  draftFrom,
  isEdited,
  newKey,
  saveBody,
  validate,
  type TemplateDraft,
} from "@/features/shows/templates-draft";
import type { ScheduleTemplate } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { swap } from "@/lib/lists";

const ICON_BUTTON = "shrink-0 px-2 py-1.5 pointer-coarse:min-h-11 pointer-coarse:min-w-11";

/**
 * The templates for the running order as one list: rename, mark as "mehrfach", sort, add and remove right in the list,
 * then save everything with one button. Removed templates stay visible until saving and can be brought back.
 */
export function TemplatesEditor({ templates }: { templates: ScheduleTemplate[] }) {
  const t = useTranslations("templates");
  const tc = useTranslations("common");
  const editor = useDraft({
    initial: draftFrom(templates),
    save: async (draft) => draftFrom(await saveTemplates(saveBody(draft))),
    compare: countChanges,
    validate: (draft) =>
      validate(draft, { required: tc("nameRequired"), duplicate: (name) => t("duplicate", { name }) }),
  });
  const { draft, saved, update, errors } = editor;
  const [newName, setNewName] = useState("");
  const [newRepeatable, setNewRepeatable] = useState(false);

  function change(key: string, changes: Partial<TemplateDraft>) {
    update(draft.map((v) => (v.key === key ? { ...v, ...changes } : v)));
  }

  function remove(template: TemplateDraft) {
    // A new template is simply dropped, a saved one stays marked until saving
    if (template.id === null) update(draft.filter((v) => v.key !== template.key));
    else change(template.key, { removed: true });
  }

  function add() {
    const name = newName.trim();
    if (!name) return;
    update([...draft, { key: newKey(), id: null, name, repeatable: newRepeatable, removed: false }]);
    setNewName("");
    setNewRepeatable(false);
  }

  const before = new Map(saved.map((v) => [v.key, v]));

  return (
    <form {...editor.form} noValidate className="space-y-6">
      <fieldset disabled={editor.saving} className="space-y-6">
        <Card className="p-0">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {draft.map((v, index) => {
              if (v.removed) {
                return (
                  <li key={v.key} className="flex items-center gap-2 bg-rose-50 px-3 py-2 dark:bg-rose-950">
                    <span className="flex-1 text-sm text-rose-700 line-through dark:text-rose-400">
                      {t("removed", { name: v.name })}
                    </span>
                    <button
                      type="button"
                      onClick={() => change(v.key, { removed: false })}
                      className="btn-secondary py-1.5 pointer-coarse:min-h-11"
                    >
                      {tc("undo")}
                    </button>
                  </li>
                );
              }
              const isNew = !before.has(v.key);
              const marked = isNew || isEdited(v, before.get(v.key));
              const error = errors[v.key];
              return (
                <li key={v.key} className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <MoveButtons
                    index={index}
                    count={draft.length}
                    labels={{ up: t("moveUp", { name: v.name }), down: t("moveDown", { name: v.name }) }}
                    onMove={(direction) => update(swap(draft, index, direction))}
                  />
                  <span
                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", marked && "bg-brand-700 dark:bg-brand-400")}
                    title={marked ? (isNew ? tc("new") : tc("changed")) : undefined}
                  >
                    {marked && <span className="sr-only">{isNew ? tc("new") : tc("changed")}</span>}
                  </span>
                  <div className="min-w-40 flex-1">
                    <input
                      value={v.name}
                      onChange={(e) => change(v.key, { name: e.target.value })}
                      aria-label={tc("name")}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${v.key}-error` : undefined}
                      className={cn("input py-1.5", error && "border-rose-600 dark:border-rose-400")}
                    />
                    {error && (
                      <p id={`${v.key}-error`} className="mt-1 text-xs text-rose-700 dark:text-rose-400">
                        {error}
                      </p>
                    )}
                  </div>
                  {/* Wraps together below the name on narrow screens */}
                  <div className="ml-auto flex items-center gap-2">
                    <Checkbox
                      label={t("repeatable")}
                      checked={v.repeatable}
                      onChange={(e) => change(v.key, { repeatable: e.target.checked })}
                      className="pointer-coarse:min-h-11"
                    />
                    <button
                      type="button"
                      onClick={() => remove(v)}
                      aria-label={tc("remove", { name: v.name })}
                      title={tc("remove", { name: v.name })}
                      className={cn("btn-danger", ICON_BUTTON)}
                    >
                      <Icon name="cross" className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
            {draft.length === 0 && <li className="px-3 py-4 text-sm text-zinc-500">{t("empty")}</li>}
          </ul>
        </Card>

        <Card dashed className="p-3">
          <div className="flex flex-wrap items-end gap-2">
            <TextField
              label={t("new")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                // Enter adds the template instead of saving the whole list
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              placeholder={t("newPlaceholder")}
              className="min-w-40 flex-1"
            />
            <Checkbox
              label={t("repeatable")}
              checked={newRepeatable}
              onChange={(e) => setNewRepeatable(e.target.checked)}
              className="pb-2 pointer-coarse:min-h-11 pointer-coarse:pb-0"
            />
            <button type="button" onClick={add} className="btn-secondary pointer-coarse:min-h-11">
              {tc("add")}
            </button>
          </div>
        </Card>
      </fieldset>

      <SaveBar
        status={editor.status}
        changes={editor.changes}
        errorCount={editor.errorCount}
        onDiscard={editor.discard}
      />
    </form>
  );
}
