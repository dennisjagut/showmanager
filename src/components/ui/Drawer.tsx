"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

/**
 * Panel for a task on top of the page, e.g. picking contacts. From tablet width it slides in from the right as a
 * drawer next to the page; on the phone it comes up from the bottom as a sheet that the thumb can reach. Header and
 * footer stay in place, only the content in between scrolls.
 *
 * Built on <dialog>: Escape and a tap next to it close it, the focus stays inside while it is open.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  // e.g. the buttons to confirm or cancel
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useTranslations("common");
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = dialog.current;
    if (open && !d?.open) d?.showModal();
    if (!open && d?.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={cn(
        "fixed m-0 flex max-w-none flex-col overflow-hidden bg-white p-0 text-zinc-900 shadow-xl not-open:hidden backdrop:bg-black/40 dark:bg-zinc-900 dark:text-zinc-100",
        // Phone: sheet from the bottom, at most 90 % of the screen high
        "inset-x-0 top-auto bottom-0 max-h-[90dvh] w-full rounded-t-2xl",
        // From tablet width: drawer on the right over the full height
        "md:inset-y-0 md:right-0 md:left-auto md:h-dvh md:max-h-none md:w-[28rem] md:max-w-[90vw] md:rounded-none md:border-l md:border-zinc-200 md:dark:border-zinc-800",
        // Slides in from the edge it belongs to
        "transition-[translate] duration-200 ease-out motion-reduce:transition-none starting:open:translate-y-full md:starting:open:translate-x-full md:starting:open:translate-y-0",
      )}
      style={{ paddingRight: "env(safe-area-inset-right)" }}
    >
      {/* Handle of the sheet on the phone */}
      <div aria-hidden className="flex justify-center pt-2 md:hidden">
        <span className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
      </div>
      <header className="flex items-start gap-3 border-b border-zinc-200 px-4 pt-2 pb-3 md:pt-4 dark:border-zinc-800">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          {description && <div className="mt-0.5 text-sm text-zinc-500">{description}</div>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="-mr-1.5 rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
        >
          <Icon name="cross" className="mx-auto" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">{children}</div>
      {footer && (
        <footer className="border-t border-zinc-200 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800">
          {footer}
        </footer>
      )}
    </dialog>
  );
}
