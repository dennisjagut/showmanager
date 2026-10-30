"""Entities of the module, as they are stored in the tables shows, show_schedule, show_guests and schedule_templates."""

from typing import Literal

from ..core.base import ApiModel

ShowStatus = Literal["option", "confirmed", "cancelled"]


class Show(ApiModel):
    id: int
    # ISO date (YYYY-MM-DD)
    date: str
    title: str
    # Free text to group shows into tours or series
    tour: str | None
    status: ShowStatus
    venue: str | None
    address: str | None
    contact_name: str | None
    contact_phone: str | None
    contact_email: str | None
    # Fee or deal as free text
    fee: str | None
    # Number of guest list spots the band is entitled to
    guest_quota: int | None
    hotel: str | None
    travel: str | None
    # Technical details & backline
    tech: str | None
    notes: str | None
    created_at: str
    updated_at: str


class ScheduleItem(ApiModel):
    id: int
    show_id: int
    # HH:MM
    time: str
    item: str


class Guest(ApiModel):
    id: int
    show_id: int
    name: str
    # Additional people (+1, +2 …)
    plus_ones: int
    added_by: str | None
    note: str | None


class ScheduleTemplate(ApiModel):
    id: int
    name: str
    sort_order: int
    # May occur several times per show and is then numbered (Support 1, Support 2 …)
    repeatable: bool
