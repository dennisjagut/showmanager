import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Page, PageHeader } from "@/components/ui/Page";
import { FestivalForm } from "@/features/applications/components/FestivalForm";
import { getContacts } from "@/features/contacts/api";

export const dynamic = "force-dynamic";

export default async function NewFestival() {
  const [{ rows }, t] = await Promise.all([getContacts(), getTranslations()]);
  return (
    <Page width="narrow">
      <PageHeader back={{ href: "/", label: t("common.backToOverview") }} title={t("festival.newTitle")} />
      <Card>
        <FestivalForm allContacts={rows} />
      </Card>
    </Page>
  );
}
