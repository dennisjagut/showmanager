import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

// Calls the Python API (backend/) from the Next.js server: in pages, Server Actions and route handlers.
// The browser's cookies are passed on, so the API sees the login (and, on Vercel, the access to preview deployments).

async function baseUrl(): Promise<string> {
  if (process.env.API_URL) return process.env.API_URL;
  // Locally the API runs on its own port (npm run dev), on Vercel on the same domain as the pages
  if (process.env.NODE_ENV === "development") return "http://127.0.0.1:8000";
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    // The "detail" of FastAPI's error answer, e.g. { minutes: 15 } for a locked account
    public readonly detail?: unknown,
  ) {
    super(message);
  }
}

function errorDetail(text: string): unknown {
  try {
    return (JSON.parse(text) as { detail?: unknown }).detail;
  } catch {
    return undefined;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const cookie = (await cookies()).toString();
  const response = await fetch(`${await baseUrl()}/api/v1${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(cookie ? { Cookie: cookie } : {}),
      // Optional on Vercel: lets server-side calls through the protection of preview deployments
      ...(process.env.VERCEL_AUTOMATION_BYPASS_SECRET
        ? { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET }
        : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (response.status === 401) redirect("/login");
  if (response.status === 404) notFound();
  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, `${method} ${path}: ${response.status} ${text}`, errorDetail(text));
  }
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T = null>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
  put: <T = null>(path: string, body: unknown) => request<T>("PUT", path, body),
  delete: <T = null>(path: string) => request<T>("DELETE", path),
};

// Query string from parameters, empty values are left out
export function query(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "" && value !== false) search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

/**
 * Turns a form into the JSON body for the API. Text fields are passed as they are (the API trims them and turns empty
 * ones into null), checkboxes become true/false, hidden fields only used for the URL can be left out.
 */
export function formBody(
  formData: FormData,
  { checkboxes = [], omit = [] }: { checkboxes?: string[]; omit?: string[] } = {},
): Record<string, string | boolean> {
  const body: Record<string, string | boolean> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !omit.includes(key) && !key.startsWith("$")) body[key] = value;
  }
  for (const name of checkboxes) body[name] = formData.get(name) === "on";
  return body;
}
