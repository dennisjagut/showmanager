import { getTranslations } from "next-intl/server";
import { getContacts } from "@/features/contacts/api";
import { csvResponse, csvText } from "@/lib/csv";

export const dynamic = "force-dynamic";

const COLUMNS = ["kind", "name", "roles", "email", "phone", "website", "street", "location", "links", "notes"] as const;

// All contacts, one row per contact. Roles go into one cell, links (organizations or people) one per line.
export async function GET() {
  const [{ rows }, t, tk, tr] = await Promise.all([
    getContacts(),
    getTranslations("csv.contacts"),
    getTranslations("contactKind"),
    getTranslations("contactRole"),
  ]);

  const content = rows.map(({ contact: c, roles, links }) => [
    tk(c.kind),
    c.name,
    roles.map((r) => tr(r)).join(", "),
    c.email,
    c.phone,
    c.website,
    c.street,
    c.location,
    links.map((l) => (l.position ? `${l.contact.name} (${l.position})` : l.contact.name)).join("\n"),
    c.notes,
  ]);

  return csvResponse(
    csvText(
      COLUMNS.map((c) => t(c)),
      content,
    ),
    t("filename"),
  );
}
