"""Database access of the module: the SQL for calculator_inquiry and calculator_items."""

from ..core import db
from .models import Billing, CalculatorInquiry, CalculatorItem, Category

# There is only one shared inquiry, with this ID
INQUIRY_ID = 1


def find_inquiry() -> CalculatorInquiry | None:
    row = db.one("select * from calculator_inquiry where id = ?", (INQUIRY_ID,))
    return CalculatorInquiry.model_validate(row) if row else None


def find_items() -> list[CalculatorItem]:
    rows = db.query("select * from calculator_items order by sort_order, id")
    return [CalculatorItem.model_validate(r) for r in rows]


def save_inquiry(
    location: str | None, one_way_km: float | None, days: int, buffer_percent: float, round_trip: bool
) -> None:
    with db.write() as w:
        w.execute(
            """insert into calculator_inquiry (id, location, one_way_km, days, buffer_percent, round_trip)
               values (?, ?, ?, ?, ?, ?)
               on conflict (id) do update set location = excluded.location, one_way_km = excluded.one_way_km,
                 days = excluded.days, buffer_percent = excluded.buffer_percent, round_trip = excluded.round_trip""",
            (INQUIRY_ID, location, one_way_km, days, buffer_percent, round_trip),
        )


def update_item(item_id: int, values: dict[str, object]) -> None:
    """Saves rates and selection; a name of None keeps the old name"""
    with db.write() as w:
        w.execute(
            """update calculator_items set name = coalesce(?, name), billing = ?, amount = ?, fuel_per_km = ?,
                 free_km = ?, selected = ?, quantity = ?, duration = ? where id = ?""",
            (
                values["name"],
                values["billing"],
                values["amount"],
                values["fuel_per_km"],
                values["free_km"],
                values["selected"],
                values["quantity"],
                values["duration"],
                item_id,
            ),
        )


def insert_item(category: Category, name: str, billing: Billing, selected: bool) -> CalculatorItem:
    """Adds the item at the end of its category"""
    with db.write() as w:
        new_id = w.execute(
            """insert into calculator_items (category, name, billing, sort_order, selected)
               values (?, ?, ?, (select coalesce(max(sort_order), 0) + 10 from calculator_items where category = ?), ?)""",
            (category, name, billing, category, selected),
        )
        row = w.query("select * from calculator_items where id = ?", (new_id,))[0]
    return CalculatorItem.model_validate(row)


def delete_item(item_id: int) -> None:
    with db.write() as w:
        w.execute("delete from calculator_items where id = ?", (item_id,))


def clear_inquiry() -> None:
    """Clears location, distance and selection in one transaction; the items with their rates and the buffer stay"""
    with db.write() as w:
        w.execute(
            """insert into calculator_inquiry (id, location, one_way_km, days, round_trip) values (?, null, null, 1, 1)
               on conflict (id) do update set location = null, one_way_km = null, days = 1, round_trip = 1""",
            (INQUIRY_ID,),
        )
        w.execute("update calculator_items set selected = 0, quantity = 1, duration = null")
