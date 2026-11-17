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
    The deadline repeats every year: only day and month of the stored date count. If its month is after the festival
    month, the year before the season is meant (30 September for a festival in August 2027 → 30.09.2026).
    """
    if not deadline:
        return None
    stored = date.fromisoformat(deadline)
    year = season if stored.month <= (festival_month or DEFAULT_FESTIVAL_MONTH) else season - 1
    # 29 February only exists in leap years
    day = min(stored.day, calendar.monthrange(year, stored.month)[1])
    iso = date(year, stored.month, day).isoformat()
    return Deadline(date=iso, state=deadline_state(iso))


def deadline_state(iso: str) -> DeadlineState:
    days = days_until(iso)
    if days < 0:
        return "passed"
    return "soon" if days <= DEADLINE_SOON_DAYS else "later"
