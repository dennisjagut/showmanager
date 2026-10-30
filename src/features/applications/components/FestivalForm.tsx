import { useLocale, useTranslations } from "next-intl";
import { Checkbox, DataList, TextAreaField, TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Festival } from "@/lib/api/types";
import { saveFestival } from "@/features/applications/actions";
import { monthNames } from "@/lib/dates";

// German federal states
const STATES = ["BB", "BE", "BW", "BY", "HB", "HE", "HH", "MV", "NI", "NW", "RP", "SH", "SL", "SN", "ST", "TH"];

export function FestivalForm({ festival }: { festival?: Festival }) {
  const t = useTranslations("festivalForm");
  const locale = useLocale();

  return (
    <form action={saveFestival} className="space-y-4">
      {festival && <input type="hidden" name="id" value={festival.id} />}
      <TextField label={t("name")} name="name" defaultValue={festival?.name} required autoFocus={!festival} />
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <TextField
          label={t("location")}
          name="location"
          defaultValue={festival?.location ?? ""}
          placeholder={t("locationPlaceholder")}
        />
        <TextField label={t("state")} name="state" defaultValue={festival?.state ?? ""} list="states" maxLength={20} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t("month")} name="month" defaultValue={festival?.month ?? ""} list="months" />
        <TextField
          label={t("deadline")}
          name="deadline"
          defaultValue={festival?.deadline ?? ""}
          placeholder={t("deadlinePlaceholder")}
        />
      </div>
      <TextField
        label={t("website")}
        name="website"
        type="url"
        defaultValue={festival?.website ?? ""}
        placeholder="https://"
      />
      <TextField
        label={t("contact")}
        name="contact"
        defaultValue={festival?.contact ?? ""}
        placeholder={t("contactPlaceholder")}
      />
      <TextAreaField label={t("notes")} name="notes" defaultValue={festival?.notes ?? ""} />
      <Checkbox label={t("active")} name="active" defaultChecked={festival?.active ?? true} />
      <DataList id="states" values={STATES} />
      <DataList id="months" values={monthNames(locale)} />
      <SubmitButton className="btn-primary">{festival ? t("saveChanges") : t("create")}</SubmitButton>
    </form>
  );
}
