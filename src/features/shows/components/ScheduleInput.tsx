"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { DataList, TextField } from "@/components/ui/Field";
import { ResetForm } from "@/components/ui/ResetForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ScheduleTemplate } from "@/lib/api/types";
import { addScheduleItem } from "@/features/shows/actions";

// New schedule item: time + name, the name picked from the templates with one click or typed freely.
// After saving, the form is cleared and the time field (the first field) gets the focus again.
export function ScheduleInput({ showId, templates }: { showId: number; templates: ScheduleTemplate[] }) {
  const t = useTranslations();

  function pick(event: React.MouseEvent<HTMLButtonElement>, name: string) {
    const form = event.currentTarget.form;
    const fields = form?.elements;
    const item = fields?.namedItem("item") as HTMLInputElement | null;
    const time = fields?.namedItem("time") as HTMLInputElement | null;
    if (!form || !item || !time) return;
    item.value = name;
    // Without a time, jump to the time field, otherwise save right away
    if (!time.value) time.focus();
    else form.requestSubmit();
  }

  return (
    <ResetForm action={addScheduleItem} className="space-y-3">
      <input type="hidden" name="showId" value={showId} />
      <div className="flex flex-wrap items-end gap-2">
        <TextField label={t("show.time")} type="time" name="time" required inputClassName="w-32" />
        <TextField
          label={t("show.item")}
          name="item"
          required
          list="schedule-items"
          placeholder={t("show.itemPlaceholder")}
          className="min-w-40 flex-1"
        />
        <DataList id="schedule-items" values={templates.map((v) => v.name)} />
        <SubmitButton className="btn-secondary">{t("common.add")}</SubmitButton>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {templates.map((v) => (
          <button
            key={v.id}
            type="button"
            title={v.repeatable ? t("show.repeatableHint") : undefined}
            onClick={(e) => pick(e, v.name)}
            className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700 transition hover:bg-brand-100 hover:text-brand-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-brand-950 dark:hover:text-brand-200"
          >
            {v.name}
            {v.repeatable && <span className="ml-0.5 opacity-50">#</span>}
          </button>
        ))}
        <Link href="/shows/templates" className="ml-1 text-xs link">
          {t("show.manageTemplates")}
        </Link>
      </div>
    </ResetForm>
  );
}
