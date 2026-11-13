import { getTranslations } from "next-intl/server";
import { ActionButton } from "@/components/ui/ActionButton";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { BackLink } from "@/components/ui/Page";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { copyPackingList, deletePackingList } from "@/features/masterdata/actions";
import { getPackingList } from "@/features/masterdata/api";
import { PackingListEditor } from "@/features/masterdata/components/PackingListEditor";

export const dynamic = "force-dynamic";

export default async function PackingListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [details, t] = await Promise.all([getPackingList(id), getTranslations("packingLists")]);
  const list = details.packingList;

  return (
    <div className="space-y-6">
      <BackLink href="/masterdata/packing-lists">{t("allLists")}</BackLink>

      {/* A new key for another list, so the editor does not keep the draft of the previous one */}
      <PackingListEditor key={list.id} details={details} />

      <Card title={t("copy")}>
        <p className="text-sm text-zinc-500">{t("copyHint")}</p>
        <form action={copyPackingList} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={list.id} />
          <TextField
            label={t("copyName")}
            name="name"
            required
            placeholder={t("copyPlaceholder")}
            className="min-w-48 flex-1"
          />
          <SubmitButton className="btn-secondary">{t("copySubmit")}</SubmitButton>
        </form>
      </Card>

      <ActionButton
        action={deletePackingList}
        values={{ id: list.id }}
        confirm={t("deleteConfirm", { name: list.name })}
        formClassName="text-right"
        className="btn-danger text-xs"
      >
        {t("delete")}
      </ActionButton>
    </div>
  );
}
