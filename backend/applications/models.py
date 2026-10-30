"""Entities of the module, as they are stored in the tables festivals and applications."""

from typing import Literal

from ..core.base import ApiModel

ApplicationStatus = Literal["open", "applied", "no_response", "rejected", "accepted", "skipped"]
STATUSES: list[ApplicationStatus] = ["open", "applied", "no_response", "rejected", "accepted", "skipped"]


class Festival(ApiModel):
    id: int
    name: str
    # Postcode and town
    location: str | None
    # German federal state code, e.g. "BY"
    state: str | None
    # Free text, e.g. "Juli"
    month: str | None
    website: str | None
    # Free text, e.g. "vor Oktober"
    deadline: str | None
    contact: str | None
    notes: str | None
    # False for festivals that no longer exist
    active: bool
    created_at: str
    updated_at: str


# Application of a festival for one season
class Application(ApiModel):
    id: int
    festival_id: int
    season: int
    status: ApplicationStatus
    applied_on: str | None
    note: str | None
    updated_at: str
