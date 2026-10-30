import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { login, setup } from "@/features/auth/actions";
import { getAuthStatus } from "@/features/auth/api";
import { AppLogo } from "@/features/navigation/components/AppLogo";
import { type SearchParams, param } from "@/lib/search-params";

export const dynamic = "force-dynamic";

const ERRORS = ["wrong", "locked", "mismatch", "invalid"] as const;

export default async function Login({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [sp, status, t] = await Promise.all([searchParams, getAuthStatus(), getTranslations("auth")]);
  const next = param(sp, "next") || "/";
  if (status.user) redirect(next);

  const error = ERRORS.find((e) => e === param(sp, "error"));
  const message = error && (
    <Notice tone="danger">{t(`errors.${error}`, { minutes: param(sp, "minutes") || "15" })}</Notice>
  );

  return (
    <div className="mx-auto mt-16 max-w-sm space-y-6">
      <div className="flex justify-center text-lg">
        <AppLogo />
      </div>
      {status.mode === "accounts" ? (
        <Card className="p-6">
          <h1 className="text-xl font-semibold">{t("login")}</h1>
          <form action={login} className="space-y-3">
            <input type="hidden" name="next" value={next} />
            <TextField label={t("username")} name="username" required autoFocus autoComplete="username" />
            <TextField label={t("password")} type="password" name="password" required autoComplete="current-password" />
            {message}
            <SubmitButton className="btn-primary w-full">{t("login")}</SubmitButton>
          </form>
        </Card>
      ) : (
        <Card className="p-6">
          <h1 className="text-xl font-semibold">{t("setupTitle")}</h1>
          <form action={setup} className="space-y-3">
            <p className="text-sm text-zinc-500">{t("setupIntro")}</p>
            <TextField label={t("username")} name="username" required minLength={2} autoComplete="username" />
            <TextField
              label={t("password")}
              hint={t("passwordHint")}
              type="password"
              name="password"
              required
              minLength={10}
              autoComplete="new-password"
            />
            <TextField
              label={t("repeatPassword")}
              type="password"
              name="repeat"
              required
              minLength={10}
              autoComplete="new-password"
            />
            {message}
            <SubmitButton className="btn-primary w-full">{t("setupSubmit")}</SubmitButton>
          </form>
        </Card>
      )}
    </div>
  );
}
