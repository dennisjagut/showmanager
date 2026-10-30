// Supported languages. To add one, create messages/<locale>.json with the same keys as messages/de.json,
// add the locale here and choose it in request.ts (e.g. from a cookie or the Accept-Language header).
export const LOCALES = ["de"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "de";

// Shows take place in Germany. Vercel runs in UTC, so "today" and times are computed in this time zone.
export const TIME_ZONE = "Europe/Berlin";

// Fees and costs are in euros
export const CURRENCY = "EUR";
