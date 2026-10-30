"""Reads whole tables, as they are."""

from ..core import db

TABLES = [
    "festivals",
    "applications",
    "shows",
    "show_schedule",
    "show_guests",
    "schedule_templates",
    "calculator_items",
    "calculator_inquiry",
]


def find_all(table: str) -> list[db.Row]:
    if table not in TABLES:
        raise ValueError(f"Unknown table {table}")
    return db.query(f"select * from {table}")
