// Calculation logic of the gig calculator – without the database, so the page and the server calculate the same

export const CATEGORIES = ["vehicle", "accommodation", "crew", "other"] as const;
export type Category = (typeof CATEGORIES)[number];

export const BILLING = ["per_day", "flat"] as const;
export type Billing = (typeof BILLING)[number];

export type ItemValues = {
  id: number;
  category: Category;
  billing: Billing;
  amount: number;
  fuelPerKm: number;
  freeKm: number;
  selected: boolean;
  quantity: number;
  duration: number | null;
};

export type InquiryValues = {
  oneWayKm: number | null;
  days: number;
  bufferPercent: number;
  roundTrip: boolean;
};

// "Anfrage zurücksetzen" clears location, distance and selection. The items with their rates and the buffer stay.
export const EMPTY_INQUIRY = { location: null, oneWayKm: null, days: 1, roundTrip: true } as const;
export const EMPTY_SELECTION = { selected: false, quantity: 1, duration: null } as const;

export type Result = {
  totalKm: number;
  // per item: what it costs or would cost in this inquiry – including unselected ones, so you can see what an item
  // adds before ticking it. Only selected items count towards the sums.
  perItem: Record<number, number>;
  rent: number;
  fuel: number;
  accommodation: number;
  crew: number;
  other: number;
  subtotal: number;
  buffer: number;
  total: number;
};

const cents = (n: number) => Math.round(n * 100) / 100;

export function totalKm(a: InquiryValues): number {
  return (a.oneWayKm ?? 0) * (a.roundTrip ? 2 : 1);
}

/** Free kilometres only exist for rented vehicles (rent > 0); fuel only counts for the km above them */
export function freeKmOf(p: Pick<ItemValues, "amount" | "freeKm">): number {
  return p.amount > 0 ? p.freeKm : 0;
}

/** Accommodation: nights are set per room and don't depend on the days on site, empty = 1 night */
export function nights(p: Pick<ItemValues, "duration">): number {
  return p.duration ?? 1;
}

export function fuelKm(p: Pick<ItemValues, "amount" | "freeKm">, km: number): number {
  return Math.max(0, km - freeKmOf(p));
}

/** Vehicle: (rent + km above the free kilometres × fuel price) × quantity. Accommodation: rooms × price × nights.
 *  Crew: day rate × days on site. Other: flat amount. */
export function calculate(inquiry: InquiryValues, items: ItemValues[]): Result {
  const km = totalKm(inquiry);
  const r: Result = {
    totalKm: km,
    perItem: {},
    rent: 0,
    fuel: 0,
    accommodation: 0,
    crew: 0,
    other: 0,
    subtotal: 0,
    buffer: 0,
    total: 0,
  };

  for (const p of items) {
    let cost = 0;
    if (p.category === "vehicle") {
      const rent = p.billing === "per_day" ? p.amount * (p.duration ?? inquiry.days) : p.amount;
      const fuel = fuelKm(p, km) * p.fuelPerKm;
      cost = (rent + fuel) * p.quantity;
      if (p.selected) {
        r.rent += rent * p.quantity;
        r.fuel += fuel * p.quantity;
      }
    } else if (p.category === "accommodation") {
      cost = p.quantity * p.amount * nights(p);
      if (p.selected) r.accommodation += cost;
    } else if (p.category === "crew") {
      cost = p.amount * inquiry.days;
      if (p.selected) r.crew += cost;
    } else {
      cost = p.amount;
      if (p.selected) r.other += cost;
    }
    r.perItem[p.id] = cents(cost);
  }

  r.rent = cents(r.rent);
  r.fuel = cents(r.fuel);
  r.accommodation = cents(r.accommodation);
  r.crew = cents(r.crew);
  r.other = cents(r.other);
  r.subtotal = cents(r.rent + r.fuel + r.accommodation + r.crew + r.other);
  r.buffer = cents((r.subtotal * inquiry.bufferPercent) / 100);
  r.total = cents(r.subtotal + r.buffer);
  return r;
}

/** Cheapest unselected vehicle that costs less per unit than p – only once a distance is entered, because the
 *  comparison is meaningless without fuel. Only vehicles with a price per km are compared, so that e.g. a trailer
 *  does not show up as a replacement for the van. */
export function cheaperVehicle<T extends ItemValues>(
  p: T,
  items: T[],
  r: Result,
): { vehicle: T; cost: number; saving: number } | null {
  const drives = (x: T) => x.category === "vehicle" && x.fuelPerKm > 0;
  if (!drives(p) || r.totalKm <= 0) return null;
  const perUnit = (x: T) => (r.perItem[x.id] ?? 0) / Math.max(1, x.quantity);
  let best: { vehicle: T; cost: number } | null = null;
  for (const x of items) {
    if (!drives(x) || x.selected || x.id === p.id) continue;
    const cost = perUnit(x);
    if (!best || cost < best.cost) best = { vehicle: x, cost };
  }
  if (!best) return null;
  const saving = cents(perUnit(p) - best.cost);
  return saving >= 0.01 ? { ...best, cost: cents(best.cost), saving } : null;
}
