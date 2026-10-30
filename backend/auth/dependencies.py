"""FastAPI dependencies that protect routes with a login."""

from typing import Annotated

from fastapi import Depends, HTTPException, Request

from . import service
from .models import User


def session_token(request: Request) -> str:
    return request.cookies.get(service.COOKIE, "")


def require_login(token: Annotated[str, Depends(session_token)]) -> User:
    """For all routes except the login and the setup"""
    user = service.current_user(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Not logged in")
    return user


def require_admin(user: Annotated[User, Depends(require_login)]) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Only for admins")
    return user
