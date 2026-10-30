import { notFound } from "next/navigation";

// An ID from the URL or a form for an API path. Anything else than a number is not found (it can only come from an
// edited address).
export function idOf(value: FormDataEntryValue | string | null | undefined): string {
  const text = typeof value === "string" ? value : "";
  if (!/^\d+$/.test(text)) notFound();
  return text;
}
