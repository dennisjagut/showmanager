"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Checkbox, SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createFestival } from "@/features/applications/actions";
import { DeadlineInput } from "@/features/applications/components/DeadlineInput";
import { FestivalContactsField } from "@/features/applications/components/FestivalContactsField";
import { useFestivalOptions } from "@/features/applications/options";
import type { ContactDetails } from "@/lib/api/types";

// Form for a new festival; an existing one is edited in FestivalEditor. The contacts are picked like in the editor and
// sent as JSON in the hidden field "contacts"; the name is kept here for the picker's suggestions.
export function FestivalForm({ allContacts }: { allContacts: ContactDetails[] }) {
  const t = useTranslations("festivalForm");
  const options = useFestivalOptions();
  const none = { value: "", label: t("none") };
  const [name, setName] = useState("");
  const [contacts, setContacts] = useState<number[]>([]);

  return (
    <form action={createFestival} className="space-y-4">
      <TextField
        label={t("name")}
        name="name"
        required
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t("location")} name="location" placeholder={t("locationPlaceholder")} />
        <SelectField label={t("state")} name="state" options={[none, ...options.states]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label={t("month")} name="month" options={[none, ...options.months]} />
        <DeadlineInput label={t("deadline")} hint={t("deadlineHint")} name="deadline" />
      </div>
      <TextField label={t("website")} name="website" type="url" placeholder="https://" />
      <FestivalContactsField
        festivalName={name}
        value={contacts}
        changed={false}
        allContacts={allContacts}
        onChange={setContacts}
      />
      <input type="hidden" name="contacts" value={JSON.stringify(contacts)} />
      <TextAreaField label={t("notes")} name="notes" />
      <Checkbox label={t("active")} name="active" defaultChecked />
      <SubmitButton className="btn-primary">{t("create")}</SubmitButton>
    </form>
  );
}
