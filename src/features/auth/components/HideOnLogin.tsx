"use client";

import { usePathname } from "next/navigation";

// Header and sidebar belong to the app: on the login page only the login window is shown
export function HideOnLogin({ children }: { children: React.ReactNode }) {
  return usePathname() === "/login" ? null : children;
}
