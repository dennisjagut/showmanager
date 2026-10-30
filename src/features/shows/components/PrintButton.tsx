"use client";

import { useTranslations } from "next-intl";

// Only from tablet width: phones often lack the print dialog, there is the PDF download instead
export function PrintButton() {
  const t = useTranslations("show");
  return (
    <button type="button" onClick={() => window.print()} className="btn-secondary hidden sm:inline-flex">
      {t("print")}
    </button>
  );
}
