"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/lib/api/client";
import { idOf } from "@/lib/api/path";
import type { ContactCreate, ContactDetails, ContactSave, Created } from "@/lib/api/types";

// The Server Actions only pass the forms on to the API, which validates and saves.

const CONTACTS = "/contacts";

// Linked contacts show this one on their page, so all contact pages are refreshed
function refresh() {
  revalidatePath(CONTACTS);
  revalidatePath(`${CONTACTS}/[id]`, "page");
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

// The form of a new contact: the roles are checkboxes with the same name, a person can name an organization right away
export async function createContact(formData: FormData) {
  const organizationId = text(formData, "organizationId");
  const body: ContactCreate = {
    kind: text(formData, "kind") as ContactCreate["kind"],
    name: text(formData, "name"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    website: text(formData, "website"),
    street: text(formData, "street"),
    location: text(formData, "location"),
    notes: text(formData, "notes"),
    roles: formData.getAll("roles").map(String) as ContactCreate["roles"],
    links: organizationId ? [{ contactId: Number(idOf(organizationId)), position: text(formData, "position") }] : [],
  };
  const { id } = await api.post<Created>(CONTACTS, body);
  refresh();
  redirect(`${CONTACTS}/${id}?saved=1`);
}

// The editor sends the whole contact with roles and links; the answer is the saved contact
export async function saveContact(contactId: number, body: ContactSave): Promise<ContactDetails> {
  const details = await api.put<ContactDetails>(`${CONTACTS}/${idOf(String(contactId))}`, body);
  refresh();
  return details;
}

export async function deleteContact(formData: FormData) {
  await api.delete(`${CONTACTS}/${idOf(formData.get("id"))}`);
  refresh();
  redirect(CONTACTS);
}
