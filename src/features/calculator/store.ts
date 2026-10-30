import type { CalculatorInquiry, CalculatorItem } from "@/lib/api/types";
import type { Category } from "./calculation";

// Where the calculator saves: in the app the Server Actions (actions.ts, the API and the band's database), in the
// standalone file the browser (src/standalone/calculator/local-store.ts).
export type CalculatorStore = {
  saveInquiry: (inquiry: CalculatorInquiry) => Promise<void>;
  saveItem: (item: CalculatorItem) => Promise<void>;
  addItem: (category: Category) => Promise<CalculatorItem>;
  deleteItem: (id: number) => Promise<void>;
  // Clears location, distance and selection. The items with their rates and the buffer stay.
  resetInquiry: () => Promise<void>;
};
