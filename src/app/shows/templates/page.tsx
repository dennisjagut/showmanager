import { getTranslations } from "next-intl/server";
import { ActionButton, RemoveButton } from "@/components/ui/ActionButton";
import { Card } from "@/components/ui/Card";
import { Checkbox, TextField } from "@/components/ui/Field";
import { Page, PageHeader } from "@/components/ui/Page";
import { ResetForm } from "@/components/ui/ResetForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { addTemplate, deleteTemplate, moveTemplate, saveTemplate } from "@/features/shows/actions";
import { getTemplates } from "@/features/shows/api";

export const dynamic = "force-dynamic";

const MOVE = "px-1 text-xs leading-none text-zinc-500 hover:text-zinc-900 disabled:opacity-20 dark:hover:text-zinc-100";

export default async function Templates() {
  const [list, t, tc] = await Promise.all([getTemplates(), getTranslations("templates"), getTranslations("common")]);

  return (
    <Page width="narrow">
      <PageHeader back={{ href: "/shows", label: tc("allShows") }} title={t("title")} description={t("intro")} />

      <Card className="p-0">
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {list.map((v, i) => (
            <li key={v.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
              <div className="flex flex-col">
                <ActionButton
                  action={moveTemplate}
                  values={{ id: v.id, direction: "up" }}
                  disabled={i === 0}
                  aria-label={t("moveUp", { name: v.name })}
                  className={MOVE}
                >
                  ▲
                </ActionButton>
                <ActionButton
                  action={moveTemplate}
                  values={{ id: v.id, direction: "down" }}
                  disabled={i === list.length - 1}
                  aria-label={t("moveDown", { name: v.name })}
                  className={MOVE}
                >
                  ▼
                </ActionButton>
              </div>
              <form action={saveTemplate} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={v.id} />
                <input
                  name="name"
                  defaultValue={v.name}
                  required
                  aria-label={tc("name")}
                  className="input min-w-40 flex-1 py-1.5"
                />
                <Checkbox label={t("repeatable")} name="repeatable" defaultChecked={v.repeatable} />
                <SubmitButton className="btn-secondary py-1.5">{tc("save")}</SubmitButton>
              </form>
              <RemoveButton
                action={deleteTemplate}
                values={{ id: v.id }}
                label={tc("delete", { name: v.name })}
                confirm={t("deleteConfirm", { name: v.name })}
              />
            </li>
          ))}
          {list.length === 0 && <li className="px-3 py-4 text-sm text-zinc-500">{t("empty")}</li>}
        </ul>
      </Card>

      <Card dashed className="p-3">
        <ResetForm action={addTemplate} className="flex flex-wrap items-end gap-2">
          <TextField
            label={t("new")}
            name="name"
            required
            placeholder={t("newPlaceholder")}
            className="min-w-40 flex-1"
          />
          <Checkbox label={t("repeatable")} name="repeatable" className="pb-2" />
          <SubmitButton className="btn-primary">{tc("add")}</SubmitButton>
        </ResetForm>
      </Card>
    </Page>
  );
}
