"""Database access of the module: the SQL for shows, their schedule and guests, and the schedule templates."""

from ..core import db
from .models import Guest, PackingMarks, PackingStage, ScheduleItem, ScheduleTemplate, Show
from .schemas import TemplateIn

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
    "packing_list_id",
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
    """Marks for items that are not on the show's packing list (any more) are dropped"""
    with db.write() as w:
        w.execute(
            f"update shows set {', '.join(f'{k} = ?' for k in SHOW_FIELDS)}, updated_at = datetime('now') where id = ?",
            [*(values[k] for k in SHOW_FIELDS), show_id],
        )
        w.execute(
            """delete from show_packing_marks where show_id = ? and item_id not in
               (select i.id from packing_list_items i join shows s on s.packing_list_id = i.packing_list_id
                where s.id = ?)""",
            (show_id, show_id),
        )


def delete(show_id: int) -> None:
    """Deletes the show with its schedule, guest list and packing marks"""
    with db.write() as w:
        w.execute("delete from show_packing_marks where show_id = ?", (show_id,))
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


# --- Packing list ----------------------------------------------------------------------------------------------------


def find_marks(show_id: int | None = None) -> dict[int, PackingMarks]:
    """Checked off items per show, for one show or for all without show_id"""
    if show_id is None:
        rows = db.query("select * from show_packing_marks")
    else:
        rows = db.query("select * from show_packing_marks where show_id = ?", (show_id,))
    marks: dict[int, PackingMarks] = {}
    for r in rows:
        show_marks = marks.setdefault(r["show_id"], PackingMarks())
        (show_marks.repacked if r["stage"] == "repacked" else show_marks.packed).add(r["item_id"])
    return marks


def set_mark(show_id: int, item_id: int, stage: PackingStage, done: bool) -> None:
    with db.write() as w:
        if done:
            w.execute(
                "insert or ignore into show_packing_marks (show_id, item_id, stage) values (?, ?, ?)",
                (show_id, item_id, stage),
            )
        else:
            w.execute(
                "delete from show_packing_marks where show_id = ? and item_id = ? and stage = ?",
                (show_id, item_id, stage),
            )


# --- Templates for the running order ---------------------------------------------------------------------------------


def find_templates() -> list[ScheduleTemplate]:
    rows = db.query("select * from schedule_templates order by sort_order, id")
    return [ScheduleTemplate.model_validate(r) for r in rows]


def find_template_by_name(name: str) -> ScheduleTemplate | None:
    row = db.one("select * from schedule_templates where name = ?", (name,))
    return ScheduleTemplate.model_validate(row) if row else None


def save_templates(templates: list[TemplateIn]) -> None:
    """
    Saves all templates in one transaction, numbered in the given order (10, 20, 30 …). Templates with an ID are
    updated, the others added; whatever is no longer in the list is deleted. The IDs must exist and the names be unique.
    """
    kept = [t.id for t in templates if t.id is not None]
    with db.write() as w:
        not_kept = f"where id not in ({', '.join('?' * len(kept))})" if kept else ""
        w.execute(f"delete from schedule_templates {not_kept}", kept)
        # The names are unique: kept templates first get a placeholder, so that two of them can swap their names
        for template_id in kept:
            w.execute("update schedule_templates set name = ? where id = ?", (f"\0{template_id}", template_id))
        for index, t in enumerate(templates):
            values = (t.name, t.repeatable, (index + 1) * 10)
            if t.id is None:
                w.execute("insert into schedule_templates (name, repeatable, sort_order) values (?, ?, ?)", values)
            else:
                w.execute(
                    "update schedule_templates set name = ?, repeatable = ?, sort_order = ? where id = ?", (*values, t.id)
                )
