import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ActionButton, RemoveButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Checkbox, TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Page, PageHeader } from "@/components/ui/Page";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { changePassword, createUser, deleteUser, resetPassword, setAdmin, unlockUser } from "@/features/auth/actions";
import { getAuthStatus, getUsers } from "@/features/auth/api";
import type { CurrentUser, User } from "@/lib/api/types";
import { type SearchParams, param } from "@/lib/search-params";

export const dynamic = "force-dynamic";

// As in backend/auth/service.py, for the explanation
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

const OK = ["password", "created", "reset", "unlocked", "saved", "deleted"] as const;
const ERRORS = ["wrongPassword", "locked", "mismatch", "invalid", "taken", "self"] as const;

export default async function Account({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [sp, status, t, ta] = await Promise.all([
    searchParams,
    getAuthStatus(),
    getTranslations("account"),
    getTranslations("auth"),
  ]);
  // Without accounts the login page offers to create the first one
  if (!status.user) redirect("/login");
  const me = status.user;
  const users = me.isAdmin ? await getUsers() : [];

  const ok = OK.find((o) => o === param(sp, "ok"));
  const error = ERRORS.find((e) => e === param(sp, "error"));

  return (
    <Page width="narrow">
      <PageHeader title={t("title")} description={t("intro", { username: me.username })} />

      {ok && <Notice>{t(`ok.${ok}`)}</Notice>}
      {error && (
        <Notice tone="danger">
          {ta(`errors.${error}`, { minutes: param(sp, "minutes") || String(LOCK_MINUTES) })}
        </Notice>
      )}

      <Card title={t("changePassword")}>
        <form action={changePassword} className="space-y-3">
          <TextField
            label={t("currentPassword")}
            type="password"
            name="currentPassword"
            required
            autoComplete="current-password"
          />
          <TextField
            label={t("newPassword")}
            hint={ta("passwordHint")}
            type="password"
            name="newPassword"
            required
            minLength={10}
            autoComplete="new-password"
          />
          <TextField
            label={ta("repeatPassword")}
            hint={t("changePasswordHint")}
            type="password"
            name="repeat"
            required
            minLength={10}
            autoComplete="new-password"
          />
          <SubmitButton className="btn-primary">{t("changePassword")}</SubmitButton>
        </form>
      </Card>

      {me.isAdmin && (
        <>
          <Card title={t("users")}>
            <p className="text-sm text-zinc-500">
              {t("usersIntro", { max: MAX_FAILED_LOGINS, minutes: LOCK_MINUTES })}
            </p>
            <ul className="-mx-4 -mb-4 divide-y divide-zinc-100 border-t border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800">
              {users.map((u) => (
                <UserRow key={u.id} user={u} me={me} />
              ))}
            </ul>
          </Card>

          <Card dashed className="p-3">
            <form action={createUser} className="space-y-3">
              <h2 className="font-semibold">{t("newUser")}</h2>
              <div className="flex flex-wrap gap-2">
                <TextField
                  label={ta("username")}
                  name="username"
                  required
                  minLength={2}
                  autoComplete="off"
                  className="min-w-40 flex-1"
                />
                <TextField
                  label={ta("password")}
                  type="password"
                  name="password"
                  required
                  minLength={10}
                  autoComplete="new-password"
                  className="min-w-40 flex-1"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Checkbox label={t("newUserAdmin")} name="isAdmin" />
                <SubmitButton className="btn-primary">{t("create")}</SubmitButton>
              </div>
            </form>
          </Card>
        </>
      )}
    </Page>
  );
}

async function UserRow({ user: u, me }: { user: User; me: CurrentUser }) {
  const [t, tc] = await Promise.all([getTranslations("account"), getTranslations("common")]);
  const self = u.id === me.id;

  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{u.username}</span>
        {self && <span className="text-sm text-zinc-500">({t("you")})</span>}
        {u.isAdmin && <Badge tone="info">{t("admin")}</Badge>}
        {u.lockedMinutes ? (
          <Badge tone="danger">{t("locked", { minutes: u.lockedMinutes })}</Badge>
        ) : (
          u.failedLogins > 0 && <Badge tone="warning">{t("failedLogins", { count: u.failedLogins })}</Badge>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {(u.lockedMinutes || u.failedLogins > 0) && (
            <ActionButton action={unlockUser} values={{ id: u.id }} className="btn-secondary py-1.5">
              {t("unlock")}
            </ActionButton>
          )}
          {!self && (
            <ActionButton
              action={setAdmin}
              values={{ id: u.id, isAdmin: String(!u.isAdmin) }}
              className="btn-secondary py-1.5"
            >
              {t(u.isAdmin ? "removeAdmin" : "makeAdmin")}
            </ActionButton>
          )}
          {!self && (
            <RemoveButton
              action={deleteUser}
              values={{ id: u.id }}
              label={tc("delete", { name: u.username })}
              confirm={t("deleteConfirm", { username: u.username })}
            />
          )}
        </div>
      </div>
      {!self && (
        <form action={resetPassword} className="space-y-1">
          <input type="hidden" name="id" value={u.id} />
          <div className="flex flex-wrap items-end gap-2">
            <TextField
              label={t("resetPassword")}
              type="password"
              name="password"
              required
              minLength={10}
              autoComplete="new-password"
              className="min-w-40 flex-1"
              inputClassName="py-1.5"
            />
            <SubmitButton className="btn-secondary py-1.5">{tc("save")}</SubmitButton>
          </div>
          <p className="text-xs text-zinc-500">{t("resetPasswordHint", { username: u.username })}</p>
        </form>
      )}
    </li>
  );
}
