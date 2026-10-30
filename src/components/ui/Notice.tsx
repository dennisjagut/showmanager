import { cn } from "@/lib/cn";
import { TONES, type Tone } from "./tones";

// Message box, e.g. "Gespeichert ✓" or an error
export function Notice({
  tone = "success",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-md px-3 py-2 text-sm", TONES[tone], className)}
    >
      {children}
    </div>
  );
}
