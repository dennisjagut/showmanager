import { api } from "@/lib/api/client";
import type { CalculatorData } from "@/lib/api/types";

export function getCalculator() {
  return api.get<CalculatorData>("/calculator");
}
