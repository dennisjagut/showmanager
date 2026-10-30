import { BILLING, CATEGORIES } from "@/features/calculator/calculation";
import type { CalculatorData, CalculatorItem } from "@/lib/api/types";
import { todayIso } from "@/lib/dates";

// Backup file of the standalone calculator in the format of the app's full backup (backend/backup): the calculator
// part with the rows as the database stores them, snake_case and booleans as 0/1. So a backup downloaded in the app
// can be loaded here as well.

type Row = Record<string, unknown>;

export function backupFilename(): string {
  return `kalkulator-backup-${todayIso()}.json`;
}

export function toBackup({ inquiry, items }: CalculatorData) {
  return {
    created: new Date().toISOString(),
    calculator: {
      items: items.map((p) => ({
        id: p.id,
        category: p.category,
        name: p.name,
        billing: p.billing,
        amount: p.amount,
        fuel_per_km: p.fuelPerKm,
        free_km: p.freeKm,
        sort_order: p.sortOrder,
        selected: p.selected ? 1 : 0,
        quantity: p.quantity,
        duration: p.duration,
      })),
      inquiry: [
        {
          id: inquiry.id,
          location: inquiry.location,
          one_way_km: inquiry.oneWayKm,
          days: inquiry.days,
          buffer_percent: inquiry.bufferPercent,
          round_trip: inquiry.roundTrip ? 1 : 0,
        },
      ],
    },
  };
}

class InvalidBackup extends Error {}

function isRow(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function number(value: unknown, { min = 0, integer = false } = {}): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || (integer && !Number.isInteger(value)))
    throw new InvalidBackup();
  return value;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T {
  if (!allowed.includes(value as T)) throw new InvalidBackup();
  return value as T;
}

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new InvalidBackup();
  return value.trim() || null;
}

function item(row: Row): CalculatorItem {
  const name = text(row.name);
  if (!name) throw new InvalidBackup();
  return {
    id: number(row.id, { min: 1, integer: true }),
    category: oneOf(row.category, CATEGORIES),
    name,
    billing: oneOf(row.billing, BILLING),
    amount: number(row.amount),
    fuelPerKm: number(row.fuel_per_km),
    freeKm: number(row.free_km),
    sortOrder: number(row.sort_order, { integer: true }),
    selected: Boolean(row.selected),
    quantity: number(row.quantity, { min: 1, integer: true }),
    duration: row.duration === null ? null : number(row.duration, { min: 1, integer: true }),
  };
}

/** The calculator data from a backup file, null if it is not one */
export function fromBackup(json: unknown): CalculatorData | null {
  try {
    const calculator = isRow(json) ? json.calculator : null;
    if (!isRow(calculator) || !Array.isArray(calculator.items) || !Array.isArray(calculator.inquiry)) return null;
    const items = calculator.items.map((row) => {
      if (!isRow(row)) throw new InvalidBackup();
      return item(row);
    });
    if (new Set(items.map((p) => p.id)).size !== items.length) return null;

    const row: unknown = calculator.inquiry[0] ?? {};
    if (!isRow(row)) return null;
    return {
      inquiry: {
        id: 1,
        location: text(row.location),
        oneWayKm: row.one_way_km === null || row.one_way_km === undefined ? null : number(row.one_way_km),
        days: row.days === undefined ? 1 : number(row.days, { min: 1, integer: true }),
        bufferPercent: row.buffer_percent === undefined ? 10 : number(row.buffer_percent),
        roundTrip: row.round_trip === undefined ? true : Boolean(row.round_trip),
      },
      items,
    };
  } catch (e) {
    if (e instanceof InvalidBackup) return null;
    throw e;
  }
}
