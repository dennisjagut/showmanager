"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Checkbox, DataList, TextAreaField, TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createFestival } from "@/features/applications/actions";
import { FestivalContactsField } from "@/features/applications/components/FestivalContactsField";
import { STATES } from "@/features/applications/festival-draft";
import type { ContactDetails } from "@/lib/api/types";
import { monthNames } from "@/lib/dates";

// Form for a new festival; an existing one is edited in FestivalEditor. The contacts are picked like in the editor and
// sent as JSON in the hidden field "contacts"; the name is kept here for the picker's suggestions.
export function FestivalForm({ allContacts }: { allContacts: ContactDetails[] }) {
  const t = useTranslations("festivalForm");
  const locale = useLocale();
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
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <TextField label={t("location")} name="location" placeholder={t("locationPlaceholder")} />
        <TextField label={t("state")} name="state" list="states" maxLength={20} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t("month")} name="month" list="months" />
        <TextField label={t("deadline")} name="deadline" placeholder={t("deadlinePlaceholder")} />
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
      <DataList id="states" values={STATES} />
      <DataList id="months" values={monthNames(locale)} />
      <SubmitButton className="btn-primary">{t("create")}</SubmitButton>
    </form>
  );
}
