"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, formBody } from "@/lib/api/client";
import { idOf } from "@/lib/api/path";
import type { Created, FestivalDetails, FestivalSave } from "@/lib/api/types";

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

// The contacts come as a JSON list of IDs from FestivalForm; the API skips unknown ones
function contactIds(formData: FormData): number[] {
  try {
    const value: unknown = JSON.parse(String(formData.get("contacts") ?? "[]"));
    return Array.isArray(value) ? value.filter((id): id is number => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

export async function createFestival(formData: FormData) {
  const body = {
    ...formBody(formData, { checkboxes: ["active"], omit: ["contacts"] }),
    contacts: contactIds(formData),
  };
  const { id } = await api.post<Created>("/festivals", body);
  refresh(String(id));
  redirect(`/festivals/${id}?saved=1`);
}

// The editor sends the festival with all its applications; seasons that are missing are deleted
export async function saveFestival(festivalId: number, body: FestivalSave): Promise<FestivalDetails> {
  const id = idOf(String(festivalId));
  const details = await api.put<FestivalDetails>(`/festivals/${id}`, body);
  refresh(id);
  return details;
}

export async function deleteFestival(formData: FormData) {
  await api.delete(`/festivals/${idOf(formData.get("id"))}`);
  revalidatePath("/");
  redirect("/");
}
