"""Puts all tables together, grouped by module."""

from datetime import datetime, timezone

from . import repository


def backup() -> dict[str, object]:
    table = repository.find_all
    return {
        "created": datetime.now(timezone.utc).isoformat(),
        "applications": {"festivals": table("festivals"), "applications": table("applications")},
        "shows": {
            "shows": table("shows"),
            "schedule": table("show_schedule"),
            "guests": table("show_guests"),
            "scheduleTemplates": table("schedule_templates"),
        },
        "calculator": {"items": table("calculator_items"), "inquiry": table("calculator_inquiry")},
    }
