"""What the API receives and returns. The entities themselves are in models.py."""

from typing import Annotated, Literal

from pydantic import BeforeValidator, Field

from ..core.base import ApiModel

# Letters, digits, dot, dash and underscore; surrounding spaces are removed
Username = Annotated[
    str,
    BeforeValidator(lambda v: v.strip() if isinstance(v, str) else v),
    Field(min_length=2, max_length=40, pattern=r"^[\w.-]+$"),
]
# Long passwords are the best protection, so only the length is checked
NewPassword = Annotated[str, Field(min_length=10, max_length=200)]

# setup: the first account (admin) still has to be created; accounts: everything needs a login
AuthMode = Literal["setup", "accounts"]


class CurrentUser(ApiModel):
    id: int
    username: str
    is_admin: bool


class AuthStatus(ApiModel):
    mode: AuthMode
    # Null when not logged in
    user: CurrentUser | None


class LoginIn(ApiModel):
    username: str
    password: str


class LoginOut(ApiModel):
    # Value for the cookie
    token: str


class SetupIn(ApiModel):
    username: Username
    password: NewPassword


class OwnPasswordIn(ApiModel):
    current_password: str
    new_password: NewPassword


class UserIn(ApiModel):
    username: Username
    password: NewPassword
    is_admin: bool = False


class PasswordIn(ApiModel):
    password: NewPassword


class AdminIn(ApiModel):
    is_admin: bool


class UserOut(ApiModel):
    """An account as admins see it in the list"""

    id: int
    username: str
    is_admin: bool
    failed_logins: int
    # Minutes until a lock ends, null when the account is not locked
    locked_minutes: int | None
    created_at: str
