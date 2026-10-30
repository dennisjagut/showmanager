// Colors for badges, chips and notices. Modules map their statuses to a tone instead of defining colors themselves.
export const TONES = {
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600",
  info: "bg-sky-50 text-sky-800 ring-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-800",
  warning: "bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800",
  danger: "bg-rose-50 text-rose-800 ring-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-800",
  success:
    "bg-emerald-50 text-emerald-800 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800",
  muted: "bg-stone-50 text-stone-500 ring-stone-200 dark:bg-stone-900 dark:text-stone-400 dark:ring-stone-700",
} as const;

export type Tone = keyof typeof TONES;
