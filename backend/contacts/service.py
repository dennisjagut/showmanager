"""Business logic of the module. The router calls only this, this calls the repository."""

from . import repository
from .models import KINDS, ROLES, Affiliation, Contact, ContactKind, ContactRole, other_kind, roles_for
from .schemas import (
    ContactDetails,
    ContactFieldsIn,
    ContactFilters,
    ContactIn,
    ContactLink,
    ContactList,
    ContactRef,
    ContactSaveIn,
)


def _sorted_roles(roles: set[ContactRole] | None) -> list[ContactRole]:
    return [r for r in ROLES if r in (roles or set())]


def _links(
    contact: Contact,
    affiliations: list[Affiliation],
    by_id: dict[int, Contact],
    roles: dict[int, set[ContactRole]],
) -> list[ContactLink]:
    """The other side of the contact's affiliations, by name"""
    links = []
    for a in affiliations:
        if contact.kind == "person" and a.person_id == contact.id:
            other = by_id.get(a.organization_id)
        elif contact.kind == "organization" and a.organization_id == contact.id:
            other = by_id.get(a.person_id)
        else:
            continue
        if other:
            ref = ContactRef(id=other.id, kind=other.kind, name=other.name, roles=_sorted_roles(roles.get(other.id)))
            links.append(ContactLink(contact=ref, position=a.position))
    return sorted(links, key=lambda link: (link.contact.name.lower(), link.contact.id))


def all_details() -> list[ContactDetails]:
    """All contacts by name with roles and links, e.g. for other modules that show contacts"""
    contacts = repository.find_all()
    roles = repository.find_roles()
    affiliations = repository.find_affiliations()
    by_id = {c.id: c for c in contacts}
    return [
        ContactDetails(contact=c, roles=_sorted_roles(roles.get(c.id)), links=_links(c, affiliations, by_id, roles))
        for c in contacts
    ]


def contact_list(filters: ContactFilters) -> ContactList:
    """All contacts with roles and links. Search, kind and role filter; the counters show what each filter would give."""
    rows = all_details()

    found = [r for r in rows if _matches_search(r, filters.q)]
    kind = filters.kind if filters.kind in KINDS else None
    role = filters.role if filters.role in ROLES else None
    with_role = [r for r in found if role is None or role in r.roles]
    of_kind = [r for r in found if kind is None or r.contact.kind == kind]
    return ContactList(
        kinds={k: sum(1 for r in with_role if r.contact.kind == k) for k in KINDS},
        roles={x: sum(1 for r in of_kind if x in r.roles) for x in ROLES},
        rows=[r for r in with_role if kind is None or r.contact.kind == kind],
    )


def _matches_search(row: ContactDetails, q: str) -> bool:
    """Name, contact fields, notes and the names and positions of the linked contacts"""
    search = q.strip().lower()
    if not search:
        return True
    c = row.contact
    values = [c.name, c.email, c.phone, c.website, c.street, c.location, c.notes]
    values += [x for link in row.links for x in (link.contact.name, link.position)]
    return search in " ".join(v or "" for v in values).lower()


def contact_options(kind: str = "", role: str = "") -> list[ContactRef]:
    """Contacts to choose from in a form, by name, optionally only of one kind or with one role"""
    roles = repository.find_roles()
    return [
        ContactRef(id=c.id, kind=c.kind, name=c.name, roles=_sorted_roles(roles.get(c.id)))
        for c in repository.find_all()
        if (kind not in KINDS or c.kind == kind) and (role not in ROLES or role in roles.get(c.id, set()))
    ]


def contact_details(contact_id: int) -> ContactDetails | None:
    contact = repository.find_by_id(contact_id)
    if not contact:
        return None
    affiliations = repository.find_affiliations(contact_id)
    others = repository.find_by_ids([a.organization_id if contact.kind == "person" else a.person_id for a in affiliations])
    by_id = {c.id: c for c in others}
    roles = repository.find_roles()
    return ContactDetails(
        contact=contact,
        roles=_sorted_roles(roles.get(contact_id)),
        links=_links(contact, affiliations, by_id, roles),
    )


def _prepared(kind: ContactKind, body: ContactFieldsIn) -> tuple[dict[str, object], list[ContactRole], list[repository.Link]]:
    """
    Values for the repository. Roles the kind cannot have are dropped. Links to contacts that do not exist (anymore) or
    are of the same kind are left out, and a contact linked twice only counts once.
    """
    values = body.model_dump(include=set(repository.FIELDS))
    allowed = roles_for(kind)
    roles = [r for r in allowed if r in body.roles]
    candidates = {c.id for c in repository.find_all() if c.kind == other_kind(kind)}
    seen: set[int] = set()
    links: list[repository.Link] = []
    for link in body.links:
        if link.contact_id is None:
            links.append((None, link.name, link.position))
        elif link.contact_id in candidates and link.contact_id not in seen:
            seen.add(link.contact_id)
            links.append((link.contact_id, None, link.position))
    return values, roles, links


def create_contact(body: ContactIn) -> int:
    return repository.insert(body.kind, *_prepared(body.kind, body))


def save_contact(contact_id: int, body: ContactSaveIn) -> ContactDetails | None:
    """Saves the contact with roles and links and returns it as saved. None if it does not exist."""
    contact = repository.find_by_id(contact_id)
    if not contact:
        return None
    repository.save(contact, *_prepared(contact.kind, body))
    return contact_details(contact_id)


def delete_contact(contact_id: int) -> None:
    repository.delete(contact_id)
