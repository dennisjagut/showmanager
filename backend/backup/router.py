"""HTTP endpoints of the module. They only translate between HTTP and the service."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from ..core.dates import today_iso
from . import service

router = APIRouter(tags=["backup"])


@router.get("/backup", response_class=JSONResponse)
def backup() -> JSONResponse:
    return JSONResponse(
        service.backup(),
        headers={"Content-Disposition": f'attachment; filename="showmanager-backup-{today_iso()}.json"'},
    )
