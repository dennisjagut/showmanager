"""Application deadline of a festival in one season. Pure logic, no database."""

import calendar
from datetime import date

from ..core.dates import days_until
from .schemas import Deadline, DeadlineState

# Days ahead in which an open deadline counts as "soon"
DEADLINE_SOON_DAYS = 45

# Without a festival month, deadlines up to August belong to the festival year, later ones to the year before
DEFAULT_FESTIVAL_MONTH = 8


def deadline_for_season(deadline: str | None, festival_month: int | None, season: int) -> Deadline | None:
    """
    The deadline is day and month (MM-DD) and repeats every year. If its month is after the festival month, the year
    before the season is meant (09-30 for a festival in August 2027 → 30.09.2026).
    """
    if not deadline:
        return None
    month, day = (int(part) for part in deadline.split("-"))
    year = season if month <= (festival_month or DEFAULT_FESTIVAL_MONTH) else season - 1
    # 29 February only exists in leap years
    iso = date(year, month, min(day, calendar.monthrange(year, month)[1])).isoformat()
    return Deadline(date=iso, state=deadline_state(iso))


def deadline_state(iso: str) -> DeadlineState:
    days = days_until(iso)
    if days < 0:
        return "passed"
    return "soon" if days <= DEADLINE_SOON_DAYS else "later"
