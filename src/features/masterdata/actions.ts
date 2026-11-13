"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, formBody } from "@/lib/api/client";
import { idOf } from "@/lib/api/path";
import type { Created, PackingListDetails, PackingListSave } from "@/lib/api/types";

// The Server Actions only pass the forms on to the API, which validates and saves.

const PACKING_LISTS = "/masterdata/packing-lists";

// Shows display the packing list and choose it in their form, so they are refreshed too
function refresh(listId?: string) {
  revalidatePath(PACKING_LISTS);
  if (listId) revalidatePath(`${PACKING_LISTS}/${listId}`);
  revalidatePath("/shows/[id]", "page");
  revalidatePath("/shows/[id]/edit", "page");
  revalidatePath("/shows/new");
}

export async function createPackingList(formData: FormData) {
  const { id } = await api.post<Created>("/packing-lists", formBody(formData));
  refresh();
  redirect(`${PACKING_LISTS}/${id}`);
}

export async function copyPackingList(formData: FormData) {
  const listId = idOf(formData.get("id"));
  const { id } = await api.post<Created>(`/packing-lists/${listId}/copy`, formBody(formData, { omit: ["id"] }));
  refresh();
  redirect(`${PACKING_LISTS}/${id}`);
}

// The editor sends the whole list; the answer has the IDs of new categories and items
export async function savePackingList(listId: number, body: PackingListSave): Promise<PackingListDetails> {
  const id = idOf(String(listId));
  const details = await api.put<PackingListDetails>(`/packing-lists/${id}`, body);
  refresh(id);
  return details;
}

export async function deletePackingList(formData: FormData) {
  await api.delete(`/packing-lists/${idOf(formData.get("id"))}`);
  refresh();
  redirect(PACKING_LISTS);
}
