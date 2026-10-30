"""Entities of the module, as they are stored in the tables users and sessions."""

from ..core.base import ApiModel


class User(ApiModel):
    """An account without its password hash, which never leaves the module"""

    id: int
    username: str
    # Admins manage the accounts of the others
    is_admin: bool
    # Failed logins in a row, reset by a successful one
    failed_logins: int
    # UTC time (YYYY-MM-DD HH:MM:SS) until which logins are refused
    locked_until: str | None
    created_at: str


class Credentials(ApiModel):
    """What the login checks: the account with its password hash"""

    user: User
    password_hash: str
