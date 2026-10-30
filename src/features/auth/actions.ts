"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, api, formBody } from "@/lib/api/client";
import { idOf } from "@/lib/api/path";
import type { LoginOut } from "@/lib/api/types";
import { AUTH_COOKIE, SESSION_DAYS } from "./session";

// The Server Actions pass the forms on to the API, which checks the passwords and keeps the sessions.
// Results and errors come back to the page as ?ok=… and ?error=… in the URL.

// Error code for the messages under "auth.errors"
function errorCode(error: ApiError): string {
  if (error.status === 423) return "locked";
  if (error.status === 409) return "taken";
  if (error.status === 400) return "self";
  if (error.status === 422) return "invalid";
  return "wrong";
}

function lockedMinutes(error: ApiError): string {
  const detail = error.detail as { minutes?: number } | undefined;
  return String(detail?.minutes ?? "");
}

async function startSession(token: string) {
  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
    path: "/",
  });
}

// Only paths inside the app, so the login cannot be used to send someone to another site
function nextPath(formData: FormData): string {
  const target = formData.get("next");
  return typeof target === "string" && target.startsWith("/") && !target.startsWith("//") ? target : "/";
}

// --- Login and first account ---

async function loginWith(path: string, body: Record<string, unknown>, next: string) {
  let token: string;
  try {
    ({ token } = await api.post<LoginOut>(path, body));
  } catch (error) {
    if (error instanceof ApiError) {
      // 409 from the setup: meanwhile someone else created the first account, the login page then shows the login
      const code = error.status === 409 ? "" : errorCode(error);
      const minutes = lockedMinutes(error);
      redirect(`/login?error=${code}${minutes ? `&minutes=${minutes}` : ""}&next=${encodeURIComponent(next)}`);
    }
    throw error;
  }
  await startSession(token);
  redirect(next);
}

export async function login(formData: FormData) {
  const body = { username: formData.get("username") ?? "", password: formData.get("password") ?? "" };
  await loginWith("/auth/login", body, nextPath(formData));
}

// Creates the first account as admin, only possible as long as there is no account
export async function setup(formData: FormData) {
  if (formData.get("password") !== formData.get("repeat")) redirect("/login?error=mismatch");
  await loginWith("/auth/setup", formBody(formData, { omit: ["repeat", "next"] }), "/account");
}

export async function logout() {
  await api.post("/auth/logout");
  (await cookies()).delete(AUTH_COOKIE);
  redirect("/login");
}

// --- Own account and account management on /account ---

async function onAccountPage(ok: string, run: () => Promise<unknown>) {
  try {
    await run();
  } catch (error) {
    if (error instanceof ApiError) {
      // Here only the current password can be wrong
      const code = errorCode(error) === "wrong" ? "wrongPassword" : errorCode(error);
      const minutes = lockedMinutes(error);
      redirect(`/account?error=${code}${minutes ? `&minutes=${minutes}` : ""}`);
    }
    throw error;
  }
  revalidatePath("/account");
  redirect(`/account?ok=${ok}`);
}

export async function changePassword(formData: FormData) {
  if (formData.get("newPassword") !== formData.get("repeat")) redirect("/account?error=mismatch");
  await onAccountPage("password", () => api.put("/auth/password", formBody(formData, { omit: ["repeat"] })));
}

export async function createUser(formData: FormData) {
  await onAccountPage("created", () => api.post("/users", formBody(formData, { checkboxes: ["isAdmin"] })));
}

// New password for someone who forgot theirs; also lifts a lock and logs the account out everywhere
export async function resetPassword(formData: FormData) {
  const id = idOf(formData.get("id"));
  await onAccountPage("reset", () => api.put(`/users/${id}/password`, { password: formData.get("password") ?? "" }));
}

export async function unlockUser(formData: FormData) {
  const id = idOf(formData.get("id"));
  await onAccountPage("unlocked", () => api.post(`/users/${id}/unlock`));
}

export async function setAdmin(formData: FormData) {
  const id = idOf(formData.get("id"));
  await onAccountPage("saved", () => api.put(`/users/${id}/admin`, { isAdmin: formData.get("isAdmin") === "true" }));
}

export async function deleteUser(formData: FormData) {
  const id = idOf(formData.get("id"));
  await onAccountPage("deleted", () => api.delete(`/users/${id}`));
}
