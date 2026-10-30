"use client";

import { useSyncExternalStore } from "react";

// Which blocks are collapsed is a personal view: it stays in the browser (localStorage) and is not saved for the
// band. Without localStorage (private window or similar) it only lasts until the next reload.

const STORAGE_KEY = "calculator-collapsed";
const EVENT = "calculator-collapsed";

let value: string | null = null;

function read(): string {
  if (value === null) {
    try {
      value = localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      value = "";
    }
  }
  return value;
}

function subscribe(reload: () => void) {
  // Change in another tab: read from localStorage again
  const fromOutside = () => {
    value = null;
    reload();
  };
  window.addEventListener("storage", fromOutside);
  window.addEventListener(EVENT, reload);
  return () => {
    window.removeEventListener("storage", fromOutside);
    window.removeEventListener(EVENT, reload);
  };
}

export function useCollapsed() {
  // On the server everything is expanded
  const raw = useSyncExternalStore(subscribe, read, () => "");
  const list = raw ? raw.split(",") : [];

  function toggle(key: string) {
    const next = list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
    value = next.join(",");
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // only for this session
    }
    window.dispatchEvent(new Event(EVENT));
  }

  return { isCollapsed: (key: string) => list.includes(key), toggle };
}
