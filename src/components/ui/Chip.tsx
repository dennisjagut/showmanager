import { cn } from "@/lib/cn";
import { LoadingLink } from "./LoadingLink";
import { TONES, type Tone } from "./tones";

// Round filter link. The active one is highlighted, while one is active the others fade.
export function FilterChip({
  href,
  tone = "neutral",
  active,
  dimmed = false,
  children,
}: {
  href: string;
  tone?: Tone;
  active: boolean;
  dimmed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <LoadingLink
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm ring-1 transition ring-inset hover:opacity-80",
        TONES[tone],
        // Neutral has no color of its own, so the active one is shown dark
        active && (tone === "neutral" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "ring-2"),
        dimmed && !active && "opacity-50",
      )}
    >
      {children}
    </LoadingLink>
  );
}
