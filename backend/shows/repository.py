"""Database access of the module: the SQL for shows, their schedule and guests, and the schedule templates."""

from ..core import db
from .models import Guest, ScheduleItem, ScheduleTemplate, Show

SHOW_FIELDS = [
    "date",
    "title",
    "status",
    "tour",
    "venue",
    "address",
    "contact_name",
    "contact_phone",
    "contact_email",
    "fee",
    "guest_quota",
    "hotel",
    "travel",
    "tech",
    "notes",
]

# --- Shows -----------------------------------------------------------------------------------------------------------


def find_all() -> list[Show]:
    """All shows by date"""
    return [Show.model_validate(r) for r in db.query("select * from shows order by date")]


def find_by_id(show_id: int) -> Show | None:
    row = db.one("select * from shows where id = ?", (show_id,))
    return Show.model_validate(row) if row else None


def find_tours() -> list[str]:
    return [r["tour"] for r in db.query("select distinct tour from shows where tour is not null order by tour")]


def insert(values: dict[str, object]) -> int:
    with db.write() as w:
        return w.execute(
            f"insert into shows ({', '.join(SHOW_FIELDS)}) values ({', '.join('?' * len(SHOW_FIELDS))})",
            [values[k] for k in SHOW_FIELDS],
        )


def update(show_id: int, values: dict[str, object]) -> None:
    with db.write() as w:
        w.execute(
            f"update shows set {', '.join(f'{k} = ?' for k in SHOW_FIELDS)}, updated_at = datetime('now') where id = ?",
            [*(values[k] for k in SHOW_FIELDS), show_id],
        )


def delete(show_id: int) -> None:
    """Deletes the show with its schedule and guest list"""
    with db.write() as w:
        w.execute("delete from show_schedule where show_id = ?", (show_id,))
        w.execute("delete from show_guests where show_id = ?", (show_id,))
        w.execute("delete from shows where id = ?", (show_id,))


# --- Running order ---------------------------------------------------------------------------------------------------


def find_schedule(show_id: int | None = None) -> list[ScheduleItem]:
    """Schedule items of one show, or of all shows without show_id (unsorted, the service sorts by time of day)"""
    if show_id is None:
        rows = db.query("select * from show_schedule")
    else:
        rows = db.query("select * from show_schedule where show_id = ?", (show_id,))
    return [ScheduleItem.model_validate(r) for r in rows]


def add_schedule_item(show_id: int, time: str, item: str, rename: tuple[str, str] | None = None) -> None:
    """Adds an item; with rename=(old, new), an existing item of the show is renamed in the same transaction"""
    with db.write() as w:
        if rename:
            w.execute("update show_schedule set item = ? where show_id = ? and item = ?", (rename[1], show_id, rename[0]))
        w.execute("insert into show_schedule (show_id, time, item) values (?, ?, ?)", (show_id, time, item))


def delete_schedule_item(show_id: int, item_id: int) -> None:
    with db.write() as w:
        w.execute("delete from show_schedule where id = ? and show_id = ?", (item_id, show_id))


# --- Guest list ------------------------------------------------------------------------------------------------------


def find_guests(show_id: int | None = None) -> list[Guest]:
    """Guests of one show, or of all shows without show_id, by name"""
    if show_id is None:
        rows = db.query("select * from show_guests order by name")
    else:
        rows = db.query("select * from show_guests where show_id = ? order by name", (show_id,))
    return [Guest.model_validate(r) for r in rows]


def insert_guest(show_id: int, name: str, plus_ones: int, added_by: str | None, note: str | None) -> None:
    with db.write() as w:
        w.execute(
            "insert into show_guests (show_id, name, plus_ones, added_by, note) values (?, ?, ?, ?, ?)",
            (show_id, name, plus_ones, added_by, note),
        )


def delete_guest(show_id: int, guest_id: int) -> None:
    with db.write() as w:
        w.execute("delete from show_guests where id = ? and show_id = ?", (guest_id, show_id))


# --- Templates for the running order ---------------------------------------------------------------------------------


def find_templates() -> list[ScheduleTemplate]:
    rows = db.query("select * from schedule_templates order by sort_order, id")
    return [ScheduleTemplate.model_validate(r) for r in rows]


def find_template_by_name(name: str) -> ScheduleTemplate | None:
    row = db.one("select * from schedule_templates where name = ?", (name,))
    return ScheduleTemplate.model_validate(row) if row else None


def insert_template(name: str, repeatable: bool) -> None:
    """Adds the template at the end; a name that already exists is not added a second time"""
    with db.write() as w:
        w.execute(
            """insert into schedule_templates (name, repeatable, sort_order)
               values (?, ?, (select coalesce(max(sort_order), 0) + 10 from schedule_templates))
               on conflict (name) do nothing""",
            (name, repeatable),
        )


def update_template(template_id: int, name: str | None, repeatable: bool) -> None:
    """Without a name, only `repeatable` changes"""
    with db.write() as w:
        w.execute(
            "update schedule_templates set name = coalesce(?, name), repeatable = ? where id = ?",
            (name, repeatable, template_id),
        )


def delete_template(template_id: int) -> None:
    with db.write() as w:
        w.execute("delete from schedule_templates where id = ?", (template_id,))


def save_template_order(template_ids: list[int]) -> None:
    """Numbers the templates in the given order (10, 20, 30 …)"""
    with db.write() as w:
        for index, template_id in enumerate(template_ids):
            w.execute("update schedule_templates set sort_order = ? where id = ?", ((index + 1) * 10, template_id))
