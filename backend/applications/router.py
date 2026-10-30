"""HTTP endpoints of the module. They only translate between HTTP and the service."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path

from ..core.base import Created
from . import service
from .schemas import (
    ApplicationIn,
    FestivalDetails,
    FestivalIn,
    FestivalList,
    Overview,
    OverviewFilters,
    Seasons,
    StatusIn,
)

router = APIRouter(tags=["applications"])

Season = Annotated[int, Path(ge=2000, le=2100)]


@router.get("/festivals")
def list_festivals(season: str = "") -> FestivalList:
    """All festivals with their application in one season (default: the current one), e.g. for the CSV export"""
    return service.festival_list(season)


@router.get("/applications")
def overview(
    season: str = "",
    q: str = "",
    status: str = "",
    state: str = "",
    month: str = "",
    deadline: str = "",
    sort: str = "",
    inactive: bool = False,
) -> Overview:
    """
    The applications overview. Filters and sort order are the URL parameters of the page, unknown values are ignored
    (they come from the address bar).
    """
    filters = OverviewFilters(
        q=q, status=status, state=state, month=month, deadline=deadline, sort=sort, inactive=inactive
    )
    return service.overview(season, filters)


@router.get("/festivals/{festival_id}")
def festival_details(festival_id: int) -> FestivalDetails:
    details = service.festival_details(festival_id)
    if not details:
        raise HTTPException(status_code=404, detail="Festival not found")
    return details


@router.get("/seasons")
def seasons() -> Seasons:
    return service.seasons()


@router.post("/festivals")
def create_festival(body: FestivalIn) -> Created:
    return Created(id=service.create_festival(body))


@router.put("/festivals/{festival_id}")
def update_festival(festival_id: int, body: FestivalIn) -> None:
    service.update_festival(festival_id, body)


@router.delete("/festivals/{festival_id}")
def delete_festival(festival_id: int) -> None:
    service.delete_festival(festival_id)


@router.put("/festivals/{festival_id}/applications/{season}")
def save_application(festival_id: int, season: Season, body: ApplicationIn) -> None:
    """Creates or updates the application of one season. "applied" without a date gets today."""
    service.save_application(festival_id, season, body)


@router.put("/festivals/{festival_id}/applications/{season}/status")
def set_status(festival_id: int, season: Season, body: StatusIn) -> None:
    """Quick status change from the overview. "applied" sets today as the date, an existing date is kept."""
    service.set_status(festival_id, season, body)


@router.delete("/festivals/{festival_id}/applications/{season}")
def delete_application(festival_id: int, season: Season) -> None:
    service.delete_application(festival_id, season)
