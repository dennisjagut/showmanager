"""What the API receives and returns. The entities themselves are in models.py."""

from pydantic import Field, model_validator

from ..core.base import ApiModel, IsoDate, OptionalCount, OptionalId, OptionalText, RequiredText, Time
from ..contacts.models import Contact
from ..contacts.schemas import ContactDetails
from ..masterdata.models import PackingList, PackingListCategory, PackingListItem
from .models import Guest, PackingStage, ScheduleItem, Show, ShowContactRole, ShowStatus


class PackingItem(ApiModel):
    item: PackingListItem
    # Packed for the trip to this show
    packed: bool
    # Packed again after this show
    repacked: bool


class PackingGroup(ApiModel):
    # None for the items without a category
    category: PackingListCategory | None
    # In the order of the category
    items: list[PackingItem]


class ShowPacking(ApiModel):
    packing_list: PackingList
    # Items without a category first, then the categories in their order; empty categories are left out
    groups: list[PackingGroup]


class ShowContact(ApiModel):
    """A contact from the contact list linked to a show"""

    role: ShowContactRole
    details: ContactDetails


class ShowDetails(ApiModel):
    show: Show
    # In the order of the day
    schedule: list[ScheduleItem]
    # By name
    guests: list[Guest]
    # None if the show has no packing list
    packing: ShowPacking | None
    # First the venue, then the promoters and the people to talk to, each in their order
    contacts: list[ShowContact]


class ShowRow(ApiModel):
    show: Show
    # The organization from the contacts where the show takes place
    venue: Contact | None
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
    fee: OptionalText = None
    guest_quota: OptionalCount = None
    hotel: OptionalText = None
    travel: OptionalText = None
    tech: OptionalText = None
    notes: OptionalText = None
    packing_list_id: OptionalId = None


class ScheduleItemIn(ApiModel):
    time: Time
    item: RequiredText


class GuestIn(ApiModel):
    name: RequiredText
    plus_ones: OptionalCount = None
    added_by: OptionalText = None
    note: OptionalText = None


class ContactShow(ApiModel):
    """A show a contact is linked to, seen from the contact"""

    show: Show
    # Everything the contact is for this show, e.g. venue and promoter at once; in the order venue, promoter, contact
    roles: list[ShowContactRole]


class ShowContactsIn(ApiModel):
    """All contacts of the show as they should be afterwards, by contact ID and in this order"""

    # An organization; None: no venue yet
    venue: int | None = None
    promoters: list[int] = Field(default=[], max_length=50)
    contacts: list[int] = Field(default=[], max_length=50)


class PackingListChoiceIn(ApiModel):
    # None removes the packing list from the show
    packing_list_id: OptionalId = None


class PackingMarkIn(ApiModel):
    stage: PackingStage
    done: bool


class TemplateIn(ApiModel):
    # None for a new template
    id: int | None = None
    name: RequiredText
    repeatable: bool = False


class TemplatesSaveIn(ApiModel):
    """All templates as they should be afterwards, in this order: what is missing is deleted, what has no ID is added"""

    templates: list[TemplateIn] = []

    @model_validator(mode="after")
    def unique_names(self) -> "TemplatesSaveIn":
        names = [t.name for t in self.templates]
        duplicates = sorted({n for n in names if names.count(n) > 1})
        if duplicates:
            raise ValueError(f"Template names must be unique: {', '.join(duplicates)}")
        return self
