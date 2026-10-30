import { getTranslations } from "next-intl/server";
import { Page, PageHeader } from "@/components/ui/Page";
import { Calculator } from "@/features/calculator/components/Calculator";
import { addItem, deleteItem, resetInquiry, saveInquiry, saveItem } from "@/features/calculator/actions";
import { getCalculator } from "@/features/calculator/api";

export const dynamic = "force-dynamic";

export default async function CalculatorPage() {
  const [{ inquiry, items }, t] = await Promise.all([getCalculator(), getTranslations("calculator")]);

  return (
    <Page width="narrow">
      <PageHeader title={t("title")} description={t("intro")} />
      <Calculator
        inquiry={inquiry}
        items={items}
        store={{ saveInquiry, saveItem, addItem, deleteItem, resetInquiry }}
      />
    </Page>
  );
}
