import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Page, PageHeader } from "@/components/ui/Page";
import { FestivalForm } from "@/features/applications/components/FestivalForm";

export default function NewFestival() {
  const t = useTranslations();
  return (
    <Page width="narrow">
      <PageHeader back={{ href: "/", label: t("common.backToOverview") }} title={t("festival.newTitle")} />
      <Card>
        <FestivalForm />
      </Card>
    </Page>
  );
}
