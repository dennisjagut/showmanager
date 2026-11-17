import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { DataList, Field, SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { LoadingLink } from "@/components/ui/LoadingLink";
import { Page, PageHeader } from "@/components/ui/Page";
import { Segmented, segmentClass } from "@/components/ui/Segmented";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { createContact } from "@/features/contacts/actions";
import { getContactOptions } from "@/features/contacts/api";
import { RoleToggles } from "@/features/contacts/components/RoleToggles";
import { CONTACT_KINDS, CONTACT_KIND_ICON, isContactKind, rolesFor } from "@/features/contacts/kinds";
import { param, type SearchParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

// New person or organization. The kind is chosen at the top and cannot be changed later; a person can be linked to an
// organization right away, more links follow in the edit mode.
export default async function NewContact({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const kindParam = param(sp, "kind");
  const kind = isContactKind(kindParam) ? kindParam : "organization";
  const [organizations, t, tf, tk, tc] = await Promise.all([
    kind === "person" ? getContactOptions({ kind: "organization" }) : Promise.resolve([]),
    getTranslations("contacts"),
    getTranslations("contactForm"),
    getTranslations("contactKind"),
    getTranslations("common"),
  ]);

  return (
    <Page width="narrow">
      <PageHeader back={{ href: "/contacts", label: t("allContacts") }} title={t(`newTitle.${kind}`)} />
      <Card>
        {/* A new key per kind, so the browser does not keep the fields of the other one */}
        <form key={kind} action={createContact} className="space-y-4">
          <Field as="div" label={tf("kind")} hint={tf("kindHint")}>
            <Segmented>
              {CONTACT_KINDS.map((k) => (
                <LoadingLink key={k} href={`/contacts/new?kind=${k}`} replace className={segmentClass(kind === k)}>
                  <span aria-hidden>{CONTACT_KIND_ICON[k]}</span> {tk(k)}
                </LoadingLink>
              ))}
            </Segmented>
          </Field>
          <input type="hidden" name="kind" value={kind} />
          <TextField label={tf(`name.${kind}`)} name="name" required autoFocus autoComplete="off" />
          <Field as="div" label={t("roles")} hint={t(`rolesHint.${kind}`)}>
            <RoleToggles roles={rolesFor(kind)} defaultSelected={[]} />
          </Field>
          {kind === "person" && organizations.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label={tf("organization")}
                name="organizationId"
                defaultValue=""
                options={[
                  { value: "", label: tf("noOrganization") },
                  ...organizations.map((o) => ({ value: o.id, label: o.name })),
                ]}
              />
              <TextField
                label={t("position")}
                name="position"
                list="positions"
                placeholder={t("positionPlaceholder")}
                autoComplete="off"
              />
              <DataList id="positions" values={t.raw("positionSuggestions") as string[]} />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label={tf("email")} name="email" type="email" autoComplete="off" />
            <TextField label={tf("phone")} name="phone" type="tel" autoComplete="off" />
          </div>
          <TextField label={tf("website")} name="website" type="url" placeholder="https://" />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label={tf("street")} name="street" autoComplete="off" />
            <TextField
              label={tf("location")}
              name="location"
              placeholder={tf("locationPlaceholder")}
              autoComplete="off"
            />
          </div>
          <TextAreaField label={tf("notes")} name="notes" placeholder={tf(`notesPlaceholder.${kind}`)} />
          <SubmitButton className="btn-primary">{tc("add")}</SubmitButton>
        </form>
      </Card>
    </Page>
  );
}
