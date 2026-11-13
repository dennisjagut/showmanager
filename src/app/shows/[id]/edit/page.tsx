import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Page, PageHeader } from "@/components/ui/Page";
import { ShowForm } from "@/features/shows/components/ShowForm";
import { getPackingLists } from "@/features/masterdata/api";
import { getShow, getTours } from "@/features/shows/api";

export const dynamic = "force-dynamic";

export default async function EditShow({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, tourList, packingLists, t] = await Promise.all([
    getShow(id),
    getTours(),
    getPackingLists(),
    getTranslations(),
  ]);

  return (
    <Page width="medium">
      <PageHeader
        back={{ href: `/shows/${id}`, label: t("common.backToShow") }}
        title={t("show.editTitle", { title: data.show.title })}
      />
      <Card>
        <ShowForm show={data.show} tours={tourList} packingLists={packingLists} />
      </Card>
    </Page>
  );
}
