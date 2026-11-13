import { getTranslations } from "next-intl/server";
import { Page, PageHeader } from "@/components/ui/Page";
import { getTemplates } from "@/features/shows/api";
import { TemplatesEditor } from "@/features/shows/components/TemplatesEditor";

export const dynamic = "force-dynamic";

export default async function Templates() {
  const [list, t, tc] = await Promise.all([getTemplates(), getTranslations("templates"), getTranslations("common")]);

  return (
    <Page width="narrow">
      <PageHeader back={{ href: "/shows", label: tc("allShows") }} title={t("title")} description={t("intro")} />
      <TemplatesEditor templates={list} />
    </Page>
  );
}
