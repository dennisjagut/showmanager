"use client";

import { useLocale, useTranslations } from "next-intl";
import { Field } from "@/components/ui/Field";
import type { CalculatorItem } from "@/lib/api/types";
import { nights } from "@/features/calculator/calculation";
import { formatCurrency } from "@/lib/format";
import { Counter, EditPanel, NameInput, SelectableRow, UnitInput } from "./parts";

type Props = {
  p: CalculatorItem;
  cost: number;
  editing: boolean;
  setEditing: (on: boolean) => void;
  change: (c: Partial<CalculatorItem>) => void;
  remove: () => void;
};

// A freely named room type with a price per room and night, e.g. "Doppelzimmer · 100 € pro Nacht"
export function RoomRow({ p, cost, editing, setEditing, change, remove }: Props) {
  const t = useTranslations("calculator.room");
  const tc = useTranslations("calculator");
  const amount = formatCurrency(p.amount, useLocale());
  const n = nights(p);
  return (
    <SelectableRow
      name={p.name}
      selected={p.selected}
      onSelect={(selected) => change({ selected })}
      cost={cost}
      rates={t("rate", { amount })}
      editing={editing}
      onEdit={() => setEditing(true)}
      calculation={t("calculation", { rooms: p.quantity, amount, nights: n })}
      counters={
        <>
          <Counter
            label={t("rooms")}
            value={p.quantity}
            display={String(p.quantity)}
            onValue={(quantity) => change({ quantity })}
          />
          <Counter
            label={t("nightsLabel")}
            value={n}
            display={t("nights", { count: n })}
            onValue={(duration) => change({ duration })}
          />
        </>
      }
      panel={
        <EditPanel deleteText={t("delete")} remove={remove} done={() => setEditing(false)}>
          <NameInput
            name={p.name}
            isNew={p.name === tc("newItem.accommodation")}
            placeholder={t("namePlaceholder")}
            onName={(name) => change({ name })}
          />
          <Field label={t("price")}>
            <UnitInput
              unit="€"
              aria-label={t("price")}
              value={p.amount}
              onValue={(amount) => change({ amount: amount ?? 0 })}
            />
          </Field>
        </EditPanel>
      }
    />
  );
}
