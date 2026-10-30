"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { startTransition, useEffect, useOptimistic, useRef, useState } from "react";
import { collapseSidebar, toggleModule } from "@/features/navigation/actions";
import { MODULES, type Module, type ModuleId } from "@/features/navigation/modules";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { AppLogo } from "./AppLogo";

const ROW = "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition";
const MUTED =
  "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

// Inside the link, so useLinkStatus sees this link's navigation
function LinkContent({ module, narrow }: { module: Module; narrow: boolean }) {
  const t = useTranslations("modules");
  const { pending } = useLinkStatus();
  return (
    <>
      <span aria-hidden className="flex w-6 shrink-0 justify-center text-base">
        {pending && narrow ? <Spinner /> : module.icon}
      </span>
      <span className={narrow ? "sr-only" : "flex-1 truncate"}>{t(module.id)}</span>
      {pending && !narrow && <Spinner className="h-3.5 w-3.5 shrink-0" />}
    </>
  );
}

// Module list with "Customize modules". The selection applies immediately and is saved in a cookie in the background.
function NavContent({
  hiddenModules,
  narrow = false,
  expand,
  close,
}: {
  hiddenModules: ModuleId[];
  narrow?: boolean;
  expand?: () => void;
  close?: () => void;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const [customizing, setCustomizing] = useState(false);
  const [hidden, toggleNow] = useOptimistic(hiddenModules, (list: ModuleId[], id: ModuleId) =>
    list.includes(id) ? list.filter((m) => m !== id) : [...list, id],
  );

  function toggle(id: ModuleId) {
    startTransition(async () => {
      toggleNow(id);
      await toggleModule(id);
    });
  }

  if (customizing && !narrow) {
    return (
      <div className="flex flex-col gap-1">
        <p className="px-2.5 pb-1 text-xs text-zinc-500">{t("nav.customizeHint")}</p>
        {MODULES.map((m) => (
          <label key={m.id} className={`${ROW} ${MUTED} cursor-pointer`}>
            <span aria-hidden className="flex w-6 shrink-0 justify-center text-base">
              {m.icon}
            </span>
            <span className="flex-1">{t(`modules.${m.id}`)}</span>
            <input
              type="checkbox"
              checked={!hidden.includes(m.id)}
              onChange={() => toggle(m.id)}
              className="h-4 w-4 accent-brand-600"
            />
          </label>
        ))}
        <button type="button" onClick={() => setCustomizing(false)} className="mt-2 btn-secondary">
          {t("common.done")}
        </button>
      </div>
    );
  }

  const visible = MODULES.filter((m) => !hidden.includes(m.id));

  return (
    <div className="flex flex-col gap-1">
      <nav aria-label={t("nav.modules")} className="flex flex-col gap-1">
        {visible.map((m) => {
          const active = m.isActive(pathname);
          return (
            <Link
              key={m.id}
              href={m.href}
              title={narrow ? t(`modules.${m.id}`) : undefined}
              aria-current={active ? "page" : undefined}
              // Same path: there is no navigation that would close the mobile menu
              onClick={() => m.href === pathname && close?.()}
              className={`${ROW} ${active ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100" : MUTED}`}
            >
              <LinkContent module={m} narrow={narrow} />
            </Link>
          );
        })}
        {visible.length === 0 && !narrow && <p className="px-2.5 py-2 text-xs text-zinc-500">{t("nav.allHidden")}</p>}
      </nav>
      <div className="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
        <button
          type="button"
          title={narrow ? t("nav.customize") : undefined}
          onClick={() => {
            expand?.();
            setCustomizing(true);
          }}
          className={`${ROW} ${MUTED}`}
        >
          <span className="flex w-6 shrink-0 justify-center">
            <Icon name="sliders" />
          </span>
          <span className={narrow ? "sr-only" : ""}>{t("nav.customize")}</span>
        </button>
      </div>
    </div>
  );
}

// From tablet landscape: fixed sidebar that can be collapsed to the icons
export function Sidebar({ hiddenModules, collapsed }: { hiddenModules: ModuleId[]; collapsed: boolean }) {
  const t = useTranslations("nav");
  const [closed, setClosedNow] = useOptimistic(collapsed);

  function set(value: boolean) {
    startTransition(async () => {
      setClosedNow(value);
      await collapseSidebar(value);
    });
  }

  return (
    <aside
      data-sidebar={closed ? "collapsed" : "expanded"}
      className="hidden w-(--sidebar) shrink-0 border-r border-zinc-200 bg-white lg:block dark:border-zinc-800 dark:bg-zinc-900 print:hidden"
    >
      <div className="sticky top-0 flex flex-col gap-1 p-2">
        <NavContent hiddenModules={hiddenModules} narrow={closed} expand={closed ? () => set(false) : undefined} />
        <button
          type="button"
          title={closed ? t("expand") : undefined}
          onClick={() => set(!closed)}
          className={`${ROW} ${MUTED}`}
        >
          <span className="flex w-6 shrink-0 justify-center">
            <Icon name={closed ? "right" : "left"} />
          </span>
          <span className={closed ? "sr-only" : ""}>{closed ? t("expand") : t("collapse")}</span>
        </button>
      </div>
    </aside>
  );
}

// On phones and tablets in portrait: menu button in the header, the modules slide in as a drawer from the left
export function MobileMenu({ hiddenModules }: { hiddenModules: ModuleId[] }) {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  // Closes after the navigation; until then it stays open and shows the spinner on the tapped module
  const [path, setPath] = useState(pathname);
  if (path !== pathname) {
    setPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const d = dialog.current;
    if (open && !d?.open) d?.showModal();
    if (!open && d?.open) d.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("nav.openMenu")}
        className="-ml-1.5 rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 print:hidden"
      >
        <Icon name="menu" />
      </button>
      {/* Stays visible from lg too, in case it was open while rotating the tablet: a hidden modal would lock the page */}
      <dialog
        ref={dialog}
        aria-label={t("nav.menu")}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] bg-white text-zinc-900 shadow-xl backdrop:bg-black/40 dark:bg-zinc-900 dark:text-zinc-100"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex flex-col gap-3 p-3">
          <div className="flex items-center justify-between px-2.5">
            <AppLogo />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("nav.closeMenu")}
              className="-mr-1.5 rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <Icon name="cross" />
            </button>
          </div>
          <NavContent hiddenModules={hiddenModules} close={() => setOpen(false)} />
        </div>
      </dialog>
    </>
  );
}
