import { TIME_ZONE } from "@/i18n/config";

// Dates are stored as ISO strings (YYYY-MM-DD). For calculating and formatting they become noon UTC, so no time zone
// can shift them to the previous or next day.

// Today as ISO date in the band's time zone, not in the server's (UTC on Vercel)
export function todayIso(): string {
  // sv-SE formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TIME_ZONE }).format(new Date());
}

export function isoToDate(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

// For dates created with Date.UTC
export function dateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Whole days from `from` to `to`, negative if `to` lies before `from`
export function daysBetween(from: string, to: string): number {
  return Math.round((isoToDate(to).getTime() - isoToDate(from).getTime()) / 86_400_000);
}

export function daysUntil(iso: string, today = todayIso()): number {
  return daysBetween(today, iso);
}

function format(iso: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  return isoToDate(iso).toLocaleDateString(locale, { ...options, timeZone: "UTC" });
}

// Short date, e.g. 12.10.2026
export function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  return format(iso, locale, { day: "2-digit", month: "2-digit", year: "numeric" });
}

// e.g. "Samstag, 12. Juni 2027"
export function formatLongDate(iso: string, locale: string): string {
  return format(iso, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// For calendar sheets: "Sa", "12", "Juni", 2027
export function dateParts(iso: string, locale: string) {
  return {
    weekday: format(iso, locale, { weekday: "short" }).replace(".", ""),
    day: format(iso, locale, { day: "2-digit" }),
    month: format(iso, locale, { month: "short" }).replace(".", ""),
    year: isoToDate(iso).getUTCFullYear(),
  };
}

// Month names in the given language, e.g. as suggestions for the festival month
export function monthNames(locale: string): string[] {
  const names = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" });
  return Array.from({ length: 12 }, (_, i) => names.format(new Date(Date.UTC(2000, i, 1))));
}
