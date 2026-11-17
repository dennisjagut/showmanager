"""Puts all tables together, grouped by module."""

from datetime import datetime, timezone

from . import repository


def backup() -> dict[str, object]:
    table = repository.find_all
    return {
        "created": datetime.now(timezone.utc).isoformat(),
        "applications": {
            "festivals": table("festivals"),
            "applications": table("applications"),
            "contacts": table("festival_contacts"),
        },
        "shows": {
            "shows": table("shows"),
            "schedule": table("show_schedule"),
            "guests": table("show_guests"),
            "scheduleTemplates": table("schedule_templates"),
            "packingMarks": table("show_packing_marks"),
            "contacts": table("show_contacts"),
        },
        "contacts": {
            "contacts": table("contacts"),
            "roles": table("contact_roles"),
            "affiliations": table("contact_affiliations"),
        },
        "masterdata": {
            "packingLists": table("packing_lists"),
            "packingListCategories": table("packing_list_categories"),
            "packingListItems": table("packing_list_items"),
        },
        "calculator": {"items": table("calculator_items"), "inquiry": table("calculator_inquiry")},
    }
