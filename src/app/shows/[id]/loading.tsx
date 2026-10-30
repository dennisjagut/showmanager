import { useTranslations } from "next-intl";
import { Bar } from "@/components/ui/Skeleton";

export default function Loading() {
  const t = useTranslations("common");
  return (
    <div className="space-y-6" aria-busy aria-label={t("loading")}>
      <div className="flex items-center gap-4">
        <Bar className="h-20 w-20" />
        <div className="space-y-2">
          <Bar className="h-7 w-64" />
          <Bar className="h-4 w-48" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Bar className="h-80" />
        <Bar className="h-64" />
      </div>
    </div>
  );
}
