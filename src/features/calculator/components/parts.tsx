"use client";

import { useLocale, useTranslations } from "next-intl";
import { Field } from "@/components/ui/Field";
import { formatCurrency } from "@/lib/format";
import { NumberInput } from "./NumberInput";

// Shared parts for vehicle and room rows.
// Numbers and units are joined with non-breaking spaces in the messages, so e.g. "0,35 €" stays together when wrapping.

export function Counter({
  label,
  value,
  display,
  onValue,
}: {
  label: string;
  value: number;
  display: string;
  onValue: (n: number) => void;
}) {
  const t = useTranslations("calculator");
  const button =
    "flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-lg leading-none hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-700 dark:hover:bg-zinc-800";
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-16 text-zinc-500">{label}</span>
      <button
        type="button"
        className={button}
        disabled={value <= 1}
        aria-label={t("decrease", { label })}
        onClick={() => onValue(value - 1)}
      >
        −
      </button>
      <span className="min-w-14 text-center font-medium tabular-nums">{display}</span>
      <button type="button" className={button} aria-label={t("increase", { label })} onClick={() => onValue(value + 1)}>
        +
      </button>
    </div>
  );
}

// Number field with the unit on the right inside the field, e.g. "150 €" or "200 km"
export function UnitInput({ unit, ...props }: React.ComponentProps<typeof NumberInput> & { unit: string }) {
  return (
    <div className="relative w-24 shrink-0">
      <NumberInput {...props} className={unit.length > 1 ? "pr-11" : "pr-7"} />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-zinc-500">
        {unit}
      </span>
    </div>
  );
}

// Frame of the edit area: full width below the row, delete and done at the bottom
export function EditPanel({
  children,
  deleteText,
  remove,
  done,
}: {
  children: React.ReactNode;
  deleteText: string;
  remove: () => void;
  done: () => void;
}) {
  const t = useTranslations("common");
  return (
    <div className="mt-3 space-y-3 rounded-md bg-zinc-50 p-3 dark:bg-zinc-800/50">
      {children}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button type="button" onClick={remove} className="btn-danger px-2 py-1.5">
          {deleteText}
        </button>
        <button type="button" onClick={done} className="btn-primary py-1.5">
          {t("done")}
        </button>
      </div>
    </div>
  );
}

// Name of an item; freshly created ones ("Neues …") are selected right away for overwriting
export function NameInput({
  name,
  isNew,
  placeholder,
  onName,
}: {
  name: string;
  isNew: boolean;
  placeholder?: string;
  onName: (name: string) => void;
}) {
  const t = useTranslations("calculator");
  return (
    <Field label={t("name")}>
      <input
        className="input py-1.5"
        value={name}
        placeholder={placeholder}
        autoFocus={isNew}
        onFocus={(ev) => isNew && ev.target.select()}
        onChange={(ev) => onName(ev.target.value)}
      />
    </Field>
  );
}

/**
 * Row for vehicles and rooms: checkbox, name, cost and rates in words.
 * Unticked, the price is shown in grey and does not count. Once ticked, hint, counters and calculation appear below,
 * while editing the panel.
 */
export function SelectableRow({
  name,
  selected,
  onSelect,
  cost,
  rates,
  editing,
  onEdit,
  hint,
  counters,
  calculation,
  panel,
}: {
  name: string;
  selected: boolean;
  onSelect: (on: boolean) => void;
  cost: number;
  rates: string;
  editing: boolean;
  onEdit: () => void;
  hint?: string | null;
  counters: React.ReactNode;
  calculation: string;
  panel: React.ReactNode;
}) {
  const t = useTranslations("calculator");
  const tc = useTranslations("common");
  const euro = formatCurrency(cost, useLocale());
  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
          aria-label={t("include", { name })}
          checked={selected}
          onChange={(ev) => onSelect(ev.target.checked)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className={`truncate font-medium ${selected ? "" : "text-zinc-500"}`}>{name}</span>
            {selected ? (
              <span className="shrink-0 font-semibold tabular-nums">{euro}</span>
            ) : (
              <span className="shrink-0 text-zinc-400 tabular-nums" title={t("notIncluded")}>
                {euro}
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between gap-2 text-xs text-zinc-500">
            <span>{rates}</span>
            {!editing && (
              <button type="button" className="shrink-0 link" onClick={onEdit}>
                {tc("edit")}
              </button>
            )}
          </div>

          {selected && !editing && (
            <div className="mt-2 space-y-2">
              {hint && <p className="text-xs text-amber-700 dark:text-amber-400">{hint}</p>}
              {counters}
              {calculation && (
                <p className="text-xs text-zinc-500 tabular-nums">
                  {calculation} = <span className="font-medium text-zinc-700 dark:text-zinc-300">{euro}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      {editing && panel}
    </li>
  );
}
