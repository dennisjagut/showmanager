import { useTranslations } from "next-intl";

// 🎸 and the app name, in the header and in the mobile menu
export function AppLogo() {
  const t = useTranslations("app");
  return (
    <span className="flex items-center gap-2 font-semibold tracking-tight">
      <span aria-hidden className="text-xl">
        🎸
      </span>
      {t("name")}
    </span>
  );
}
