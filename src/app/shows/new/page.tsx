import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Page, PageHeader } from "@/components/ui/Page";
import { ShowForm } from "@/features/shows/components/ShowForm";
import { getPackingLists } from "@/features/masterdata/api";
import { getTours } from "@/features/shows/api";

export const dynamic = "force-dynamic";

export default async function NewShow() {
  const [tourList, packingLists, t] = await Promise.all([getTours(), getPackingLists(), getTranslations()]);
  return (
    <Page width="medium">
      <PageHeader back={{ href: "/shows", label: t("common.allShows") }} title={t("show.newTitle")} />
      <Card>
        <ShowForm tours={tourList} packingLists={packingLists} />
      </Card>
    </Page>
  );
}
