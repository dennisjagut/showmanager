import type { Tone } from "@/components/ui/tones";

// Status of an application for one season. The labels are in the messages under "applicationStatus".
export const APPLICATION_STATUSES = ["open", "applied", "no_response", "rejected", "accepted", "skipped"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_TONE: Record<ApplicationStatus, Tone> = {
  open: "neutral",
  applied: "info",
  no_response: "warning",
  rejected: "danger",
  accepted: "success",
  skipped: "muted",
};

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && (APPLICATION_STATUSES as readonly string[]).includes(value);
}
