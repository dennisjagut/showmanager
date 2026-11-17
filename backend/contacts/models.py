"""Entities of the module, as they are stored in the tables contacts, contact_roles and contact_affiliations."""

from typing import Literal

from ..core.base import ApiModel

ContactKind = Literal["person", "organization"]
KINDS: list[ContactKind] = ["person", "organization"]

# What a contact is for the band. A contact can have several roles, e.g. a club that is venue and promoter.
ContactRole = Literal["promoter", "venue", "festival", "booking", "management", "label", "media", "service", "other"]
ROLES: list[ContactRole] = ["promoter", "venue", "festival", "booking", "management", "label", "media", "service", "other"]

# Roles only an organization can have: a person is not a venue, but can be its booker (affiliation with a position)
ORGANIZATION_ROLES: set[ContactRole] = {"venue", "festival", "label"}


def roles_for(kind: ContactKind) -> list[ContactRole]:
    """The roles a contact of this kind can have, in their fixed order"""
    return ROLES if kind == "organization" else [r for r in ROLES if r not in ORGANIZATION_ROLES]


def other_kind(kind: ContactKind) -> ContactKind:
    """People are linked to organizations and the other way round"""
    return "organization" if kind == "person" else "person"


class Contact(ApiModel):
    id: int
    kind: ContactKind
    # Full name of a person or name of an organization
    name: str
    email: str | None
    phone: str | None
    website: str | None
    # Street and number
    street: str | None
    # Postcode and town
    location: str | None
    notes: str | None
    created_at: str
    updated_at: str


class Affiliation(ApiModel):
    """A person working for an organization"""

    person_id: int
    organization_id: int
    # Free text, e.g. "Booking", "Produktionsleitung", "Haustechnik"
    position: str | None
