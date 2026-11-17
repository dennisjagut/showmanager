import { useTranslations } from "next-intl";
import { DataList, SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { PackingListSummary, Show } from "@/lib/api/types";
import { saveShow } from "@/features/shows/actions";
import { SHOW_STATUSES } from "@/features/shows/status";

export function ShowForm({
  show,
  tours,
  packingLists,
}: {
  show?: Show;
  tours: string[];
  packingLists: PackingListSummary[];
}) {
  const t = useTranslations("showForm");
  const ts = useTranslations("showStatus");
  const ti = useTranslations("showInfo");
  // Current value of a column for defaultValue, empty for a new show
  const value = (name: keyof Show) => {
    const v = show?.[name];
    return v === null || v === undefined ? "" : String(v);
  };

  return (
    <form action={saveShow} className="space-y-6">
      {show && <input type="hidden" name="id" value={show.id} />}

      <fieldset className="space-y-3">
        <legend className="mb-2 section-title">{t("show")}</legend>
        <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto]">
          <TextField
            label={t("date")}
            name="date"
            type="date"
            required
            defaultValue={value("date")}
            inputClassName="w-44"
          />
          <TextField
            label={t("title")}
            name="title"
            required
            defaultValue={value("title")}
            placeholder={t("titlePlaceholder")}
            autoFocus={!show}
          />
          <SelectField
            label={t("status")}
            name="status"
            defaultValue={show?.status ?? "option"}
            options={SHOW_STATUSES.map((s) => ({ value: s, label: ts(s) }))}
          />
        </div>
        <TextField
          label={t("tour")}
          name="tour"
          defaultValue={value("tour")}
          list="tours"
          placeholder={t("tourPlaceholder")}
        />
        <DataList id="tours" values={tours} />
        <p className="text-sm text-zinc-500">{t(show ? "contactsHint" : "contactsHintNew")}</p>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 section-title">{t("deal")}</legend>
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
          <TextField label={ti("fee")} name="fee" defaultValue={value("fee")} placeholder={t("feePlaceholder")} />
          <TextField
            label={t("guestQuota")}
            name="guestQuota"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={value("guestQuota")}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 section-title">{t("logistics")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextAreaField
            label={ti("travel")}
            name="travel"
            defaultValue={value("travel")}
            placeholder={t("travelPlaceholder")}
          />
          <TextAreaField
            label={ti("hotel")}
            name="hotel"
            defaultValue={value("hotel")}
            placeholder={t("hotelPlaceholder")}
          />
          <TextAreaField
            label={ti("tech")}
            name="tech"
            defaultValue={value("tech")}
            placeholder={t("techPlaceholder")}
          />
          <TextAreaField
            label={ti("notes")}
            name="notes"
            defaultValue={value("notes")}
            placeholder={t("notesPlaceholder")}
          />
        </div>
        <SelectField
          label={t("packingList")}
          name="packingListId"
          defaultValue={value("packingListId")}
          hint={t("packingListHint")}
          className="sm:max-w-xs"
          options={[
            { value: "", label: t("noPackingList") },
            ...packingLists.map((p) => ({ value: p.packingList.id, label: p.packingList.name })),
          ]}
        />
      </fieldset>

      <SubmitButton className="btn-primary">{show ? t("saveChanges") : t("create")}</SubmitButton>
    </form>
  );
}
