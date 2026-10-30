"""What the API receives and returns. The entities themselves are in models.py."""

from typing import Literal

from ..core.base import ApiModel, IsoDate, OptionalCount, OptionalText, RequiredText, Time
from .models import Guest, ScheduleItem, Show, ShowStatus


class ShowDetails(ApiModel):
    show: Show
    # In the order of the day
    schedule: list[ScheduleItem]
    # By name
    guests: list[Guest]


class ShowRow(ApiModel):
    show: Show
    # Time of the first schedule item that looks like the main show
    showtime: str | None
    guest_count: int


class ShowList(ApiModel):
    # The next show that takes place, for the countdown
    next: ShowRow | None
    confirmed: int
    options: int
    tours: list[str]
    shows: list[ShowRow]


class ShowIn(ApiModel):
    date: IsoDate
    title: RequiredText
    status: ShowStatus = "option"
    tour: OptionalText = None
    venue: OptionalText = None
    address: OptionalText = None
    contact_name: OptionalText = None
    contact_phone: OptionalText = None
    contact_email: OptionalText = None
    fee: OptionalText = None
    guest_quota: OptionalCount = None
    hotel: OptionalText = None
    travel: OptionalText = None
    tech: OptionalText = None
    notes: OptionalText = None


class ScheduleItemIn(ApiModel):
    time: Time
    item: RequiredText


class GuestIn(ApiModel):
    name: RequiredText
    plus_ones: OptionalCount = None
    added_by: OptionalText = None
    note: OptionalText = None


class TemplateIn(ApiModel):
    name: RequiredText
    repeatable: bool = False


class MoveIn(ApiModel):
    direction: Literal["up", "down"]
