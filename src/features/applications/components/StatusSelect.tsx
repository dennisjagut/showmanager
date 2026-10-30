"use client";

import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { TONES } from "@/components/ui/tones";
import { setStatus } from "@/features/applications/actions";
import { APPLICATION_STATUSES, APPLICATION_STATUS_TONE, type ApplicationStatus } from "@/features/applications/status";
import { cn } from "@/lib/cn";

// Status as a colored select: changes are saved right away
export function StatusSelect({
  festivalId,
  season,
  status,
  festivalName,
}: {
  festivalId: number;
  season: number;
  status: ApplicationStatus;
  festivalName: string;
}) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(status);

  return (
    <div className="relative">
      <select
        aria-label={t("applications.statusSelect", { festival: festivalName, season })}
        value={optimistic}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as ApplicationStatus;
          startTransition(async () => {
            setOptimistic(next);
            await setStatus(festivalId, season, next);
          });
        }}
        className={cn(
          "w-full cursor-pointer appearance-none rounded-full py-1 pr-6 pl-3 text-xs font-medium ring-1 outline-none ring-inset focus:ring-2 disabled:cursor-wait",
          TONES[APPLICATION_STATUS_TONE[optimistic]],
        )}
      >
        {APPLICATION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(`applicationStatus.${s}`)}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[10px] opacity-60"
      >
        ▼
      </span>
    </div>
  );
}
