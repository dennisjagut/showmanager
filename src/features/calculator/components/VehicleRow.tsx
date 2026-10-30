"use client";

import { useLocale, useTranslations } from "next-intl";
import { Field } from "@/components/ui/Field";
import { Segmented, segmentClass } from "@/components/ui/Segmented";
import type { CalculatorItem } from "@/lib/api/types";
import { BILLING, freeKmOf, fuelKm } from "@/features/calculator/calculation";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Counter, EditPanel, NameInput, SelectableRow, UnitInput } from "./parts";

type Props = {
  p: CalculatorItem;
  days: number;
  totalKm: number;
  cost: number;
  // cheaper, unselected vehicle for this distance
  cheaper: { name: string; cost: number; saving: number } | null;
  editing: boolean;
  setEditing: (on: boolean) => void;
  change: (c: Partial<CalculatorItem>) => void;
  remove: () => void;
};

export function VehicleRow({ p, days, totalKm, cost, cheaper, editing, setEditing, change, remove }: Props) {
  const t = useTranslations("calculator.vehicle");
  const tc = useTranslations("calculator");
  const locale = useLocale();
  const euro = (n: number) => formatCurrency(n, locale);
  const number = (n: number) => formatNumber(n, locale);
  const rentalDays = p.duration ?? days;

  // Rates in words, e.g. "150 € pro Tag · 200 km frei · Sprit 0,35 €/km"
  const rates = [
    p.amount === 0
      ? t("noRent")
      : p.billing === "per_day"
        ? t("rentPerDay", { amount: euro(p.amount) })
        : t("rentFlat", { amount: euro(p.amount) }),
    ...(freeKmOf(p) > 0 ? [t("freeKm", { km: number(freeKmOf(p)) })] : []),
    p.fuelPerKm === 0 ? t("noFuel") : t("fuel", { price: number(p.fuelPerKm) }),
  ].join(" · ");

  // Calculation for the current inquiry, e.g. "150 € × 2 Tage + (400 − 200 frei) km × 0,35 €"
  const parts: string[] = [];
  if (p.amount > 0) {
    parts.push(
      p.billing === "per_day" ? t("rentTimesDays", { amount: euro(p.amount), count: rentalDays }) : euro(p.amount),
    );
  }
  if (p.fuelPerKm > 0) {
    const free = freeKmOf(p);
    const values = { km: number(totalKm), free: number(free), price: number(p.fuelPerKm) };
    if (free === 0) parts.push(t("fuelCost", values));
    else if (fuelKm(p, totalKm) > 0) parts.push(t("fuelCostAboveFree", values));
    else parts.push(t("noFuelCost", values));
  }
  const sum = parts.join(" + ");
  const calculation = parts.length === 0 ? "" : p.quantity > 1 ? `${p.quantity} × (${sum})` : sum;

  const hint =
    cheaper &&
    t(p.quantity > 1 ? "cheaperPerVehicle" : "cheaper", {
      name: cheaper.name,
      cost: euro(cheaper.cost),
      saving: euro(cheaper.saving),
    });

  return (
    <SelectableRow
      name={p.name}
      selected={p.selected}
      onSelect={(selected) => change({ selected })}
      cost={cost}
      rates={rates}
      editing={editing}
      onEdit={() => setEditing(true)}
      hint={hint}
      calculation={calculation}
      counters={
        <>
          <Counter
            label={t("quantity")}
            value={p.quantity}
            display={String(p.quantity)}
            onValue={(quantity) => change({ quantity })}
          />
          {p.billing === "per_day" && p.amount > 0 && (
            <Counter
              label={t("rentalDays")}
              value={rentalDays}
              display={t("days", { count: rentalDays })}
              onValue={(duration) => change({ duration })}
            />
          )}
        </>
      }
      panel={
        <EditPanel deleteText={t("delete")} remove={remove} done={() => setEditing(false)}>
          <NameInput name={p.name} isNew={p.name === tc("newItem.vehicle")} onName={(name) => change({ name })} />
          <Field as="div" label={t("rent")} hint={t("rentHelp")}>
            <div className="flex items-center gap-2">
              <UnitInput
                unit="€"
                aria-label={t("rentLabel")}
                value={p.amount}
                onValue={(amount) => change({ amount: amount ?? 0 })}
              />
              <Segmented>
                {BILLING.map((billing) => (
                  <button
                    key={billing}
                    type="button"
                    aria-pressed={p.billing === billing}
                    onClick={() => change({ billing })}
                    className={segmentClass(p.billing === billing)}
                  >
                    {t(`billing.${billing}`)}
                  </button>
                ))}
              </Segmented>
            </div>
          </Field>
          {p.amount > 0 && (
            <Field as="div" label={t("freeKmLabel")} hint={t("freeKmHelp")}>
              <div className="flex items-center gap-2">
                <UnitInput
                  unit="km"
                  aria-label={t("freeKmLabel")}
                  value={p.freeKm}
                  onValue={(freeKm) => change({ freeKm: freeKm ?? 0 })}
                />
                <span className="text-sm text-zinc-500">{t("freeKmIncluded")}</span>
              </div>
            </Field>
          )}
          <Field as="div" label={t("fuelLabel")}>
            <div className="flex items-center gap-2">
              <UnitInput
                unit="€"
                aria-label={t("fuelAria")}
                value={p.fuelPerKm}
                onValue={(fuelPerKm) => change({ fuelPerKm: fuelPerKm ?? 0 })}
              />
              <span className="text-sm text-zinc-500">{t("perKm")}</span>
            </div>
          </Field>
        </EditPanel>
      }
    />
  );
}
