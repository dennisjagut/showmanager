"""HTTP endpoints of the module. They only translate between HTTP and the service."""

from fastapi import APIRouter, HTTPException

from ..core.base import Created
from . import service
from .schemas import ContactDetails, ContactFilters, ContactIn, ContactList, ContactRef, ContactSaveIn

router = APIRouter(tags=["contacts"])

NOT_FOUND = "Contact not found"


@router.get("/contacts")
def contact_list(q: str = "", kind: str = "", role: str = "") -> ContactList:
    """All contacts with roles and links. Filters are the URL parameters of the page, unknown values are ignored."""
    return service.contact_list(ContactFilters(q=q, kind=kind, role=role))


# Before /contacts/{contact_id}, which would otherwise take "options" as an ID
@router.get("/contacts/options")
def contact_options(kind: str = "", role: str = "") -> list[ContactRef]:
    """Contacts to choose from in a form, e.g. all organizations, or only the venues"""
    return service.contact_options(kind, role)


@router.get("/contacts/{contact_id}")
def contact_details(contact_id: int) -> ContactDetails:
    details = service.contact_details(contact_id)
    if not details:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return details


@router.post("/contacts")
def create_contact(body: ContactIn) -> Created:
    return Created(id=service.create_contact(body))


@router.put("/contacts/{contact_id}")
def save_contact(contact_id: int, body: ContactSaveIn) -> ContactDetails:
    """Saves fields, roles and links: links that are missing are removed, those without contact ID create a contact"""
    details = service.save_contact(contact_id, body)
    if not details:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return details


@router.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int) -> None:
    """The linked contacts stay, only the links to them are removed"""
    service.delete_contact(contact_id)
