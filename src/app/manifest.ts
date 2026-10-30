import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { ICON_BACKGROUND } from "@/components/app-icon";

// Makes the site installable: "Add to Home Screen" (iPhone) or "Install app" (Android)
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({ locale: DEFAULT_LOCALE, namespace: "app" });
  return {
    name: t("name"),
    short_name: t("name"),
    description: t("description"),
    lang: DEFAULT_LOCALE,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: ICON_BACKGROUND,
    theme_color: ICON_BACKGROUND,
    icons: [192, 512].flatMap((size) =>
      (["any", "maskable"] as const).map((purpose) => ({
        src: `/icon/${size}`,
        sizes: `${size}x${size}`,
        type: "image/png",
        purpose,
      })),
    ),
  };
}
