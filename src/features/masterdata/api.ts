import { api } from "@/lib/api/client";
import { idOf } from "@/lib/api/path";
import type { PackingListDetails, PackingListSummary } from "@/lib/api/types";

// Reading from the API

// All packing lists by name, with the number of items
export function getPackingLists() {
  return api.get<PackingListSummary[]>("/packing-lists");
}

export function getPackingList(id: string) {
  return api.get<PackingListDetails>(`/packing-lists/${idOf(id)}`);
}
