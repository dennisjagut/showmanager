"""HTTP endpoints of the module. They only translate between HTTP and the service."""

from fastapi import APIRouter

from . import service
from .models import CalculatorItem
from .schemas import CalculatorData, CalculatorInquiryIn, CalculatorItemIn, NewCalculatorItemIn

router = APIRouter(prefix="/calculator", tags=["calculator"])


@router.get("")
def calculator() -> CalculatorData:
    return service.calculator()


@router.put("/inquiry")
def save_inquiry(body: CalculatorInquiryIn) -> None:
    service.save_inquiry(body)


@router.put("/items/{item_id}")
def save_item(item_id: int, body: CalculatorItemIn) -> None:
    service.save_item(item_id, body)


@router.post("/items")
def add_item(body: NewCalculatorItemIn) -> CalculatorItem:
    return service.add_item(body)


@router.delete("/items/{item_id}")
def delete_item(item_id: int) -> None:
    service.delete_item(item_id)


@router.post("/reset")
def reset() -> None:
    service.reset()
