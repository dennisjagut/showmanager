import { useTranslations } from "next-intl";
import { Checkbox, SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createFestival } from "@/features/applications/actions";
import { useFestivalOptions } from "@/features/applications/options";

// Form for a new festival; an existing one is edited in FestivalEditor
export function FestivalForm() {
  const t = useTranslations("festivalForm");
  const options = useFestivalOptions();
  const none = { value: "", label: t("none") };

  return (
    <form action={createFestival} className="space-y-4">
      <TextField label={t("name")} name="name" required autoFocus />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t("location")} name="location" placeholder={t("locationPlaceholder")} />
        <SelectField label={t("state")} name="state" options={[none, ...options.states]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label={t("month")} name="month" options={[none, ...options.months]} />
        <TextField label={t("deadline")} name="deadline" type="date" hint={t("deadlineHint")} />
      </div>
      <TextField label={t("website")} name="website" type="url" placeholder="https://" />
      <TextField label={t("contact")} name="contact" placeholder={t("contactPlaceholder")} />
      <TextAreaField label={t("notes")} name="notes" />
      <Checkbox label={t("active")} name="active" defaultChecked />
      <SubmitButton className="btn-primary">{t("create")}</SubmitButton>
    </form>
  );
}
