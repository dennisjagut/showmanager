import { api, query } from "@/lib/api/client";
import { idOf } from "@/lib/api/path";
import type { ContactDetails, ContactList, ContactRef } from "@/lib/api/types";
import { param, type SearchParams } from "@/lib/search-params";

// Reading from the API. The filters of the list are passed on from the URL, the API ignores unknown values.

export function getContacts(sp: SearchParams = {}) {
  return api.get<ContactList>(
    `/contacts${query({ q: param(sp, "q"), kind: param(sp, "kind"), role: param(sp, "role") })}`,
  );
}

export function getContact(id: string) {
  return api.get<ContactDetails>(`/contacts/${idOf(id)}`);
}

// Contacts to choose from in a form, by name, e.g. all organizations or only the venues
export function getContactOptions({ kind, role }: { kind?: string; role?: string } = {}) {
  return api.get<ContactRef[]>(`/contacts/options${query({ kind, role })}`);
}
