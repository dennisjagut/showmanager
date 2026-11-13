"""Business logic of the module. The router calls only this, this calls the repository."""

import re

from ..core.dates import today_iso
from ..masterdata import repository as masterdata
from ..masterdata.models import PackingList, PackingListCategory, PackingListItem
from ..masterdata.service import group_items
from . import repository
from .models import Guest, PackingMarks, ScheduleItem, ScheduleTemplate, Show
from .schemas import (
    GuestIn,
    MoveIn,
    PackingMarkIn,
    PackingGroup,
    PackingItem,
    ScheduleItemIn,
    ShowDetails,
    ShowIn,
    ShowList,
    ShowPacking,
    ShowRow,
    TemplateIn,
)

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


def packing(
    show: Show,
    lists: dict[int, PackingList],
    categories: list[PackingListCategory],
    items: list[PackingListItem],
    marks: PackingMarks,
) -> ShowPacking | None:
    """The show's packing list by category, with what is already packed for it and packed again after it"""
    packing_list = lists.get(show.packing_list_id) if show.packing_list_id else None
    if not packing_list:
        return None
    groups = group_items(
        [c for c in categories if c.packing_list_id == packing_list.id],
        [i for i in items if i.packing_list_id == packing_list.id],
    )
    return ShowPacking(
        packing_list=packing_list,
        groups=[
            PackingGroup(
                category=g.category,
                items=[
                    PackingItem(item=i, packed=i.id in marks.packed, repacked=i.id in marks.repacked) for i in g.items
                ],
            )
            for g in groups
            if g.items
        ],
    )


def all_show_details() -> list[ShowDetails]:
    """All shows by date with schedule, guest list and packing list"""
    schedule = repository.find_schedule()
    guests = repository.find_guests()
    lists = {p.id: p for p in masterdata.find_packing_lists()}
    categories = masterdata.find_categories()
    items = masterdata.find_items()
    marks = repository.find_marks()
    return [
        ShowDetails(
            show=show,
            schedule=by_time([p for p in schedule if p.show_id == show.id]),
            guests=[g for g in guests if g.show_id == show.id],
            packing=packing(show, lists, categories, items, marks.get(show.id, PackingMarks())),
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
    packing_list = masterdata.find_packing_list(show.packing_list_id) if show.packing_list_id else None
    return ShowDetails(
        show=show,
        schedule=by_time(repository.find_schedule(show_id)),
        guests=repository.find_guests(show_id),
        packing=packing(
            show,
            {packing_list.id: packing_list} if packing_list else {},
            masterdata.find_categories(packing_list.id) if packing_list else [],
            masterdata.find_items(packing_list.id) if packing_list else [],
            repository.find_marks(show_id).get(show_id, PackingMarks()),
        ),
    )


def tours() -> list[str]:
    return repository.find_tours()


def show_values(body: ShowIn) -> dict[str, object]:
    """A packing list that no longer exists (deleted meanwhile) is not saved"""
    values = body.model_dump()
    if body.packing_list_id and not masterdata.find_packing_list(body.packing_list_id):
        values["packing_list_id"] = None
    return values


def create_show(body: ShowIn) -> int:
    return repository.insert(show_values(body))


def update_show(show_id: int, body: ShowIn) -> None:
    repository.update(show_id, show_values(body))


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


# --- Packing list ----------------------------------------------------------------------------------------------------


def set_mark(show_id: int, item_id: int, body: PackingMarkIn) -> None:
    """Only items of the show's own packing list can be marked"""
    show = repository.find_by_id(show_id)
    if not show or not show.packing_list_id:
        return
    if any(i.id == item_id for i in masterdata.find_items(show.packing_list_id)):
        repository.set_mark(show_id, item_id, body.stage, body.done)


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
