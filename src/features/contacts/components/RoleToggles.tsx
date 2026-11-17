"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import type { ContactRole } from "@/features/contacts/kinds";

/**
 * The roles of a contact as round checkboxes. Controlled with `selected` and `onToggle` (editor), or as plain form
 * fields named "roles" with `defaultSelected` (form of a new contact).
 */
export function RoleToggles({
  roles,
  selected,
  defaultSelected,
  onToggle,
}: {
  roles: ContactRole[];
  selected?: ContactRole[];
  defaultSelected?: ContactRole[];
  onToggle?: (role: ContactRole) => void;
}) {
  const t = useTranslations("contactRole");
  const th = useTranslations("contactRoleHint");

  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <label
          key={role}
          title={th(role)}
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ring-1 ring-zinc-300 transition ring-inset hover:bg-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800 pointer-coarse:min-h-11",
            "has-checked:bg-brand-50 has-checked:font-medium has-checked:text-brand-800 has-checked:ring-brand-400 dark:has-checked:bg-brand-950 dark:has-checked:text-brand-200 dark:has-checked:ring-brand-700",
            "has-focus-visible:ring-2 has-focus-visible:ring-brand-500",
          )}
        >
          <input
            type="checkbox"
            name={onToggle ? undefined : "roles"}
            value={role}
            checked={selected ? selected.includes(role) : undefined}
            defaultChecked={defaultSelected ? defaultSelected.includes(role) : undefined}
            onChange={onToggle ? () => onToggle(role) : undefined}
            className="h-3.5 w-3.5 accent-brand-600"
          />
          {t(role)}
        </label>
      ))}
    </div>
  );
}
