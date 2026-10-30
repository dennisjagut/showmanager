import type { Show } from "@/lib/api/types";
import { mapsSearchUrl } from "@/lib/maps";

// Free-text infos in a fixed order, empty fields are left out (web page and PDF).
// The keys are the headings in the messages under "showInfo".
export const LOGISTICS_FIELDS = ["fee", "travel", "hotel", "tech", "notes"] as const;
export type LogisticsField = (typeof LOGISTICS_FIELDS)[number];

export function logisticsBlocks(show: Show): [field: LogisticsField, text: string][] {
  return LOGISTICS_FIELDS.flatMap((field) => {
    const text = show[field];
    return text ? [[field, text] as [LogisticsField, string]] : [];
  });
}

// Venue and address in one line, e.g. "Moritzbastei, Kurt-Masur-Platz 1, Leipzig"
export function place(show: Pick<Show, "venue" | "address">): string {
  return [show.venue, show.address].filter(Boolean).join(", ");
}

export function mapsLink(show: Pick<Show, "venue" | "address">): string | null {
  return place(show) ? mapsSearchUrl(place(show)) : null;
}

// Guests including their plus-ones
export function guestCount(guests: { plusOnes: number }[]): number {
  return guests.reduce((sum, g) => sum + 1 + g.plusOnes, 0);
}
