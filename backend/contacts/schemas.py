"""What the API receives and returns. The entities themselves are in models.py."""

from pydantic import Field, model_validator

from ..core.base import ApiModel, OptionalText, RequiredText
from .models import Contact, ContactKind, ContactRole


class ContactRef(ApiModel):
    """Short form of a contact, for links and for choosing one in a form"""

    id: int
    kind: ContactKind
    name: str
    roles: list[ContactRole]


class ContactLink(ApiModel):
    """An affiliation seen from one side: the organization of a person, or a person of an organization"""

    contact: ContactRef
    position: str | None


class ContactDetails(ApiModel):
    contact: Contact
    # In the fixed order of the roles
    roles: list[ContactRole]
    # For a person their organizations, for an organization its people; by name
    links: list[ContactLink]


class ContactList(ApiModel):
    # Number of contacts per kind and per role. Each counter applies the other filters but not its own, so it says how
    # many contacts a click on it would show.
    kinds: dict[ContactKind, int]
    roles: dict[ContactRole, int]
    # By name
    rows: list[ContactDetails]


class ContactFilters(ApiModel):
    """Filters of the list, as the page passes them on from its URL; unknown values are ignored"""

    q: str = ""
    kind: str = ""
    role: str = ""


class ContactLinkIn(ApiModel):
    """A link to a contact of the other kind: an existing one by ID, or a new one by name"""

    contact_id: int | None = None
    # Name of a new contact of the other kind, if contact_id is None
    name: OptionalText = None
    position: OptionalText = None

    @model_validator(mode="after")
    def contact_or_name(self) -> "ContactLinkIn":
        if self.contact_id is None and not self.name:
            raise ValueError("A link needs either a contact ID or the name of a new contact")
        return self


class ContactFieldsIn(ApiModel):
    name: RequiredText
    email: OptionalText = None
    phone: OptionalText = None
    website: OptionalText = None
    street: OptionalText = None
    location: OptionalText = None
    notes: OptionalText = None
    # Roles a contact of this kind cannot have are dropped
    roles: list[ContactRole] = []
    # Organizations of a person or people of an organization, as they should be afterwards
    links: list[ContactLinkIn] = Field(default=[], max_length=200)


class ContactIn(ContactFieldsIn):
    """A new contact. The kind cannot be changed afterwards."""

    kind: ContactKind


class ContactSaveIn(ContactFieldsIn):
    """The contact as it should be afterwards: links that are missing are removed, the linked contacts stay"""
