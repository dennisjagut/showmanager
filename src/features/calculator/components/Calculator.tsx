"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Checkbox, Field, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import type { CalculatorInquiry, CalculatorItem } from "@/lib/api/types";
import {
  calculate,
  CATEGORIES,
  cheaperVehicle,
  EMPTY_INQUIRY,
  EMPTY_SELECTION,
  type Category,
} from "@/features/calculator/calculation";
import type { CalculatorStore } from "@/features/calculator/store";
import { cn } from "@/lib/cn";
import { formatCurrency, formatNumber } from "@/lib/format";
import { mapsRouteUrl } from "@/lib/maps";
import { type SaveStatus, useAutosave } from "./use-autosave";
import { useCollapsed } from "./use-collapsed";
import { NumberInput } from "./NumberInput";
import { RoomRow } from "./RoomRow";
import { VehicleRow } from "./VehicleRow";

export function Calculator(props: { inquiry: CalculatorInquiry; items: CalculatorItem[]; store: CalculatorStore }) {
  const { store } = props;
  const t = useTranslations("calculator");
  const locale = useLocale();
  const euro = (n: number) => formatCurrency(n, locale);
  const [inquiry, setInquiry] = useState(props.inquiry);
  const [items, setItems] = useState(props.items);
  const [wasReset, setWasReset] = useState(false);
  // Vehicle or room whose rates are being edited
  const [editing, setEditing] = useState<number | null>(null);
  const [loading, startLoading] = useTransition();
  const autosave = useAutosave();
  const collapsed = useCollapsed();
  const r = calculate(inquiry, items);

  function cheaper(p: CalculatorItem) {
    const c = cheaperVehicle(p, items, r);
    return c && { name: c.vehicle.name, cost: c.cost, saving: c.saving };
  }

  function changeInquiry(change: Partial<CalculatorInquiry>) {
    const next = { ...inquiry, ...change };
    setInquiry(next);
    setWasReset(false);
    autosave.schedule("inquiry", () => store.saveInquiry(next));
  }

  function changeItem(id: number, change: Partial<CalculatorItem>) {
    const old = items.find((p) => p.id === id);
    if (!old) return;
    const next = { ...old, ...change };
    setItems((list) => list.map((p) => (p.id === id ? next : p)));
    setWasReset(false);
    autosave.schedule(`item-${id}`, () => store.saveItem(next));
  }

  function add(category: Category) {
    startLoading(async () => {
      const created = await store.addItem(category);
      setItems((list) => [...list, created]);
      if (category === "vehicle" || category === "accommodation") setEditing(created.id);
    });
  }

  function remove(p: CalculatorItem) {
    if (!window.confirm(t("deleteConfirm", { name: p.name }))) return;
    autosave.cancel(`item-${p.id}`);
    setItems((list) => list.filter((x) => x.id !== p.id));
    autosave.run(() => store.deleteItem(p.id));
  }

  function reset() {
    if (!window.confirm(t("resetConfirm"))) return;
    autosave.cancel();
    setInquiry((a) => ({ ...a, ...EMPTY_INQUIRY }));
    setItems((list) => list.map((p) => ({ ...p, ...EMPTY_SELECTION })));
    setWasReset(true);
    autosave.run(store.resetInquiry);
  }

  const routeLink = inquiry.location ? mapsRouteUrl(inquiry.location) : null;

  const sums: Record<Category, number> = {
    vehicle: r.rent + r.fuel,
    accommodation: r.accommodation,
    crew: r.crew,
    other: r.other,
  };

  return (
    <div className="space-y-4 pb-24">
      <Card title={t("gig")}>
        <TextField
          label={t("location")}
          placeholder={t("locationPlaceholder")}
          value={inquiry.location ?? ""}
          onChange={(ev) => changeInquiry({ location: ev.target.value })}
        />
        <div className="grid grid-cols-3 items-end gap-3">
          <Field label={t("oneWayKm")}>
            <NumberInput value={inquiry.oneWayKm} onValue={(oneWayKm) => changeInquiry({ oneWayKm })} />
          </Field>
          <Field label={t("days")}>
            <NumberInput
              integer
              value={inquiry.days}
              onValue={(days) => days !== null && days >= 1 && changeInquiry({ days })}
            />
          </Field>
          <Field label={t("buffer")}>
            <NumberInput
              value={inquiry.bufferPercent}
              onValue={(bufferPercent) => changeInquiry({ bufferPercent: bufferPercent ?? 0 })}
            />
          </Field>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <Checkbox
            label={t("roundTrip")}
            checked={inquiry.roundTrip}
            onChange={(ev) => changeInquiry({ roundTrip: ev.target.checked })}
          />
          <span className="text-zinc-500">
            {t.rich("totalKm", {
              km: formatNumber(r.totalKm, locale),
              strong: (chunks) => <strong className="text-zinc-800 dark:text-zinc-200">{chunks}</strong>,
            })}
            {routeLink && (
              <>
                {" · "}
                <a href={routeLink} target="_blank" rel="noreferrer" className="link">
                  {t("checkRoute")}
                </a>
              </>
            )}
          </span>
        </div>
      </Card>

      {CATEGORIES.map((category) => {
        const list = items.filter((p) => p.category === category);
        const closed = collapsed.isCollapsed(category);
        return (
          <Card key={category} className="space-y-2">
            <h2>
              <button
                type="button"
                aria-expanded={!closed}
                onClick={() => collapsed.toggle(category)}
                className="flex w-full items-baseline justify-between gap-2 text-left"
              >
                <span className="flex items-center gap-1.5 section-title">
                  <Icon name="right" className={cn("h-4 w-4 transition-transform", !closed && "rotate-90")} />
                  {t(`blocks.${category}.title`)}
                </span>
                <span className="font-semibold tabular-nums">{euro(sums[category])}</span>
              </button>
            </h2>
            {closed ? (
              <p className="truncate text-xs text-zinc-500">{selection(list) || t("nothingSelected")}</p>
            ) : (
              <>
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {list.map((p) =>
                    p.category === "vehicle" ? (
                      <VehicleRow
                        key={p.id}
                        p={p}
                        days={inquiry.days}
                        totalKm={r.totalKm}
                        cost={r.perItem[p.id] ?? 0}
                        cheaper={cheaper(p)}
                        editing={editing === p.id}
                        setEditing={(on) => setEditing(on ? p.id : null)}
                        change={(c) => changeItem(p.id, c)}
                        remove={() => remove(p)}
                      />
                    ) : p.category === "accommodation" ? (
                      <RoomRow
                        key={p.id}
                        p={p}
                        cost={r.perItem[p.id] ?? 0}
                        editing={editing === p.id}
                        setEditing={(on) => setEditing(on ? p.id : null)}
                        change={(c) => changeItem(p.id, c)}
                        remove={() => remove(p)}
                      />
                    ) : (
                      <ItemRow
                        key={p.id}
                        p={p}
                        days={inquiry.days}
                        cost={r.perItem[p.id] ?? 0}
                        change={(c) => changeItem(p.id, c)}
                        remove={() => remove(p)}
                      />
                    ),
                  )}
                  {list.length === 0 && (
                    <li className="py-2 text-sm text-zinc-500">
                      {category === "accommodation" ? t("blocks.accommodation.empty") : t("empty")}
                    </li>
                  )}
                </ul>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => add(category)}
                  className="btn w-full border border-dashed border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {t(`blocks.${category}.add`)}
                </button>
              </>
            )}
          </Card>
        );
      })}

      <Card title={t("summary.title")}>
        <dl className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
          <Row title={t("summary.rent")} value={euro(r.rent)} />
          <Row title={t("summary.fuel")} value={euro(r.fuel)} />
          <Row title={t("summary.accommodation")} value={euro(r.accommodation)} />
          <Row title={t("summary.crew", { count: inquiry.days })} value={euro(r.crew)} />
          <Row title={t("summary.other")} value={euro(r.other)} />
          <Row title={t("summary.subtotal")} value={euro(r.subtotal)} />
          <Row
            title={t("summary.buffer", { percent: formatNumber(inquiry.bufferPercent, locale) })}
            value={euro(r.buffer)}
          />
          <div className="flex items-baseline justify-between pt-3">
            <dt className="font-semibold">{t("summary.total")}</dt>
            <dd className="text-2xl font-bold text-brand-700 tabular-nums dark:text-brand-400">{euro(r.total)}</dd>
          </div>
        </dl>
        <button type="button" onClick={reset} disabled={wasReset} className="mt-1 btn-secondary w-full">
          {wasReset ? t("wasReset") : t("reset")}
        </button>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-brand-600 text-white shadow-lg lg:left-(--sidebar) print:hidden">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="text-xs leading-tight">
            <div className="font-semibold">{t("bar.title")}</div>
            <div className="flex items-center gap-1.5 opacity-80">
              {t("bar.minimum")} · <SaveState status={autosave.status} />
              {(autosave.status === "saving" || loading) && <Spinner className="h-3 w-3" />}
            </div>
          </div>
          <div className="text-2xl font-bold tabular-nums">{euro(r.total)}</div>
        </div>
      </div>
    </div>
  );
}

