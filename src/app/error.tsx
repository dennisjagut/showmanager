"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { EmptyState } from "@/components/ui/Card";
import { Page } from "@/components/ui/Page";

// Shown when a page or a Server Action fails, e.g. because the database cannot be reached
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("errors");
  // Errors from the server carry an ID that can be found in the server logs (Vercel → Logs)
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Page width="narrow">
      <EmptyState>
        <div className="space-y-3">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t("title")}</h1>
          <p>{t("text")}</p>
          {digest && <p className="text-xs">{t("code", { digest })}</p>}
          <div className="flex justify-center gap-2">
            <button type="button" onClick={() => retry()} className="btn-primary">
              {t("retry")}
            </button>
            <Link href="/" className="btn-secondary">
              {t("home")}
            </Link>
          </div>
        </div>
      </EmptyState>
    </Page>
  );
}
