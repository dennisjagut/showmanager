// The areas of the app. A new module is a new entry here, the sidebar and the mobile menu only read this list.
// The label is in the messages under "modules.<id>".
export const MODULES = [
  {
    id: "applications",
    href: "/",
    icon: "📨",
    isActive: (p: string) => p === "/" || p.startsWith("/festivals"),
  },
  { id: "shows", href: "/shows", icon: "🎤", isActive: (p: string) => p.startsWith("/shows") },
  { id: "calculator", href: "/calculator", icon: "🧮", isActive: (p: string) => p.startsWith("/calculator") },
  { id: "masterdata", href: "/masterdata", icon: "🗂️", isActive: (p: string) => p.startsWith("/masterdata") },
  { id: "data", href: "/data", icon: "💾", isActive: (p: string) => p.startsWith("/data") },
] as const;

export type Module = (typeof MODULES)[number];
export type ModuleId = Module["id"];

// Hidden modules and the collapsed sidebar are a personal view per browser. They live in cookies instead of
// localStorage, so the server renders the navigation correctly right away and nothing jumps while loading.
export const HIDDEN_MODULES_COOKIE = "showmanager_hidden_modules";
export const SIDEBAR_COOKIE = "showmanager_sidebar";

export function isModuleId(id: string): id is ModuleId {
  return MODULES.some((m) => m.id === id);
}

// Unknown IDs (e.g. from a removed module) are dropped
export function parseHiddenModules(value: string | undefined): ModuleId[] {
  if (!value) return [];
  return value.split(",").filter(isModuleId);
}
