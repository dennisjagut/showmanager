"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, formBody } from "@/lib/api/client";
import { idOf } from "@/lib/api/path";
import type { Created } from "@/lib/api/types";

// The Server Actions only pass the forms on to the API, which validates and saves.

function refresh(showId: string) {
  revalidatePath("/shows");
  revalidatePath(`/shows/${showId}`);
  revalidatePath(`/shows/${showId}/daysheet`);
}

export async function saveShow(formData: FormData) {
  const body = formBody(formData, { omit: ["id"] });
  let id: string;
  if (formData.get("id")) {
    id = idOf(formData.get("id"));
    await api.put(`/shows/${id}`, body);
  } else {
    id = String((await api.post<Created>("/shows", body)).id);
  }
  refresh(id);
  redirect(`/shows/${id}`);
}

export async function deleteShow(formData: FormData) {
  await api.delete(`/shows/${idOf(formData.get("id"))}`);
  revalidatePath("/shows");
  redirect("/shows");
}

export async function addScheduleItem(formData: FormData) {
  const showId = idOf(formData.get("showId"));
  await api.post(`/shows/${showId}/schedule`, formBody(formData, { omit: ["showId"] }));
  refresh(showId);
}

export async function deleteScheduleItem(formData: FormData) {
  const showId = idOf(formData.get("showId"));
  await api.delete(`/shows/${showId}/schedule/${idOf(formData.get("id"))}`);
  refresh(showId);
}

export async function addGuest(formData: FormData) {
  const showId = idOf(formData.get("showId"));
  await api.post(`/shows/${showId}/guests`, formBody(formData, { omit: ["showId"] }));
  refresh(showId);
}

export async function deleteGuest(formData: FormData) {
  const showId = idOf(formData.get("showId"));
  await api.delete(`/shows/${showId}/guests/${idOf(formData.get("id"))}`);
  refresh(showId);
}

// Checks an item of the show's packing list off (or not): stage "packed" before the trip, "repacked" after the show
export async function setPackingMark(formData: FormData) {
  const showId = idOf(formData.get("showId"));
  await api.put(`/shows/${showId}/packing/${idOf(formData.get("itemId"))}`, {
    stage: formData.get("stage"),
    done: formData.get("done") === "true",
  });
  refresh(showId);
}

// --- Templates for the running order ---

function refreshTemplates() {
  revalidatePath("/shows/templates");
  revalidatePath("/shows/[id]", "page");
}

export async function addTemplate(formData: FormData) {
  await api.post("/templates", formBody(formData, { checkboxes: ["repeatable"] }));
  refreshTemplates();
}

export async function saveTemplate(formData: FormData) {
  const body = formBody(formData, { checkboxes: ["repeatable"], omit: ["id"] });
  await api.put(`/templates/${idOf(formData.get("id"))}`, body);
  refreshTemplates();
}

export async function deleteTemplate(formData: FormData) {
  await api.delete(`/templates/${idOf(formData.get("id"))}`);
  refreshTemplates();
}

// Swaps the position with the neighbour above or below
export async function moveTemplate(formData: FormData) {
  await api.post(`/templates/${idOf(formData.get("id"))}/move`, formBody(formData, { omit: ["id"] }));
  refreshTemplates();
}
