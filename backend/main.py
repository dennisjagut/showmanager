"""The FastAPI app. All routes live under /api/v1, the frontend reaches them through a rewrite in next.config.ts.

Each module (applications, shows, masterdata, calculator, backup, auth) is a package with the same layers:
router.py (HTTP) → service.py (business logic) → repository.py (SQL), plus models.py (entities) and schemas.py
(what the API receives and returns). Shared parts are in core/.
"""

from fastapi import APIRouter, Depends, FastAPI

from .applications.router import router as applications
from .auth.dependencies import require_admin, require_login
from .auth.router import router as auth
from .auth.router import users_router as users
from .backup.router import router as backup
from .calculator.router import router as calculator
from .masterdata.router import router as masterdata
from .shows.router import router as shows

PREFIX = "/api/v1"

app = FastAPI(
    title="Showmanager API",
    docs_url=f"{PREFIX}/docs",
    openapi_url=f"{PREFIX}/openapi.json",
    redoc_url=None,
)

# Everything except the login and the setup of the first account needs a login
protected = APIRouter(dependencies=[Depends(require_login)])
for router in (applications, shows, masterdata, calculator, backup):
    protected.include_router(router)
protected.include_router(users, dependencies=[Depends(require_admin)])

app.include_router(auth, prefix=PREFIX)
app.include_router(protected, prefix=PREFIX)
