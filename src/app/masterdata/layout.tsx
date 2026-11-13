import { getTranslations } from "next-intl/server";
import { Page, PageHeader } from "@/components/ui/Page";
import { MasterdataTabs } from "@/features/masterdata/components/MasterdataTabs";

// Frame of the master data: title and the tabs, the pages of each tab below
export default async function MasterdataLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("masterdata");

  return (
    <Page width="medium">
      <PageHeader title={t("title")} description={t("intro")} />
      <MasterdataTabs />
      {children}
    </Page>
  );
}
