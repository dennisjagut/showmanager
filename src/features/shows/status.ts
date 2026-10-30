import type { Tone } from "@/components/ui/tones";

// The labels are in the messages under "showStatus"
export const SHOW_STATUSES = ["option", "confirmed", "cancelled"] as const;

export type ShowStatus = (typeof SHOW_STATUSES)[number];

export const SHOW_STATUS_TONE: Record<ShowStatus, Tone> = {
  option: "warning",
  confirmed: "success",
  cancelled: "danger",
};

export function isShowStatus(value: unknown): value is ShowStatus {
  return typeof value === "string" && (SHOW_STATUSES as readonly string[]).includes(value);
}
