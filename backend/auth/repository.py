"""SQL for the tables users and sessions."""

from ..core import db
from .models import Credentials, User

USER_FIELDS = ("id", "username", "is_admin", "failed_logins", "locked_until", "created_at")


def _fields(table: str = "") -> str:
    return ", ".join(f"{table}{field}" for field in USER_FIELDS)


# --- Users -----------------------------------------------------------------------------------------------------------


def count_users() -> int:
    row = db.one("select count(*) as n from users")
    return row["n"] if row else 0


def find_users() -> list[User]:
    rows = db.query(f"select {_fields()} from users order by username")
    return [User.model_validate(r) for r in rows]


def find_user(user_id: int) -> User | None:
    row = db.one(f"select {_fields()} from users where id = ?", (user_id,))
    return User.model_validate(row) if row else None


def find_credentials(username: str) -> Credentials | None:
    """The username is compared without regard to case (the column is COLLATE NOCASE)"""
    row = db.one(f"select {_fields()}, password_hash from users where username = ?", (username,))
    if not row:
        return None
    return Credentials(user=User.model_validate(row), password_hash=row["password_hash"])


def find_password_hash(user_id: int) -> str | None:
    row = db.one("select password_hash from users where id = ?", (user_id,))
    return row["password_hash"] if row else None


def insert_user(username: str, password_hash: str, is_admin: bool, only_if_none: bool = False) -> int | None:
    """Returns the new ID, or None if the name is taken (or, with `only_if_none`, if there already is an account)"""
    with db.write() as w:
        if w.query("select 1 from users where username = ?", (username,)):
            return None
        if only_if_none and w.query("select 1 from users"):
            return None
        return w.execute(
            "insert into users (username, password_hash, is_admin) values (?, ?, ?)",
            (username, password_hash, is_admin),
        )


def update_password(user_id: int, password_hash: str) -> None:
    """Also lifts a lock: whoever sets a new password knows it"""
    with db.write() as w:
        w.execute(
            "update users set password_hash = ?, failed_logins = 0, locked_until = null where id = ?",
            (password_hash, user_id),
        )


def update_admin(user_id: int, is_admin: bool) -> None:
    with db.write() as w:
        w.execute("update users set is_admin = ? where id = ?", (is_admin, user_id))


def delete_user(user_id: int) -> None:
    with db.write() as w:
        # Foreign keys are not enforced by SQLite unless switched on, so the sessions go explicitly
        w.execute("delete from sessions where user_id = ?", (user_id,))
        w.execute("delete from users where id = ?", (user_id,))


# --- Failed logins ---------------------------------------------------------------------------------------------------


def record_failed_login(user_id: int, max_failed: int, lock_until: str) -> User | None:
    """Counts up in one statement, so parallel attempts cannot skip the lock. Locks from `max_failed` failures on."""
    with db.write() as w:
        w.execute(
            """update users set failed_logins = failed_logins + 1,
                 locked_until = case when failed_logins + 1 >= ? then ? else locked_until end
               where id = ?""",
            (max_failed, lock_until, user_id),
        )
    return find_user(user_id)


def reset_failed_logins(user_id: int) -> None:
    with db.write() as w:
        w.execute("update users set failed_logins = 0, locked_until = null where id = ?", (user_id,))


# --- Sessions --------------------------------------------------------------------------------------------------------


def insert_session(token_hash: str, user_id: int, expires_at: str) -> None:
    with db.write() as w:
        # Expired sessions are cleaned up on the way
        w.execute("delete from sessions where expires_at <= datetime('now')")
        w.execute(
            "insert into sessions (token_hash, user_id, expires_at) values (?, ?, ?)", (token_hash, user_id, expires_at)
        )


def find_session_user(token_hash: str) -> User | None:
    row = db.one(
        f"""select {_fields("u.")}
            from sessions s join users u on u.id = s.user_id
            where s.token_hash = ? and s.expires_at > datetime('now')""",
        (token_hash,),
    )
    return User.model_validate(row) if row else None


def delete_session(token_hash: str) -> None:
    with db.write() as w:
        w.execute("delete from sessions where token_hash = ?", (token_hash,))


def delete_sessions(user_id: int, except_token_hash: str = "") -> None:
    """Logs the user out everywhere, except in the session with the given token"""
    with db.write() as w:
        w.execute("delete from sessions where user_id = ? and token_hash != ?", (user_id, except_token_hash))
