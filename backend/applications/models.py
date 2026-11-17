"""Entities of the module, as they are stored in the tables festivals and applications."""

from typing import Literal

from ..core.base import ApiModel

ApplicationStatus = Literal["open", "applied", "no_response", "rejected", "accepted", "skipped"]
STATUSES: list[ApplicationStatus] = ["open", "applied", "no_response", "rejected", "accepted", "skipped"]

# Codes of the 16 German federal states
State = Literal["BB", "BE", "BW", "BY", "HB", "HE", "HH", "MV", "NI", "NW", "RP", "SH", "SL", "SN", "ST", "TH"]


class Festival(ApiModel):
    id: int
    name: str
    # Postcode and town
    location: str | None
    state: State | None
    # Month of the festival, 1 = January
    month: int | None
    website: str | None
    # Application deadline as ISO date. It repeats every year, so for each season only day and month count.
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
