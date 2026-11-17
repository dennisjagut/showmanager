"""Database access of the module: the SQL for contacts, their roles and affiliations."""

from ..core import db
from .models import Affiliation, Contact, ContactKind, ContactRole, other_kind

FIELDS = ["name", "email", "phone", "website", "street", "location", "notes"]

# A link as the service passes it on: ID of an existing contact of the other kind, or None and the name of a new one
Link = tuple[int | None, str | None, str | None]


def find_all() -> list[Contact]:
    """All contacts by name"""
    rows = db.query("select * from contacts order by name collate nocase, id")
    return [Contact.model_validate(r) for r in rows]


def find_by_id(contact_id: int) -> Contact | None:
    row = db.one("select * from contacts where id = ?", (contact_id,))
    return Contact.model_validate(row) if row else None


def find_roles(contact_id: int | None = None) -> dict[int, set[ContactRole]]:
    """Roles per contact ID, of one contact or of all"""
    if contact_id is None:
        rows = db.query("select * from contact_roles")
    else:
        rows = db.query("select * from contact_roles where contact_id = ?", (contact_id,))
    roles: dict[int, set[ContactRole]] = {}
    for r in rows:
        roles.setdefault(r["contact_id"], set()).add(r["role"])
    return roles


def find_affiliations(contact_id: int | None = None) -> list[Affiliation]:
    """Affiliations of one contact (from either side) or all of them"""
    if contact_id is None:
        rows = db.query("select * from contact_affiliations")
    else:
        rows = db.query(
            "select * from contact_affiliations where person_id = ? or organization_id = ?", (contact_id, contact_id)
        )
    return [Affiliation.model_validate(r) for r in rows]


def find_by_ids(ids: list[int]) -> list[Contact]:
    if not ids:
        return []
    rows = db.query(f"select * from contacts where id in ({', '.join('?' * len(ids))})", ids)
    return [Contact.model_validate(r) for r in rows]


def _save_roles(w: db.Writer, contact_id: int, roles: list[ContactRole]) -> None:
    w.execute("delete from contact_roles where contact_id = ?", (contact_id,))
    for role in roles:
        w.execute("insert into contact_roles (contact_id, role) values (?, ?)", (contact_id, role))


def _save_links(w: db.Writer, contact_id: int, kind: ContactKind, links: list[Link]) -> None:
    """Replaces the affiliations of the contact on its side; new contacts of the other kind are created on the way"""
    side = "person_id" if kind == "person" else "organization_id"
    w.execute(f"delete from contact_affiliations where {side} = ?", (contact_id,))
    for other_id, new_name, position in links:
        if other_id is None:
            other_id = w.execute("insert into contacts (kind, name) values (?, ?)", (other_kind(kind), new_name))
        person, organization = (contact_id, other_id) if kind == "person" else (other_id, contact_id)
        w.execute(
            "insert into contact_affiliations (person_id, organization_id, position) values (?, ?, ?)",
            (person, organization, position),
        )


def insert(kind: ContactKind, values: dict[str, object], roles: list[ContactRole], links: list[Link]) -> int:
    with db.write() as w:
        contact_id = w.execute(
            f"insert into contacts (kind, {', '.join(FIELDS)}) values (?, {', '.join('?' * len(FIELDS))})",
            [kind, *(values[k] for k in FIELDS)],
        )
        assert contact_id is not None
        _save_roles(w, contact_id, roles)
        _save_links(w, contact_id, kind, links)
        return contact_id


def save(contact: Contact, values: dict[str, object], roles: list[ContactRole], links: list[Link]) -> None:
    """Saves fields, roles and links of the contact in one transaction"""
    with db.write() as w:
        w.execute(
            f"update contacts set {', '.join(f'{k} = ?' for k in FIELDS)}, updated_at = datetime('now') where id = ?",
            [*(values[k] for k in FIELDS), contact.id],
        )
        _save_roles(w, contact.id, roles)
        _save_links(w, contact.id, contact.kind, links)


def delete(contact_id: int) -> None:
    """Deletes the contact with its roles and affiliations and removes it from shows and festivals; the linked contacts
    stay"""
    with db.write() as w:
        w.execute("delete from show_contacts where contact_id = ?", (contact_id,))
        w.execute("delete from festival_contacts where contact_id = ?", (contact_id,))
        w.execute("delete from contact_roles where contact_id = ?", (contact_id,))
        w.execute(
            "delete from contact_affiliations where person_id = ? or organization_id = ?", (contact_id, contact_id)
        )
        w.execute("delete from contacts where id = ?", (contact_id,))
