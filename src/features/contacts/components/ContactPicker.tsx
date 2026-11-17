"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { SelectField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Segmented, segmentClass } from "@/components/ui/Segmented";
import { Spinner } from "@/components/ui/Spinner";
import {
  CONTACT_KINDS,
  CONTACT_KIND_ICON,
  CONTACT_ROLES,
  type ContactKind,
  type ContactRole,
} from "@/features/contacts/kinds";
import type { ContactDetails } from "@/lib/api/types";
import { cn } from "@/lib/cn";

export type PickerFilters = { kind: ContactKind | null; role: ContactRole | null };

/**
 * Picks contacts from the contact list, in the Drawer: a drawer on the right from tablet width, a sheet from the
 * bottom on the phone. Only existing contacts can be chosen; a link opens the contacts in a new tab to add one.
 * Nothing changes until "Übernehmen", which hands the chosen IDs over in the order they were picked. With `single`,
 * at most one can be chosen (picking another replaces it); with `onlyKind`, only people or only organizations.
 */
export function ContactPicker({
  open,
  onClose,
  title,
  description,
  contacts,
  selected,
  defaults,
  suggested,
  single = false,
  onlyKind,
  saving = false,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  // All contacts by name
  contacts: ContactDetails[];
  // Already chosen when opening
  selected: number[];
  // Filters when opening, e.g. only people
  defaults: PickerFilters;
  // Shown first, independent of the filters, e.g. the people of the show's promoter
  suggested?: { label: string; ids: number[] };
  single?: boolean;
  onlyKind?: ContactKind;
  saving?: boolean;
  onConfirm: (ids: number[]) => void;
}) {
  const t = useTranslations("contactPicker");
  const tk = useTranslations("contactKinds");
  const tr = useTranslations("contactRole");
  const tc = useTranslations("common");
  const [picked, setPicked] = useState(selected);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(defaults);

  // Every time it opens, it starts from the current state of the show
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setPicked(selected);
      setSearch("");
      setFilters(defaults);
    }
  }

  const query = search.trim().toLowerCase();
  const matches = (d: ContactDetails) =>
    !query ||
    [d.contact.name, d.contact.email, d.contact.location, ...d.links.flatMap((l) => [l.contact.name, l.position])]
      .join(" ")
      .toLowerCase()
      .includes(query);
  const byId = new Map(contacts.map((d) => [d.contact.id, d]));
  const allowed = (d: ContactDetails) => !onlyKind || d.contact.kind === onlyKind;
  const suggestions = (suggested?.ids ?? [])
    .flatMap((id) => byId.get(id) ?? [])
    .filter((d) => allowed(d) && matches(d));
  const shownAbove = new Set(suggestions.map((d) => d.contact.id));
  const rest = contacts.filter(
    (d) =>
      !shownAbove.has(d.contact.id) &&
      allowed(d) &&
      (!filters.kind || d.contact.kind === filters.kind) &&
      (!filters.role || d.roles.includes(filters.role)) &&
      matches(d),
  );
  const filtered = !!(query || filters.kind || filters.role);
  const newKind = onlyKind ?? filters.kind ?? "organization";

  function toggle(id: number) {
    setPicked((list) => {
      if (list.includes(id)) return list.filter((x) => x !== id);
      return single ? [id] : [...list, id];
    });
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <div className="flex flex-wrap items-center gap-3">
          <span className="min-w-0 flex-1 text-sm text-zinc-500">{t("selected", { count: picked.length })}</span>
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 sm:flex-none pointer-coarse:min-h-11"
            >
              {tc("cancel")}
            </button>
            <button
              type="button"
              onClick={() => onConfirm(picked)}
              disabled={saving}
              aria-busy={saving}
              className="relative btn-primary flex-1 sm:flex-none pointer-coarse:min-h-11"
            >
              {saving && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Spinner />
                </span>
              )}
              <span className={saving ? "invisible" : ""}>{t("confirm")}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <TextField
          label={t("search")}
          type="search"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          // The picker can sit inside a form (e.g. an editor): Enter in the search must not submit it
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          inputClassName="py-1.5"
        />
        <div className="flex flex-wrap items-end gap-2">
          {!onlyKind && (
            <Segmented>
              {[null, ...CONTACT_KINDS].map((k) => (
                <button
                  key={k ?? "all"}
                  type="button"
                  aria-pressed={filters.kind === k}
                  onClick={() => setFilters({ ...filters, kind: k })}
                  className={segmentClass(filters.kind === k)}
                >
                  {k && <span aria-hidden>{CONTACT_KIND_ICON[k]} </span>}
                  {tk(k ?? "all")}
                </button>
              ))}
            </Segmented>
          )}
          <SelectField
            label={t("role")}
            value={filters.role ?? ""}
            onChange={(e) => setFilters({ ...filters, role: (e.target.value || null) as ContactRole | null })}
            className="min-w-36 flex-1"
            inputClassName="py-1.5"
            options={[{ value: "", label: t("allRoles") }, ...CONTACT_ROLES.map((r) => ({ value: r, label: tr(r) }))]}
          />
        </div>

        {suggestions.length > 0 && (
          <Group title={suggested?.label}>
            {suggestions.map((d) => (
              <Row key={d.contact.id} details={d} checked={picked.includes(d.contact.id)} onToggle={toggle} />
            ))}
          </Group>
        )}

        <Group title={suggestions.length > 0 ? t("allContacts") : undefined}>
          {rest.map((d) => (
            <Row key={d.contact.id} details={d} checked={picked.includes(d.contact.id)} onToggle={toggle} />
          ))}
          {rest.length === 0 && (
            <p className="px-1 py-3 text-sm text-zinc-500">{filtered ? t("noResults") : t("empty")}</p>
          )}
        </Group>

        <p className="text-sm text-zinc-500">
          {t("missing")}{" "}
          {/* New tab: the choice made here stays, the new contact shows up when the drawer opens again */}
          <a href={`/contacts/new?kind=${newKind}`} target="_blank" rel="noreferrer" className="link">
            {t("createNew")}
          </a>
        </p>
      </div>
    </Drawer>
  );
}

function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section>
      {title && <h3 className="mb-1 section-title">{title}</h3>}
      <ul className="-mx-1 divide-y divide-zinc-100 dark:divide-zinc-800">{children}</ul>
    </section>
  );
}

function Row({
  details: { contact: c, roles, links },
  checked,
  onToggle,
}: {
  details: ContactDetails;
  checked: boolean;
  onToggle: (id: number) => void;
}) {
  const tr = useTranslations("contactRole");
  const sub = [
    roles.map((r) => tr(r)).join(", "),
    links.map((l) => (l.position ? `${l.position} · ${l.contact.name}` : l.contact.name)).join(", "),
    c.kind === "organization" ? c.location : null,
  ].filter(Boolean);

  return (
    <li>
      <label
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-md px-1 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 pointer-coarse:min-h-12",
          checked && "bg-brand-50 hover:bg-brand-50 dark:bg-brand-950/60 dark:hover:bg-brand-950/60",
        )}
      >
        <input type="checkbox" checked={checked} onChange={() => onToggle(c.id)} className="peer sr-only" />
        <span
          aria-hidden
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded border peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500",
            checked
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900",
          )}
        >
          {checked && <Icon name="check" className="h-3.5 w-3.5" />}
        </span>
        <span aria-hidden className="shrink-0">
          {CONTACT_KIND_ICON[c.kind]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{c.name}</span>
          {sub.length > 0 && <span className="block truncate text-xs text-zinc-500">{sub.join(" · ")}</span>}
        </span>
      </label>
    </li>
  );
}
