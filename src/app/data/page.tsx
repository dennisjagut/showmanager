import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/Field";
import { Page, PageHeader } from "@/components/ui/Page";
import { getSeasons } from "@/features/applications/api";

export const dynamic = "force-dynamic";

export default async function Data() {
  const [seasons, t] = await Promise.all([getSeasons(), getTranslations("data")]);

  return (
    <Page width="narrow">
      <PageHeader title={t("title")} description={t("intro")} />

      <Card title={t("export")} className="space-y-4">
        <form action="/export/applications" className="flex flex-wrap items-end gap-2">
          <SelectField
            label={t("exportApplications")}
            name="season"
            defaultValue={seasons.current}
            className="min-w-40 flex-1"
            options={seasons.all.map((s) => ({ value: s, label: t("season", { season: s }) }))}
          />
          <button type="submit" className="btn-secondary">
            {t("download")}
          </button>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm">{t("exportShows")}</span>
          <a href="/export/shows" className="btn-secondary">
            {t("download")}
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm">{t("exportCalculator")}</span>
          <a href="/export/calculator" className="btn-secondary">
            {t("download")}
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <span className="text-sm">{t.rich("backup", { strong: (chunks) => <strong>{chunks}</strong> })}</span>
          <a href="/api/v1/backup" className="btn-primary">
            {t("downloadBackup")}
          </a>
        </div>
      </Card>
    </Page>
  );
}