function SaveState({ status }: { status: SaveStatus }) {
  const t = useTranslations("calculator.saveStatus");
  return t(status);
}

// For collapsed blocks: what makes up the sum
function selection(list: CalculatorItem[]): string {
  return list
    .filter((p) => p.selected)
    .map((p) => (p.quantity > 1 ? `${p.quantity}× ${p.name}` : p.name))
    .join(", ");
}

function Row({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex justify-between py-2">
      <dt>{title}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

// Crew and other: name and amount directly in the row
function ItemRow({
  p,
  days,
  cost,
  change,
  remove,
}: {
  p: CalculatorItem;
  days: number;
  cost: number;
  change: (c: Partial<CalculatorItem>) => void;
  remove: () => void;
}) {
  const t = useTranslations("calculator");
  const locale = useLocale();
  const amountLabel = p.category === "crew" ? t("dayRate", { count: days }) : t("flatRate");

  return (
    <li className={`space-y-2 py-2 ${p.selected ? "" : "opacity-60"}`}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          className="h-5 w-5 shrink-0 accent-brand-600"
          aria-label={t("include", { name: p.name })}
          checked={p.selected}
          onChange={(ev) => change({ selected: ev.target.checked })}
        />
        <input
          className="input min-w-0 flex-1 py-1.5"
          aria-label={t("name")}
          value={p.name}
          onChange={(ev) => change({ name: ev.target.value })}
        />
        <NumberInput
          className="w-20 shrink-0 text-right"
          aria-label={amountLabel}
          title={amountLabel}
          value={p.amount}
          onValue={(amount) => change({ amount: amount ?? 0 })}
        />
        <button
          type="button"
          onClick={remove}
          aria-label={t("delete", { name: p.name })}
          className="btn-danger shrink-0 px-2 py-1.5"
        >
          <Icon name="cross" className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-3 pl-7 text-xs text-zinc-500">
        <span>{amountLabel}</span>
        <span className="ml-auto font-medium text-zinc-700 tabular-nums dark:text-zinc-300">
          = {formatCurrency(cost, locale)}
        </span>
      </div>
    </li>
  );
}
