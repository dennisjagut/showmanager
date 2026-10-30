"""Approximate application deadline from the free text. Pure logic, no database."""

import calendar
from datetime import date

from ..core.dates import days_until
from .schemas import Deadline, DeadlineState

# Days ahead in which an open deadline counts as "soon"
DEADLINE_SOON_DAYS = 45

# Deadline and festival month are German free text ("vor Oktober", "Juli"), so they are parsed as German.
GERMAN_MONTHS = [
    "januar",
    "februar",
    "märz",
    "april",
    "mai",
    "juni",
    "juli",
    "august",
    "september",
    "oktober",
    "november",
    "dezember",
]


def month_index(text: str | None) -> int | None:
    """0 for January … 11 for December, None if no month is mentioned"""
    if not text:
        return None
    lower = text.lower()
    return next((i for i, m in enumerate(GERMAN_MONTHS) if m in lower), None)


def deadline_for_season(deadline: str | None, festival_month: str | None, season: int) -> Deadline | None:
    """
    Approximate deadline from the free text (e.g. "vor Oktober", "bis Dezember", "Januar?"). If the deadline month is
    after the festival month, the previous year is meant ("vor Oktober" for a festival in August 2027 → 01.10.2026).
    """
    if not deadline:
        return None
    text = deadline.strip().lower()
    # "ab Juni" ("from June") names the start of the application period, not its end
    if text.startswith("ab "):
        return None
    month = month_index(text)
    if month is None:
        return None
    festival_month_index = month_index(festival_month)
    year = season if month <= (7 if festival_month_index is None else festival_month_index) else season - 1
    # "vor X" ("before X") ends at the start of the month, anything else at the end of the month
    day = 1 if text.startswith("vor ") else calendar.monthrange(year, month + 1)[1]
    iso = date(year, month + 1, day).isoformat()
    return Deadline(date=iso, uncertain="?" in text, state=deadline_state(iso))


def deadline_state(iso: str) -> DeadlineState:
    # The deadline day itself already counts as passed: "vor Oktober" ends before 1 October
    days = days_until(iso)
    if days <= 0:
        return "passed"
    return "soon" if days <= DEADLINE_SOON_DAYS else "later"
