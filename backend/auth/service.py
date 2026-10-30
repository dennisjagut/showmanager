"""Accounts, logins and the lock after failed attempts.

Passwords are stored as scrypt hashes. A login creates a session with a random token: the browser keeps the token in a
cookie, the database only its SHA-256, so a copy of the database does not let anyone log in.
"""

import base64
import hashlib
import hmac
import math
import secrets
from datetime import datetime, timedelta, timezone
from functools import cache

from . import repository
from .models import User
from .schemas import AuthMode, AuthStatus, CurrentUser, OwnPasswordIn, SetupIn, UserIn, UserOut

COOKIE = "showmanager_auth"
SESSION_DAYS = 90

# After this many failed logins in a row the account is locked for LOCK_MINUTES. Each further failure locks it again,
# until a login succeeds or an admin unlocks the account.
MAX_FAILED_LOGINS = 5
LOCK_MINUTES = 15

# scrypt with 32 MiB memory, about 0.1 s per check: cheap for a login, expensive for guessing
SCRYPT_N, SCRYPT_R, SCRYPT_P = 2**15, 8, 1
SCRYPT_MAXMEM = 64 * 1024 * 1024

TIME_FORMAT = "%Y-%m-%d %H:%M:%S"


class LoginFailed(Exception):
    """Wrong username or password. Which of the two is not revealed."""


class AccountLocked(Exception):
    def __init__(self, minutes: int):
        super().__init__(f"Locked for {minutes} more minutes")
        self.minutes = minutes


class WrongPassword(Exception):
    """The current password does not match when changing it"""


class UsernameTaken(Exception):
    pass


class SetupNotPossible(Exception):
    """There already is an account"""


class NotForYourself(Exception):
    """Admins cannot delete themselves or take away their own admin rights, so there always is one admin left"""


# --- Passwords and tokens --------------------------------------------------------------------------------------------


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    key = hashlib.scrypt(
        password.encode(), salt=salt, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P, maxmem=SCRYPT_MAXMEM, dklen=32
    )
    return f"scrypt${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}${_b64(salt)}${_b64(key)}"


def verify_password(password: str, stored: str) -> bool:
    """The parameters come from the stored hash, so older hashes still work after they change"""
    try:
        algorithm, n, r, p, salt, key = stored.split("$")
        if algorithm != "scrypt":
            return False
        actual = hashlib.scrypt(
            password.encode(),
            salt=base64.b64decode(salt),
            n=int(n),
            r=int(r),
            p=int(p),
            maxmem=SCRYPT_MAXMEM,
            dklen=len(base64.b64decode(key)),
        )
    except ValueError:
        return False
    return hmac.compare_digest(actual, base64.b64decode(key))


@cache
def _dummy_hash() -> str:
    # Checked against for unknown usernames, so they take as long as known ones and cannot be told apart by timing
    return hash_password(secrets.token_hex(16))


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _utc(delta: timedelta = timedelta()) -> str:
    return (datetime.now(timezone.utc) + delta).strftime(TIME_FORMAT)


def locked_minutes(user: User) -> int | None:
    """Minutes until the lock ends, None if the account is not locked"""
    if not user.locked_until:
        return None
    until = datetime.strptime(user.locked_until, TIME_FORMAT).replace(tzinfo=timezone.utc)
    seconds = (until - datetime.now(timezone.utc)).total_seconds()
    return math.ceil(seconds / 60) if seconds > 0 else None


def _create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    repository.insert_session(_token_hash(token), user_id, _utc(timedelta(days=SESSION_DAYS)))
    return token


# --- Login -----------------------------------------------------------------------------------------------------------


def mode() -> AuthMode:
    return "accounts" if repository.count_users() > 0 else "setup"


def current_user(token: str) -> User | None:
    return repository.find_session_user(_token_hash(token)) if token else None


def status(token: str) -> AuthStatus:
    user = current_user(token)
    return AuthStatus(
        mode="accounts" if user else mode(),
        user=CurrentUser(id=user.id, username=user.username, is_admin=user.is_admin) if user else None,
    )


def _check_password(user: User, password: str, stored: str, error: Exception) -> None:
    """Refuses locked accounts without looking at the password; counts failures and locks after too many"""
    minutes = locked_minutes(user)
    if minutes:
        raise AccountLocked(minutes)
    if not verify_password(password, stored):
        updated = repository.record_failed_login(user.id, MAX_FAILED_LOGINS, _utc(timedelta(minutes=LOCK_MINUTES)))
        minutes = locked_minutes(updated) if updated else None
        if minutes:
            raise AccountLocked(minutes)
        raise error
    if user.failed_logins:
        repository.reset_failed_logins(user.id)


def login(username: str, password: str) -> str:
    """The token for the cookie"""
    credentials = repository.find_credentials(username.strip())
    if credentials is None:
        verify_password(password, _dummy_hash())
        raise LoginFailed()
    _check_password(credentials.user, password, credentials.password_hash, LoginFailed())
    return _create_session(credentials.user.id)


def logout(token: str) -> None:
    if token:
        repository.delete_session(_token_hash(token))


def setup(body: SetupIn) -> str:
    """Creates the first account as admin and logs it in. Whoever sets up the app does this right after deploying."""
    user_id = repository.insert_user(body.username, hash_password(body.password), is_admin=True, only_if_none=True)
    if user_id is None:
        raise SetupNotPossible()
    return _create_session(user_id)


def change_own_password(user: User, token: str, body: OwnPasswordIn) -> None:
    """Failures count like failed logins. Other sessions of the user end, the current one stays."""
    stored = repository.find_password_hash(user.id) or ""
    _check_password(user, body.current_password, stored, WrongPassword())
    repository.update_password(user.id, hash_password(body.new_password))
    repository.delete_sessions(user.id, except_token_hash=_token_hash(token))


# --- Account management for admins -----------------------------------------------------------------------------------


def users() -> list[UserOut]:
    return [
        UserOut(
            id=u.id,
            username=u.username,
            is_admin=u.is_admin,
            failed_logins=u.failed_logins,
            locked_minutes=locked_minutes(u),
            created_at=u.created_at,
        )
        for u in repository.find_users()
    ]


def create_user(body: UserIn) -> int:
    user_id = repository.insert_user(body.username, hash_password(body.password), body.is_admin)
    if user_id is None:
        raise UsernameTaken()
    return user_id


def set_password(user_id: int, password: str) -> None:
    """Sets a new password, lifts a lock and ends all sessions of the user"""
    repository.update_password(user_id, hash_password(password))
    repository.delete_sessions(user_id)


def unlock(user_id: int) -> None:
    repository.reset_failed_logins(user_id)


def set_admin(acting: User, user_id: int, is_admin: bool) -> None:
    if user_id == acting.id:
        raise NotForYourself()
    repository.update_admin(user_id, is_admin)


def delete_user(acting: User, user_id: int) -> None:
    if user_id == acting.id:
        raise NotForYourself()
    repository.delete_user(user_id)
