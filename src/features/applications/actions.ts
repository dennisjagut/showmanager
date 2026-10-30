"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, formBody } from "@/lib/api/client";
import { idOf } from "@/lib/api/path";
import type { Created } from "@/lib/api/types";

// The Server Actions only pass the forms on to the API, which validates and saves.

function refresh(festivalId: string) {
  revalidatePath("/");
  revalidatePath(`/festivals/${festivalId}`);
}

// Quick status change from the overview. Switching to "applied" sets today as the date.
export async function setStatus(festivalId: number, season: number, status: string) {
  const id = idOf(String(festivalId));
  await api.put(`/festivals/${id}/applications/${idOf(String(season))}/status`, { status });
  refresh(id);
}

export async function saveApplication(formData: FormData) {
  const id = idOf(formData.get("festivalId"));
  const season = idOf(formData.get("season"));
  await api.put(`/festivals/${id}/applications/${season}`, formBody(formData, { omit: ["festivalId", "season"] }));
  refresh(id);
}

export async function deleteApplication(formData: FormData) {
  const id = idOf(formData.get("festivalId"));
  await api.delete(`/festivals/${id}/applications/${idOf(formData.get("season"))}`);
  refresh(id);
}

export async function saveFestival(formData: FormData) {
  const body = formBody(formData, { checkboxes: ["active"], omit: ["id"] });
  let id: string;
  if (formData.get("id")) {
    id = idOf(formData.get("id"));
    await api.put(`/festivals/${id}`, body);
  } else {
    id = String((await api.post<Created>("/festivals", body)).id);
  }
  refresh(id);
  redirect(`/festivals/${id}?saved=1`);
}

export async function deleteFestival(formData: FormData) {
  await api.delete(`/festivals/${idOf(formData.get("id"))}`);
  revalidatePath("/");
  redirect("/");
}
