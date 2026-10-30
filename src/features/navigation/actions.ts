"use server";

import { cookies } from "next/headers";
import { HIDDEN_MODULES_COOKIE, SIDEBAR_COOKIE, isModuleId, parseHiddenModules } from "./modules";

// Personal view, set by the server: Safari deletes cookies set via JavaScript after 7 days without a visit
const VIEW_COOKIE = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 400,
  path: "/",
} as const;

// Toggles one module. Toggling instead of sending the whole list, so quick clicks in a row all arrive.
export async function toggleModule(id: string) {
  if (!isModuleId(id)) throw new Error("Unknown module");
  const store = await cookies();
  const hidden = parseHiddenModules(store.get(HIDDEN_MODULES_COOKIE)?.value);
  const next = hidden.includes(id) ? hidden.filter((m) => m !== id) : [...hidden, id];
  if (next.length > 0) store.set(HIDDEN_MODULES_COOKIE, next.join(","), VIEW_COOKIE);
  else store.delete(HIDDEN_MODULES_COOKIE);
}

export async function collapseSidebar(collapsed: boolean) {
  const store = await cookies();
  if (collapsed) store.set(SIDEBAR_COOKIE, "collapsed", VIEW_COOKIE);
  else store.delete(SIDEBAR_COOKIE);
}
