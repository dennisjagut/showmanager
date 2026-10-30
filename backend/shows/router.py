"""HTTP endpoints of the module. They only translate between HTTP and the service."""

from fastapi import APIRouter, HTTPException

from ..core.base import Created
from . import service
from .models import ScheduleTemplate
from .schemas import GuestIn, MoveIn, ScheduleItemIn, ShowDetails, ShowIn, ShowList, TemplateIn

router = APIRouter(tags=["shows"])


@router.get("/shows/details")
def all_show_details() -> list[ShowDetails]:
    """All shows with schedule and guest list, e.g. for the CSV export"""
    return service.all_show_details()


@router.get("/shows")
def list_shows(view: str = "upcoming", tour: str = "") -> ShowList:
    """Upcoming shows count from today, past ones are listed newest first. An unknown view shows the upcoming ones."""
    return service.list_shows(view, tour)


@router.get("/shows/{show_id}")
def show_details(show_id: int) -> ShowDetails:
    details = service.show_details(show_id)
    if not details:
        raise HTTPException(status_code=404, detail="Show not found")
    return details


@router.get("/tours")
def tours() -> list[str]:
    return service.tours()


@router.post("/shows")
def create_show(body: ShowIn) -> Created:
    return Created(id=service.create_show(body))


@router.put("/shows/{show_id}")
def update_show(show_id: int, body: ShowIn) -> None:
    service.update_show(show_id, body)


@router.delete("/shows/{show_id}")
def delete_show(show_id: int) -> None:
    service.delete_show(show_id)


@router.post("/shows/{show_id}/schedule")
def add_schedule_item(show_id: int, body: ScheduleItemIn) -> None:
    service.add_schedule_item(show_id, body)


@router.delete("/shows/{show_id}/schedule/{item_id}")
def delete_schedule_item(show_id: int, item_id: int) -> None:
    service.delete_schedule_item(show_id, item_id)


@router.post("/shows/{show_id}/guests")
def add_guest(show_id: int, body: GuestIn) -> None:
    service.add_guest(show_id, body)


@router.delete("/shows/{show_id}/guests/{guest_id}")
def delete_guest(show_id: int, guest_id: int) -> None:
    service.delete_guest(show_id, guest_id)


@router.get("/templates")
def templates() -> list[ScheduleTemplate]:
    return service.templates()


@router.post("/templates")
def add_template(body: TemplateIn) -> None:
    service.add_template(body)


@router.put("/templates/{template_id}")
def save_template(template_id: int, body: TemplateIn) -> None:
    service.save_template(template_id, body)


@router.delete("/templates/{template_id}")
def delete_template(template_id: int) -> None:
    service.delete_template(template_id)


@router.post("/templates/{template_id}/move")
def move_template(template_id: int, body: MoveIn) -> None:
    """Swaps the position with the neighbour above or below"""
    service.move_template(template_id, body)
