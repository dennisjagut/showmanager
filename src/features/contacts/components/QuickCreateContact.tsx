"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Checkbox, TextField } from "@/components/ui/Field";
import { Segmented, segmentClass } from "@/components/ui/Segmented";
import { Spinner } from "@/components/ui/Spinner";
import { quickCreateContact } from "@/features/contacts/actions";
import {
  CONTACT_KINDS,
  CONTACT_KIND_ICON,
  rolesFor,
  type ContactKind,
  type ContactRole,
} from "@/features/contacts/kinds";
import type { ContactDetails } from "@/lib/api/types";

/**
 * Creates a contact with just its name, right in the picker: kind (unless fixed) and the role the picker is filtered by.
 * It sits inside the drawer, which can be part of another form (an editor): its fields have no names and Enter creates
 * the contact instead of submitting that form.
 */
export function QuickCreateContact({
  defaultName,
  defaultKind,
  onlyKind,
  role,
  existingNames,
  onCreated,
  onCancel,
}: {
  defaultName: string;
  defaultKind: ContactKind;
  onlyKind?: ContactKind;
  // Role the new contact gets if it fits its kind, e.g. "venue" in the venue picker
  role: ContactRole | null;
  // Names in the contact list, lower case, to warn about duplicates
  existingNames: Set<string>;
  onCreated: (details: ContactDetails) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("contactPicker");
  const tk = useTranslations("contactKind");
  const tr = useTranslations("contactRole");
  const tc = useTranslations("common");
  const [name, setName] = useState(defaultName);
  const [kind, setKind] = useState(onlyKind ?? defaultKind);
  const [withRole, setWithRole] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, startCreating] = useTransition();
  const fits = role !== null && rolesFor(kind).includes(role);

  function create() {
    if (!name.trim()) {
      setError(tc("nameRequired"));
      return;
    }
    startCreating(async () => {
      try {
        onCreated(await quickCreateContact({ kind, name: name.trim(), roles: fits && withRole && role ? [role] : [] }));
      } catch {
        setError(t("createError"));
      }
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
      <h3 className="text-sm font-medium">{t("quickCreate")}</h3>
      {!onlyKind && (
        <Segmented>
          {CONTACT_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className={segmentClass(kind === k)}
            >
              <span aria-hidden>{CONTACT_KIND_ICON[k]}</span> {tk(k)}
            </button>
          ))}
        </Segmented>
      )}
      <TextField
        label={t("quickCreateName", { kind: tk(kind) })}
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          create();
        }}
        error={error ?? undefined}
        hint={
          existingNames.has(name.trim().toLowerCase()) ? t("duplicate", { name: name.trim() }) : t("quickCreateHint")
        }
        autoFocus
        autoComplete="off"
        inputClassName="py-1.5"
      />
      {fits && role && (
        <Checkbox
          label={t("withRole", { role: tr(role) })}
          checked={withRole}
          onChange={(e) => setWithRole(e.target.checked)}
          className="pointer-coarse:min-h-11"
        />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={create}
          disabled={creating}
          aria-busy={creating}
          className="relative btn-primary pointer-coarse:min-h-11"
        >
          {creating && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Spinner />
            </span>
          )}
          <span className={creating ? "invisible" : ""}>{t("create")}</span>
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary pointer-coarse:min-h-11">
          {tc("cancel")}
        </button>
      </div>
    </div>
  );
}
