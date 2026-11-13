"""Business logic of the module. The router calls only this, this calls the repository."""

from ..core.dates import current_season, today_iso
from . import repository
from .deadline import DEADLINE_SOON_DAYS, deadline_for_season, month_index
from .models import STATUSES, Application, Festival
from .schemas import (
    ApplicationWithDeadline,
    FestivalDetails,
    FestivalIn,
    FestivalList,
    FestivalRow,
    FestivalSaveIn,
    Overview,
    OverviewFilters,
    OverviewRow,
    Seasons,
    StatusIn,
)


def parse_season(value: str | int | None) -> int | None:
    """Season from a URL parameter, None if it is missing or invalid"""
    try:
        season = int(value or 0)
    except ValueError:
        return None
    return season if 2000 <= season <= 2100 else None


def seasons() -> Seasons:
    current = current_season()
    return Seasons(current=current, all=sorted(repository.find_seasons() | {current, current + 1}, reverse=True))


def festival_list(season: str) -> FestivalList:
    """All festivals with their application in one season (default: the current one)"""
    number = parse_season(season) or current_season()
    rows = [FestivalRow(festival=f, application=a) for f, a in repository.find_all_with_application(number)]
    return FestivalList(season=number, rows=rows)


def overview(season: str, filters: OverviewFilters) -> Overview:
    """The applications overview. Unknown filter values are ignored, they can only come from an edited address."""
    number = parse_season(season) or current_season()
    visible = [
        OverviewRow(
            festival=f,
            application=a,
            status=a.status if a else "open",
            deadline=deadline_for_season(f.deadline, f.month, number),
        )
        for f, a in repository.find_all_with_application(number)
        if f.active or filters.inactive
    ]

    counts = {s: 0 for s in STATUSES}
    for r in visible:
        counts[r.status] += 1

    return Overview(
        season=number,
        seasons=seasons(),
        states=repository.find_states(),
        soon_days=DEADLINE_SOON_DAYS,
        festivals=len(visible),
        counts=counts,
        sent=counts["applied"] + counts["no_response"] + counts["rejected"] + counts["accepted"],
        soon_open=sum(1 for r in visible if r.status == "open" and r.deadline and r.deadline.state == "soon"),
        rows=_sorted([r for r in visible if _matches(r, filters)], filters.sort),
    )


def _matches(row: OverviewRow, filters: OverviewFilters) -> bool:
    f, a = row.festival, row.application
    if filters.status in STATUSES and row.status != filters.status:
        return False
    if filters.state and f.state != filters.state:
        return False
    if filters.month and f.month != filters.month:
        return False
    if filters.deadline == "known" and not row.deadline:
        return False
    if filters.deadline in ("soon", "passed") and (not row.deadline or row.deadline.state != filters.deadline):
        return False
    search = filters.q.strip().lower()
    if search:
        text = " ".join(x or "" for x in [f.name, f.location, f.contact, f.notes, a.note if a else None])
        if search not in text.lower():
            return False
    return True


def _sorted(rows: list[OverviewRow], sort: str) -> list[OverviewRow]:
    # Without a sort order the rows stay sorted by name, as the repository returns them
    if sort == "deadline":
        rows.sort(key=lambda r: r.deadline.date if r.deadline else "9999")
    elif sort == "month":
        rows.sort(key=lambda r: 99 if (m := month_index(r.festival.month)) is None else m)
    elif sort == "status":
        rows.sort(key=lambda r: STATUSES.index(r.status))
    elif sort == "applied":
        rows.sort(key=lambda r: (r.application and r.application.applied_on) or "", reverse=True)
    return rows


def festival_details(festival_id: int) -> FestivalDetails | None:
    festival = repository.find_by_id(festival_id)
    if not festival:
        return None
    return FestivalDetails(
        festival=festival,
        applications=[_with_deadline(a, festival) for a in repository.find_applications(festival_id)],
        seasons=seasons(),
    )


def _with_deadline(application: Application, festival: Festival) -> ApplicationWithDeadline:
    deadline = deadline_for_season(festival.deadline, festival.month, application.season)
    return ApplicationWithDeadline(**application.model_dump(), deadline=deadline)


def _festival_values(body: FestivalIn) -> dict[str, object]:
    values = body.model_dump()
    values["state"] = values["state"].upper() if values["state"] else None
    return values


def create_festival(body: FestivalIn) -> int:
    return repository.insert(_festival_values(body))


def save_festival(festival_id: int, body: FestivalSaveIn) -> FestivalDetails | None:
    """
    Saves the festival with all its applications and returns it as saved; seasons that are missing are deleted.
    "applied" without a date gets today. None if the festival does not exist.
    """
    if not repository.find_by_id(festival_id):
        return None
    applications = [
        a.model_copy(update={"applied_on": today_iso()}) if a.status == "applied" and not a.applied_on else a
        for a in body.applications
    ]
    repository.save_with_applications(festival_id, _festival_values(body), applications)
    return festival_details(festival_id)


def delete_festival(festival_id: int) -> None:
    repository.delete(festival_id)


def set_status(festival_id: int, season: int, body: StatusIn) -> None:
    """Quick status change from the overview. "applied" sets today as the date, an existing date is kept."""
    repository.save_status(festival_id, season, body.status, today_iso() if body.status == "applied" else None)
