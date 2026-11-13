import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { LoadingLink } from "@/components/ui/LoadingLink";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createPackingList } from "@/features/masterdata/actions";
import { getPackingLists } from "@/features/masterdata/api";

export const dynamic = "force-dynamic";

export default async function PackingLists() {
  const [lists, t] = await Promise.all([getPackingLists(), getTranslations("packingLists")]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-500">{t("intro")}</p>

      <Card className="p-0">
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {lists.map(({ packingList: p, itemCount }) => (
            <li key={p.id}>
              <LoadingLink
                href={`/masterdata/packing-lists/${p.id}`}
                className="flex w-full justify-between gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <span className="flex-1 font-medium">{p.name}</span>
                <span className="text-sm text-zinc-500">{t("items", { count: itemCount })}</span>
              </LoadingLink>
            </li>
          ))}
          {lists.length === 0 && <li className="px-4 py-4 text-sm text-zinc-500">{t("empty")}</li>}
        </ul>
      </Card>

      <Card dashed className="p-3">
        <form action={createPackingList} className="flex flex-wrap items-end gap-2">
          <TextField
            label={t("new")}
            name="name"
            required
            placeholder={t("newPlaceholder")}
            className="min-w-40 flex-1"
          />
          <SubmitButton className="btn-primary">{t("create")}</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
