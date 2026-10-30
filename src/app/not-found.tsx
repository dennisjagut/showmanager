import Link from "next/link";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/Card";
import { Page } from "@/components/ui/Page";

// Unknown addresses and entries that no longer exist, e.g. a deleted show
export default function NotFound() {
  const t = useTranslations("errors");
  return (
    <Page width="narrow">
      <EmptyState>
        <div className="space-y-3">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t("notFoundTitle")}</h1>
          <p>{t("notFoundText")}</p>
          <Link href="/" className="btn-secondary">
            {t("home")}
          </Link>
        </div>
      </EmptyState>
    </Page>
  );
}
