"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";
import type { DraftStatus } from "./use-draft";

const STATUS_COLOR: Partial<Record<DraftStatus, string>> = {
  dirty: "font-medium text-amber-700 dark:text-amber-400",
  saved: "font-medium text-emerald-700 dark:text-emerald-400",
  invalid: "font-medium text-rose-700 dark:text-rose-400",
  error: "font-medium text-rose-700 dark:text-rose-400",
};

/**
 * Bar at the bottom of an editor with the state of the draft, "Verwerfen" and "Speichern" (see useDraft). Hidden while
 * nothing has changed. Belongs inside the editor's <form>: the save button submits it.
 * On the phone it spans the width above the home indicator, from sm it floats as a card at the bottom of the content.
 */
export function SaveBar({
  status,
  changes,
  errorCount = 0,
  onDiscard,
  saveLabel,
  discardLabel,
  alwaysVisible = false,
}: {
  status: DraftStatus;
  // Number of changes; without it the bar only says that something changed
  changes?: number;
  errorCount?: number;
  onDiscard: () => void;
  saveLabel?: string;
  discardLabel?: string;
  // Also visible without changes, e.g. in the edit mode of a page that is otherwise read
  alwaysVisible?: boolean;
}) {
  const t = useTranslations("common");
  if (status === "clean" && !alwaysVisible) return null;

  const busy = status === "saving";
  const message = {
    clean: "",
    dirty: changes === undefined ? t("unsaved") : t("unsavedChanges", { count: changes }),
    saving: t("saving"),
    saved: t("saved"),
    invalid: t("checkFields", { count: errorCount }),
    error: t("saveError"),
  }[status];
  const canSave = status === "dirty" || status === "error" || status === "invalid";

  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-zinc-200 bg-white px-4 pt-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 print:hidden",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "sm:bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:mx-0 sm:rounded-lg sm:border sm:pb-3",
      )}
    >
      <span role="status" className={cn("min-w-0 flex-1 text-sm", STATUS_COLOR[status])}>
        {message}
      </span>
      <div className="flex w-full gap-2 sm:w-auto">
        <button
          type="button"
          onClick={onDiscard}
          disabled={busy || status === "saved"}
          className="btn-secondary flex-1 sm:flex-none pointer-coarse:min-h-11"
        >
          {discardLabel ?? t("discard")}
        </button>
        <button
          type="submit"
          disabled={busy || !canSave}
          aria-busy={busy}
          aria-keyshortcuts="Control+S Meta+S"
          title={t("saveShortcut")}
          className="relative btn-primary flex-1 sm:flex-none pointer-coarse:min-h-11"
        >
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Spinner />
            </span>
          )}
          <span className={busy ? "invisible" : ""}>{saveLabel ?? t("save")}</span>
        </button>
      </div>
    </div>
  );
}
