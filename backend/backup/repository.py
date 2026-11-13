"""Reads whole tables, as they are."""

from ..core import db

TABLES = [
    "festivals",
    "applications",
    "shows",
    "show_schedule",
    "show_guests",
    "schedule_templates",
    "show_packing_marks",
    "packing_lists",
    "packing_list_categories",
    "packing_list_items",
    "calculator_items",
    "calculator_inquiry",
]


def find_all(table: str) -> list[db.Row]:
    if table not in TABLES:
        raise ValueError(f"Unknown table {table}")
    return db.query(f"select * from {table}")
