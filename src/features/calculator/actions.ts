"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api/client";
import type { CalculatorInquiry, CalculatorItem } from "@/lib/api/types";
import type { Category } from "./calculation";

// The calculator saves while typing and sends whole objects; the API validates and saves them.

function refresh() {
  revalidatePath("/calculator");
}

export async function saveInquiry(inquiry: CalculatorInquiry) {
  await api.put("/calculator/inquiry", inquiry);
  refresh();
}

export async function saveItem(item: CalculatorItem) {
  await api.put(`/calculator/items/${item.id}`, item);
  refresh();
}

export async function addItem(category: Category): Promise<CalculatorItem> {
  const t = await getTranslations("calculator.newItem");
  const item = await api.post<CalculatorItem>("/calculator/items", { category, name: t(category) });
  refresh();
  return item;
}

export async function deleteItem(id: number) {
  await api.delete(`/calculator/items/${id}`);
  refresh();
}

// Clears location, distance and selection. The items with their rates and the buffer stay.
export async function resetInquiry() {
  await api.post("/calculator/reset");
  refresh();
}
