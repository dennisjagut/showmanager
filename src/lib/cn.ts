import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Joins class names and lets later Tailwind classes override earlier ones, e.g. cn("px-3", "px-2") → "px-2"
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
