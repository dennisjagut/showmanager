"""What the API receives and returns. The entities themselves are in models.py."""

from typing import Annotated, Literal

from pydantic import Field, model_validator

from ..core.base import ApiModel, OptionalIsoDate, OptionalText, RequiredText
from .models import Application, ApplicationStatus, Festival

DeadlineState = Literal["passed", "soon", "later"]


class Deadline(ApiModel):
    """Approximate deadline for one season, derived from the free text"""

    date: str
    # True for "Januar?" and the like
    uncertain: bool
    state: DeadlineState


class Seasons(ApiModel):
    # Season the band applies for now
    current: int
    # All seasons with applications plus the current and the next one, newest first
    all: list[int]


class FestivalRow(ApiModel):
    festival: Festival
    application: Application | None


class FestivalList(ApiModel):
    season: int
    rows: list[FestivalRow]


class OverviewRow(FestivalRow):
    status: ApplicationStatus
    deadline: Deadline | None


class Overview(ApiModel):
    season: int
    seasons: Seasons
    states: list[str]
    soon_days: int
    # Counters only leave out inactive festivals and ignore search and filters, so the state of the season stays visible
    festivals: int
    counts: dict[ApplicationStatus, int]
    sent: int
    soon_open: int
    rows: list[OverviewRow]


class OverviewFilters(ApiModel):
    """Filters and sort order of the overview, as the page passes them on from its URL"""

    q: str = ""
    status: str = ""
    state: str = ""
    month: str = ""
    deadline: str = ""
    sort: str = ""
    inactive: bool = False


class ApplicationWithDeadline(Application):
    deadline: Deadline | None


class FestivalDetails(ApiModel):
    festival: Festival
    # Newest season first
    applications: list[ApplicationWithDeadline]
    seasons: Seasons


class FestivalIn(ApiModel):
    name: RequiredText
    location: OptionalText = None
    state: OptionalText = None
    month: OptionalText = None
    website: OptionalText = None
    deadline: OptionalText = None
    contact: OptionalText = None
    notes: OptionalText = None
    active: bool = True


class ApplicationIn(ApiModel):
    season: Annotated[int, Field(ge=2000, le=2100)]
    status: ApplicationStatus
    applied_on: OptionalIsoDate = None
    note: OptionalText = None


class FestivalSaveIn(FestivalIn):
    """The festival with all its applications as they should be afterwards: seasons that are missing are deleted"""

    applications: list[ApplicationIn]

    @model_validator(mode="after")
    def unique_seasons(self) -> "FestivalSaveIn":
        seasons = [a.season for a in self.applications]
        if len(seasons) != len(set(seasons)):
            raise ValueError("Each season may only have one application")
        return self


class StatusIn(ApiModel):
    status: ApplicationStatus
