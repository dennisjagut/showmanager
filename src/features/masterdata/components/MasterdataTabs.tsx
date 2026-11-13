"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoadingLink } from "@/components/ui/LoadingLink";
import { Segmented, segmentClass } from "@/components/ui/Segmented";
import { MASTERDATA_TABS } from "@/features/masterdata/tabs";

// Tabs between the kinds of master data. Detail pages keep their tab active.
export function MasterdataTabs() {
  const t = useTranslations("masterdata");
  const pathname = usePathname();

  return (
    <nav aria-label={t("tabsLabel")} className="max-w-full overflow-x-auto">
      <Segmented>
        {MASTERDATA_TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <LoadingLink
              key={tab.id}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={segmentClass(active)}
            >
              {t(`tabs.${tab.id}`)}
            </LoadingLink>
          );
        })}
      </Segmented>
    </nav>
  );
}
