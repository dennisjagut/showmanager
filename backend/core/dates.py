"""Dates are ISO strings (YYYY-MM-DD) everywhere, "today" is always the day in the band's time zone."""

from datetime import date, datetime
from zoneinfo import ZoneInfo

from .config import TIME_ZONE


def today() -> date:
    return datetime.now(ZoneInfo(TIME_ZONE)).date()


def today_iso() -> str:
    return today().isoformat()


def days_until(iso: str, today_: date | None = None) -> int:
    return (date.fromisoformat(iso) - (today_ or today())).days


def current_season(today_: date | None = None) -> int:
    """From September on, the band already applies for next year's festivals."""
    d = today_ or today()
    return d.year + 1 if d.month >= 9 else d.year
