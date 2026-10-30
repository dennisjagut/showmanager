"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

// As an app on the iPhone home screen there are no downloads: iOS shows the PDF as a page of its own instead.
// There, the button opens the share sheet instead ("Save to Files", WhatsApp, AirDrop …).
function isIphoneApp(): boolean {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function filenameFrom(response: Response): string {
  const match = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/);
  return match?.[1] ?? "Daysheet.pdf";
}

export function PdfButton({ href }: { href: string }) {
  const t = useTranslations("show");
  // Load in advance: iOS only allows the share sheet right after the tap, loading afterwards takes too long
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isIphoneApp() || !navigator.canShare) return;
    let cancelled = false;
    fetch(href)
      .then(async (response) => {
        if (!response.ok) return;
        const pdf = new File([await response.blob()], filenameFrom(response), { type: "application/pdf" });
        if (!cancelled && navigator.canShare({ files: [pdf] })) setFile(pdf);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [href]);

  function share(event: React.MouseEvent) {
    if (!file) return; // normal download via the link
    event.preventDefault();
    navigator.share({ files: [file] }).catch((error: Error) => {
      // Cancelling the share sheet is not an error; anything else: open the link after all
      if (error.name !== "AbortError") window.location.href = href;
    });
  }

  return (
    <a href={href} onClick={share} className="btn-primary whitespace-nowrap">
      {t("downloadPdf")}
    </a>
  );
}
