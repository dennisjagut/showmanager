"""HTTP endpoints of the module. They only translate between HTTP and the service."""

from fastapi import APIRouter, HTTPException

from ..core.base import Created
from . import service
from .schemas import PackingListDetails, PackingListIn, PackingListSaveIn, PackingListSummary

router = APIRouter(tags=["masterdata"])

NOT_FOUND = "Packing list not found"


@router.get("/packing-lists")
def packing_lists() -> list[PackingListSummary]:
    return service.packing_lists()


@router.get("/packing-lists/{list_id}")
def packing_list_details(list_id: int) -> PackingListDetails:
    details = service.packing_list_details(list_id)
    if not details:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return details


@router.post("/packing-lists")
def create_packing_list(body: PackingListIn) -> Created:
    return Created(id=service.create_packing_list(body))


@router.post("/packing-lists/{list_id}/copy")
def copy_packing_list(list_id: int, body: PackingListIn) -> Created:
    """New list with the given name and all categories and items of this one"""
    new_id = service.copy_packing_list(list_id, body)
    if new_id is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return Created(id=new_id)


@router.put("/packing-lists/{list_id}")
def save_packing_list(list_id: int, body: PackingListSaveIn) -> PackingListDetails:
    """Saves the whole list: entries without an ID are added, missing ones deleted. Returns the saved list."""
    details = service.save_packing_list(list_id, body)
    if not details:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return details


@router.delete("/packing-lists/{list_id}")
def delete_packing_list(list_id: int) -> None:
    """Shows that used the list no longer have a packing list"""
    service.delete_packing_list(list_id)
