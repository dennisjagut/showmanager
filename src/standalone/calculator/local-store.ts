import { EMPTY_INQUIRY, EMPTY_SELECTION, type Category } from "@/features/calculator/calculation";
import type { CalculatorData, CalculatorInquiry, CalculatorItem } from "@/lib/api/types";

// The data of the standalone calculator, in the browser's localStorage and in the shape the API returns.
// Does what backend/calculator does on the server: starting data, defaults of new items and what "reset" clears.

const STORAGE_KEY = "showmanager-calculator";

const INQUIRY_ID = 1;

const DEFAULT_INQUIRY: CalculatorInquiry = { id: INQUIRY_ID, bufferPercent: 10, ...EMPTY_INQUIRY };

function item(
  id: number,
  category: Category,
  name: string,
  billing: CalculatorItem["billing"],
  amount: number,
  fuelPerKm: number,
  sortOrder: number,
): CalculatorItem {
  return { id, category, name, billing, amount, fuelPerKm, freeKm: 0, sortOrder, ...EMPTY_SELECTION };
}

// The starting data of the app (backend/core/migrations.py, 0001_seed)
const SEED: CalculatorData = {
  inquiry: DEFAULT_INQUIRY,
  items: [
    item(1, "vehicle", "Privat-PKW", "flat", 0, 0.33, 10),
    item(2, "vehicle", "Transporter (Miete)", "per_day", 150, 0.35, 20),
    item(3, "vehicle", "Anhänger (Miete)", "per_day", 60, 0, 30),
    item(4, "crew", "FOH", "per_day", 200, 0, 10),
    item(5, "crew", "Licht", "per_day", 200, 0, 20),
    item(6, "other", "Foto", "flat", 150, 0, 10),
    item(7, "other", "Social Media", "flat", 100, 0, 20),
  ],
};

function sorted(items: CalculatorItem[]): CalculatorItem[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

/** Saved data, or the starting data on the first visit. Without localStorage (blocked) also the starting data. */
export function load(): CalculatorData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved) as CalculatorData;
      return { inquiry: data.inquiry, items: sorted(data.items) };
    }
  } catch {
    // blocked or broken: start over, saving then reports the error
  }
  return structuredClone(SEED);
}

/** Replaces everything, e.g. with a loaded backup. Throws if the browser does not allow saving. */
export function replace(data: CalculatorData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function update(change: (data: CalculatorData) => CalculatorData) {
  replace(change(load()));
}

// Async like the Server Actions, so a failed write turns into a rejected promise and the calculator shows it

export async function saveInquiry(inquiry: CalculatorInquiry) {
  const location = inquiry.location?.trim() || null;
  update((data) => ({ ...data, inquiry: { ...inquiry, id: INQUIRY_ID, location } }));
}

export async function saveItem(changed: CalculatorItem) {
  // An empty name is not saved, the old one stays
  const name = changed.name.trim();
  update((data) => ({
    ...data,
    items: data.items.map((p) =>
      p.id === changed.id ? { ...changed, category: p.category, sortOrder: p.sortOrder, name: name || p.name } : p,
    ),
  }));
}

/** At the end of its category. "Other" is a flat amount, everything else starts per day; new items are selected. */
export async function addItem(category: Category, name: string): Promise<CalculatorItem> {
  const data = load();
  const id = Math.max(0, ...data.items.map((p) => p.id)) + 1;
  const last = Math.max(0, ...data.items.filter((p) => p.category === category).map((p) => p.sortOrder));
  const billing = category === "other" ? "flat" : "per_day";
  const created = { ...item(id, category, name, billing, 0, 0, last + 10), selected: true };
  replace({ ...data, items: [...data.items, created] });
  return created;
}

export async function deleteItem(id: number) {
  update((data) => ({ ...data, items: data.items.filter((p) => p.id !== id) }));
}

export async function resetInquiry() {
  update((data) => ({
    inquiry: { ...data.inquiry, ...EMPTY_INQUIRY },
    items: data.items.map((p) => ({ ...p, ...EMPTY_SELECTION })),
  }));
}
