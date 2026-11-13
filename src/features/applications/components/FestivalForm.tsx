import { useLocale, useTranslations } from "next-intl";
import { Checkbox, DataList, TextAreaField, TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createFestival } from "@/features/applications/actions";
import { STATES } from "@/features/applications/festival-draft";
import { monthNames } from "@/lib/dates";

// Form for a new festival; an existing one is edited in FestivalEditor
export function FestivalForm() {
  const t = useTranslations("festivalForm");
  const locale = useLocale();

  return (
    <form action={createFestival} className="space-y-4">
      <TextField label={t("name")} name="name" required autoFocus />
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <TextField label={t("location")} name="location" placeholder={t("locationPlaceholder")} />
        <TextField label={t("state")} name="state" list="states" maxLength={20} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t("month")} name="month" list="months" />
        <TextField label={t("deadline")} name="deadline" placeholder={t("deadlinePlaceholder")} />
      </div>
      <TextField label={t("website")} name="website" type="url" placeholder="https://" />
      <TextField label={t("contact")} name="contact" placeholder={t("contactPlaceholder")} />
      <TextAreaField label={t("notes")} name="notes" />
      <Checkbox label={t("active")} name="active" defaultChecked />
      <DataList id="states" values={STATES} />
      <DataList id="months" values={monthNames(locale)} />
      <SubmitButton className="btn-primary">{t("create")}</SubmitButton>
    </form>
  );
}
