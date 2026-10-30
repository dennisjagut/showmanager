"""Business logic of the module. The router calls only this, this calls the repository."""

import re

from ..core.dates import today_iso
from . import repository
from .models import Guest, ScheduleItem, ScheduleTemplate, Show
from .schemas import GuestIn, MoveIn, ScheduleItemIn, ShowDetails, ShowIn, ShowList, ShowRow, TemplateIn

# The item names are free text in the band's language
SHOWTIME = re.compile(r"show|konzert|auftritt|stage|concert", re.IGNORECASE)

# --- Shows -----------------------------------------------------------------------------------------------------------


def time_sort_key(time: str) -> str:
    """Times until 05:59 belong to the evening before (curfew 00:30, load-out 01:00 …)"""
    return f"2{time}" if time < "06:00" else f"1{time}"


def by_time(items: list[ScheduleItem]) -> list[ScheduleItem]:
    return sorted(items, key=lambda p: time_sort_key(p.time))


def guest_count(guests: list[Guest]) -> int:
    """Guests including their plus-ones"""
    return sum(1 + g.plus_ones for g in guests)


def all_show_details() -> list[ShowDetails]:
    """All shows by date with schedule and guest list"""
    schedule = repository.find_schedule()
    guests = repository.find_guests()
    return [
        ShowDetails(
            show=show,
            schedule=by_time([p for p in schedule if p.show_id == show.id]),
            guests=[g for g in guests if g.show_id == show.id],
        )
        for show in repository.find_all()
    ]


def list_shows(view: str, tour: str) -> ShowList:
    """Upcoming shows count from today, past ones are listed newest first. An unknown view shows the upcoming ones."""
    rows = [
        ShowRow(
            show=d.show,
            showtime=next((p.time for p in d.schedule if SHOWTIME.search(p.item)), None),
            guest_count=guest_count(d.guests),
        )
        for d in all_show_details()
    ]
    today = today_iso()
    upcoming = [r for r in rows if r.show.date >= today]
    by_view = {"past": [r for r in reversed(rows) if r.show.date < today], "all": rows}.get(view, upcoming)
    return ShowList(
        next=next((r for r in upcoming if r.show.status != "cancelled"), None),
        confirmed=sum(1 for r in upcoming if r.show.status == "confirmed"),
        options=sum(1 for r in upcoming if r.show.status == "option"),
        tours=repository.find_tours(),
        shows=[r for r in by_view if not tour or r.show.tour == tour],
    )


def show_details(show_id: int) -> ShowDetails | None:
    show: Show | None = repository.find_by_id(show_id)
    if not show:
        return None
    return ShowDetails(
        show=show,
        schedule=by_time(repository.find_schedule(show_id)),
        guests=repository.find_guests(show_id),
    )


def tours() -> list[str]:
    return repository.find_tours()


def create_show(body: ShowIn) -> int:
    return repository.insert(body.model_dump())


def update_show(show_id: int, body: ShowIn) -> None:
    repository.update(show_id, body.model_dump())


def delete_show(show_id: int) -> None:
    repository.delete(show_id)


# --- Running order ---------------------------------------------------------------------------------------------------


def next_number(base: str, existing: list[str]) -> tuple[str, bool]:
    """
    Next name for a schedule item that occurs several times: the second "Support" becomes "Support 2" and the
    existing "Support" becomes "Support 1". Returns the new name and whether the existing one has to be renamed.
    """
    pattern = re.compile(rf"^{re.escape(base)} (\d+)$")
    numbers = [1 if item == base else int(m.group(1)) for item in existing if item == base or (m := pattern.match(item))]
    if not numbers:
        return base, False
    return f"{base} {max(numbers) + 1}", base in existing


def add_schedule_item(show_id: int, body: ScheduleItemIn) -> None:
    """Items from a repeatable template are numbered when they occur more than once"""
    template = repository.find_template_by_name(body.item)
    if not template or not template.repeatable:
        repository.add_schedule_item(show_id, body.time, body.item)
        return
    existing = [p.item for p in repository.find_schedule(show_id)]
    name, rename_first = next_number(body.item, existing)
    rename = (body.item, f"{body.item} 1") if rename_first else None
    repository.add_schedule_item(show_id, body.time, name, rename)


def delete_schedule_item(show_id: int, item_id: int) -> None:
    repository.delete_schedule_item(show_id, item_id)


# --- Guest list ------------------------------------------------------------------------------------------------------


def add_guest(show_id: int, body: GuestIn) -> None:
    repository.insert_guest(show_id, body.name, body.plus_ones or 0, body.added_by, body.note)


def delete_guest(show_id: int, guest_id: int) -> None:
    repository.delete_guest(show_id, guest_id)


# --- Templates for the running order ---------------------------------------------------------------------------------


def templates() -> list[ScheduleTemplate]:
    return repository.find_templates()


def add_template(body: TemplateIn) -> None:
    repository.insert_template(body.name, body.repeatable)


def save_template(template_id: int, body: TemplateIn) -> None:
    # Renaming to the name of another template would break the unique name, so the old name stays
    other = repository.find_template_by_name(body.name)
    name = None if other and other.id != template_id else body.name
    repository.update_template(template_id, name, body.repeatable)


def delete_template(template_id: int) -> None:
    repository.delete_template(template_id)


def move_template(template_id: int, body: MoveIn) -> None:
    """Swaps the position with the neighbour above or below"""
    ids = [t.id for t in repository.find_templates()]
    if template_id not in ids:
        return
    i = ids.index(template_id)
    j = i + (-1 if body.direction == "up" else 1)
    if j < 0 or j >= len(ids):
        return
    ids[i], ids[j] = ids[j], ids[i]
    # Reassign the whole order, so that equal values are resolved cleanly too
    repository.save_template_order(ids)
