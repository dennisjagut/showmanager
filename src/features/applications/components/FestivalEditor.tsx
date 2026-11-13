"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Facts } from "@/components/ui/Facts";
import { Checkbox, DataList, SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { SaveBar } from "@/components/ui/SaveBar";
import { useDraft } from "@/components/ui/use-draft";
import { saveFestival } from "@/features/applications/actions";
import { Deadline } from "@/features/applications/components/Deadline";
import {
  STATES,
  applicationKey,
  countChanges,
  draftFrom,
  isApplicationEdited,
  isFieldChanged,
  saveBody,
  validate,
  type ApplicationDraft,
  type FestivalField,
} from "@/features/applications/festival-draft";
import { APPLICATION_STATUSES } from "@/features/applications/status";
import type { FestivalDetails } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { monthNames } from "@/lib/dates";

/**
 * Edit mode of a festival: master data and the applications of all seasons in one draft, saved with one button.
 * "Abbrechen" and saving both go back to the read view.
 */
export function FestivalEditor({
  details,
  season,
  readHref,
}: {
  details: FestivalDetails;
  // Season the overview showed, suggested for a new application
  season: number;
  readHref: string;
}) {
  const t = useTranslations("festival");
  const tf = useTranslations("festivalForm");
  const ts = useTranslations("applicationStatus");
  const th = useTranslations("applicationStatusHint");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const festivalId = details.festival.id;
  const deadlines = new Map(details.applications.map((a) => [a.season, a.deadline]));

  const editor = useDraft({
    initial: draftFrom(details),
    save: async (draft) => {
      const next = draftFrom(await saveFestival(festivalId, saveBody(draft)));
      router.push(`${readHref}&saved=1`);
      return next;
    },
    compare: countChanges,
    validate: (draft) => validate(draft, { nameRequired: tc("nameRequired") }),
  });
  const { draft, saved, update, errors } = editor;

  const used = new Set(draft.applications.map((a) => a.season));
  const free = details.seasons.all.filter((s) => !used.has(s));
  const [newSeason, setNewSeason] = useState<number | undefined>(season);
  // The chosen season, or the newest free one if it is taken meanwhile
  const selected = newSeason !== undefined && free.includes(newSeason) ? newSeason : free[0];
  const before = new Map(saved.applications.map((a) => [a.key, a]));

  function field(name: FestivalField) {
    return {
      name,
      value: draft.fields[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        update({ ...draft, fields: { ...draft.fields, [name]: e.target.value } }),
      changed: isFieldChanged(draft, saved, name),
      error: errors[name],
    };
  }

  function changeApplication(key: string, changes: Partial<ApplicationDraft>) {
    update({ ...draft, applications: draft.applications.map((a) => (a.key === key ? { ...a, ...changes } : a)) });
  }

  function removeApplication(application: ApplicationDraft) {
    // A new application is simply dropped, a saved one stays marked until saving
    if (!before.has(application.key)) {
      update({ ...draft, applications: draft.applications.filter((a) => a.key !== application.key) });
    } else changeApplication(application.key, { removed: true });
  }

  function addApplication() {
    if (selected === undefined) return;
    const added: ApplicationDraft = {
      key: applicationKey(selected),
      season: selected,
      status: "open",
      appliedOn: "",
      note: "",
      removed: false,
    };
    // Newest season first, like the read view
    update({ ...draft, applications: [...draft.applications, added].sort((a, b) => b.season - a.season) });
    setNewSeason(free.find((s) => s !== selected));
  }

  return (
    <form {...editor.form} noValidate className="space-y-6">
      <fieldset disabled={editor.saving} className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="space-y-3">
          <h2 className="section-title">{t("applications")}</h2>
          {draft.applications.map((a) => {
            if (a.removed) {
              return (
                <div key={a.key} className="flex items-center gap-3 rounded-lg bg-rose-50 px-4 py-3 dark:bg-rose-950">
                  <span className="flex-1 text-sm text-rose-700 line-through dark:text-rose-400">
                    {t("removed", { season: a.season })}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeApplication(a.key, { removed: false })}
                    className="btn-secondary py-1.5 pointer-coarse:min-h-11"
                  >
                    {tc("undo")}
                  </button>
                </div>
              );
            }
            const isNew = !before.has(a.key);
            const deadline = deadlines.get(a.season) ?? null;
            return (
              <Card
                key={a.key}
                title={
                  <span className="inline-flex items-center gap-2">
                    {t("season", { season: a.season })}
                    {isNew && <Badge tone="info">{tc("new")}</Badge>}
                    {!isNew && isApplicationEdited(a, before.get(a.key)) && (
                      <span title={tc("changed")} className="h-1.5 w-1.5 rounded-full bg-brand-700 dark:bg-brand-400">
                        <span className="sr-only">{tc("changed")}</span>
                      </span>
                    )}
                  </span>
                }
                actions={
                  <button
                    type="button"
                    onClick={() => removeApplication(a)}
                    aria-label={t("removeSeason", { season: a.season })}
                    title={t("removeSeason", { season: a.season })}
                    className="btn-danger shrink-0 px-2 py-1.5 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
                  >
                    <Icon name="cross" className="h-4 w-4" />
                  </button>
                }
              >
                <Facts
                  items={[
                    {
                      label: tf("deadline"),
                      value: draft.fields.deadline && (
                        <Deadline text={draft.fields.deadline} info={deadline} highlight={a.status === "open"} inline />
                      ),
                    },
                  ]}
                />
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <SelectField
                    label={t("status")}
                    value={a.status}
                    onChange={(e) => changeApplication(a.key, { status: e.target.value as ApplicationDraft["status"] })}
                    changed={!isNew && a.status !== before.get(a.key)?.status}
                    options={APPLICATION_STATUSES.map((s) => ({
                      value: s,
                      label: t("statusOption", { label: ts(s), hint: th(s) }),
                    }))}
                  />
                  <TextField
                    label={t("appliedOn")}
                    type="date"
                    value={a.appliedOn}
                    onChange={(e) => changeApplication(a.key, { appliedOn: e.target.value })}
                    changed={!isNew && a.appliedOn !== before.get(a.key)?.appliedOn}
                    inputClassName="w-44"
                  />
                </div>
                <TextAreaField
                  label={t("note")}
                  value={a.note}
                  onChange={(e) => changeApplication(a.key, { note: e.target.value })}
                  changed={!isNew && a.note.trim() !== before.get(a.key)?.note}
                  rows={2}
                  placeholder={t("notePlaceholder")}
                />
              </Card>
            );
          })}
          {draft.applications.length === 0 && <p className="text-sm text-zinc-500">{t("noApplicationsYet")}</p>}
          {selected !== undefined && (
            <Card dashed className="p-3">
              <div className="flex flex-wrap items-end gap-2">
                <SelectField
                  label={t("addSeason")}
                  value={selected}
                  onChange={(e) => setNewSeason(Number(e.target.value))}
                  inputClassName="py-1.5"
                  options={free.map((s) => ({ value: s, label: String(s) }))}
                />
                <button type="button" onClick={addApplication} className="btn-secondary pointer-coarse:min-h-11">
                  {tc("add")}
                </button>
              </div>
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="section-title">{t("masterData")}</h2>
          <Card className="space-y-4">
            <TextField label={tf("name")} required autoComplete="off" {...field("name")} />
            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <TextField label={tf("location")} placeholder={tf("locationPlaceholder")} {...field("location")} />
              <TextField label={tf("state")} list="states" maxLength={20} {...field("state")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label={tf("month")} list="months" {...field("month")} />
              <TextField label={tf("deadline")} placeholder={tf("deadlinePlaceholder")} {...field("deadline")} />
            </div>
            <TextField label={tf("website")} type="url" placeholder="https://" {...field("website")} />
            <TextField label={tf("contact")} placeholder={tf("contactPlaceholder")} {...field("contact")} />
            <TextAreaField label={tf("notes")} {...field("notes")} />
            <Checkbox
              label={tf("active")}
              checked={draft.active}
              onChange={(e) => update({ ...draft, active: e.target.checked })}
              className={cn("pointer-coarse:min-h-11", draft.active !== saved.active && "font-medium")}
            />
            <DataList id="states" values={STATES} />
            <DataList id="months" values={monthNames(locale)} />
          </Card>
        </section>
      </fieldset>

      <SaveBar
        status={editor.status}
        changes={editor.changes}
        errorCount={editor.errorCount}
        onDiscard={() => router.push(readHref)}
        discardLabel={tc("cancel")}
        alwaysVisible
      />
    </form>
  );
}
