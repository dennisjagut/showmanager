import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { AppLogo } from "@/features/navigation/components/AppLogo";
import { MobileMenu, Sidebar } from "@/features/navigation/components/MainNavigation";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { logout } from "@/features/auth/actions";
import { getAuthStatus } from "@/features/auth/api";
import { HideOnLogin } from "@/features/auth/components/HideOnLogin";
import { HIDDEN_MODULES_COOKIE, SIDEBAR_COOKIE, parseHiddenModules } from "@/features/navigation/modules";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    title: t("name"),
    description: t("description"),
    // As an app on the iPhone home screen: name below the icon, status bar above the page instead of transparent over it
    appleWebApp: { title: t("name"), statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  // Status bar in the color of the header
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
  // The page extends to the screen edge, the spacing comes from env(safe-area-inset-*), e.g. below the home indicator
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [store, locale, t, { user }] = await Promise.all([cookies(), getLocale(), getTranslations(), getAuthStatus()]);
  const hidden = parseHiddenModules(store.get(HIDDEN_MODULES_COOKIE)?.value);
  const collapsed = store.get(SIDEBAR_COOKIE)?.value === "collapsed";

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col print:block print:bg-white">
        <NextIntlClientProvider>
          <HideOnLogin>
            <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 print:hidden">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-2">
                  <MobileMenu hiddenModules={hidden} />
                  <Link href="/">
                    <AppLogo />
                  </Link>
                </div>
                {user && (
                  <div className="flex items-center gap-2 text-sm">
                    <Link href="/account" className="link" title={t("auth.account")}>
                      👤 {user.username}
                    </Link>
                    <form action={logout}>
                      <SubmitButton className="btn-secondary">{t("auth.logout")}</SubmitButton>
                    </form>
                  </div>
                )}
              </div>
            </header>
          </HideOnLogin>
          <div className="flex flex-1">
            <HideOnLogin>
              <Sidebar hiddenModules={hidden} collapsed={collapsed} />
            </HideOnLogin>
            <main className="mx-auto w-full max-w-7xl min-w-0 px-4 py-6 print:max-w-none print:p-0">{children}</main>
          </div>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
