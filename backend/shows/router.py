"""HTTP endpoints of the module. They only translate between HTTP and the service."""

from fastapi import APIRouter, HTTPException

from ..core.base import Created
from . import service
from .models import ScheduleTemplate
from .schemas import GuestIn, PackingMarkIn, ScheduleItemIn, ShowDetails, ShowIn, ShowList, TemplatesSaveIn

router = APIRouter(tags=["shows"])


@router.get("/shows/details")
def all_show_details() -> list[ShowDetails]:
    """All shows with schedule, guest list and packing list, e.g. for the CSV export"""
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


@router.put("/shows/{show_id}/packing/{item_id}")
def set_packing_mark(show_id: int, item_id: int, body: PackingMarkIn) -> None:
    """Checks an item of the show's packing list off (or not) as packed for the trip there or packed again after it"""
    service.set_mark(show_id, item_id, body)


@router.get("/templates")
def templates() -> list[ScheduleTemplate]:
    return service.templates()


@router.put("/templates")
def save_templates(body: TemplatesSaveIn) -> list[ScheduleTemplate]:
    """Saves all templates at once, in this order: what is missing is deleted, what has no ID is added"""
    return service.save_templates(body)
