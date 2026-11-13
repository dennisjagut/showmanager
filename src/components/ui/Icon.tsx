import { cn } from "@/lib/cn";

const PATHS = {
  menu: "M4 6h16M4 12h16M4 18h16",
  cross: "M6 6l12 12M18 6L6 18",
  sliders: "M4 6h9M17 6h3M15 4v4M4 12h3M11 12h9M9 10v4M4 18h11M19 18h1M17 16v4",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
  check: "M5 12l5 5L20 7",
};

export type IconName = keyof typeof PATHS;

// Line icons in the current text color
export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
