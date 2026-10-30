import { CURRENCY } from "@/i18n/config";

export function formatCurrency(n: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: CURRENCY }).format(n);
}

/** Number for input fields and calculations, with the locale's decimal separator and without grouping ("0,35") */
export function formatNumber(n: number | null, locale: string): string {
  if (n === null) return "";
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 20, useGrouping: false }).format(n);
}

/** Reads numbers with a comma or a dot ("0,35", "1.5"); empty, negative or invalid = null */
export function parseNumber(text: string): number | null {
  const t = text.trim().replace(/\s/g, "").replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
