"""HTTP endpoints of the module. They only translate between HTTP and the service."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from ..core.base import Created
from . import service
from .dependencies import require_admin, require_login, session_token
from .models import User
from .schemas import AdminIn, AuthStatus, LoginIn, LoginOut, OwnPasswordIn, PasswordIn, SetupIn, UserIn, UserOut

Token = Annotated[str, Depends(session_token)]

# Without login
router = APIRouter(prefix="/auth", tags=["auth"])

# Only for admins, see main.py
users_router = APIRouter(prefix="/users", tags=["auth"])


def _locked(error: service.AccountLocked) -> HTTPException:
    # 423 Locked; the frontend tells how long the lock lasts
    return HTTPException(status_code=423, detail={"minutes": error.minutes})


@router.get("/status")
def status(token: Token) -> AuthStatus:
    """Whether accounts exist and who is logged in"""
    return service.status(token)


@router.post("/login")
def login(body: LoginIn) -> LoginOut:
    try:
        return LoginOut(token=service.login(body.username, body.password))
    except service.AccountLocked as e:
        raise _locked(e)
    except service.LoginFailed:
        # 403, not 401: for the frontend, 401 means "send to the login page", here the login page shows an error
        raise HTTPException(status_code=403, detail="Wrong username or password")


@router.post("/setup")
def setup(body: SetupIn) -> LoginOut:
    """Creates the first account (as admin) and logs it in. Only possible as long as there is no account."""
    try:
        return LoginOut(token=service.setup(body))
    except service.SetupNotPossible:
        raise HTTPException(status_code=409, detail="Setup not possible")


@router.post("/logout")
def logout(token: Token) -> None:
    service.logout(token)


@router.put("/password")
def change_own_password(body: OwnPasswordIn, user: Annotated[User, Depends(require_login)], token: Token) -> None:
    try:
        service.change_own_password(user, token, body)
    except service.AccountLocked as e:
        raise _locked(e)
    except service.WrongPassword:
        raise HTTPException(status_code=403, detail="Wrong password")


@users_router.get("")
def users() -> list[UserOut]:
    return service.users()


@users_router.post("")
def create_user(body: UserIn) -> Created:
    try:
        return Created(id=service.create_user(body))
    except service.UsernameTaken:
        raise HTTPException(status_code=409, detail="Username taken")


@users_router.put("/{user_id}/password")
def set_password(user_id: int, body: PasswordIn) -> None:
    """New password for someone who forgot theirs. Also lifts a lock and logs the user out everywhere."""
    service.set_password(user_id, body.password)


@users_router.post("/{user_id}/unlock")
def unlock(user_id: int) -> None:
    service.unlock(user_id)


@users_router.put("/{user_id}/admin")
def set_admin(user_id: int, body: AdminIn, admin: Annotated[User, Depends(require_admin)]) -> None:
    try:
        service.set_admin(admin, user_id, body.is_admin)
    except service.NotForYourself:
        raise HTTPException(status_code=400, detail="Not for your own account")


@users_router.delete("/{user_id}")
def delete_user(user_id: int, admin: Annotated[User, Depends(require_admin)]) -> None:
    try:
        service.delete_user(admin, user_id)
    except service.NotForYourself:
        raise HTTPException(status_code=400, detail="Not for your own account")
