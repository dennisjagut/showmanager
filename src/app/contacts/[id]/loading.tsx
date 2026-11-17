import { useTranslations } from "next-intl";
import { Bar } from "@/components/ui/Skeleton";

export default function Loading() {
  const t = useTranslations("common");
  return (
    <div className="space-y-6" aria-busy aria-label={t("loading")}>
      <div className="space-y-2">
        <Bar className="h-7 w-64" />
        <Bar className="h-4 w-48" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Bar className="h-72" />
        <Bar className="h-96" />
      </div>
    </div>
  );
}
