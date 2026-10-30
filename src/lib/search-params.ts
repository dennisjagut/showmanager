// Query parameters of a page, as Next.js passes them to `searchParams`
export type SearchParams = Record<string, string | string[] | undefined>;

// A single parameter as text, empty if missing or given several times
export function param(sp: SearchParams, key: string): string {
  const value = sp[key];
  return typeof value === "string" ? value : "";
}

// Link to `path` with the current parameters and some of them changed; empty values are removed
export function linkWith(path: string, sp: SearchParams, changes: Record<string, string | null>): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...sp, ...changes })) {
    if (typeof value === "string" && value !== "") next.set(key, value);
  }
  const query = next.toString();
  return query ? `${path}?${query}` : path;
}
