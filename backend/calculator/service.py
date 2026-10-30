"""Business logic of the module. The router calls only this, this calls the repository."""

from . import repository
from .models import CalculatorInquiry, CalculatorItem
from .schemas import CalculatorData, CalculatorInquiryIn, CalculatorItemIn, NewCalculatorItemIn


def calculator() -> CalculatorData:
    # Until someone has entered anything, there is no inquiry in the database
    inquiry = repository.find_inquiry() or CalculatorInquiry(
        id=repository.INQUIRY_ID, location=None, one_way_km=None, days=1, buffer_percent=10, round_trip=True
    )
    return CalculatorData(inquiry=inquiry, items=repository.find_items())


def save_inquiry(body: CalculatorInquiryIn) -> None:
    repository.save_inquiry(body.location, body.one_way_km, body.days, body.buffer_percent, body.round_trip)


def save_item(item_id: int, body: CalculatorItemIn) -> None:
    repository.update_item(item_id, body.model_dump())


def add_item(body: NewCalculatorItemIn) -> CalculatorItem:
    # "Other" is always a flat amount, everything else starts per day. Whoever adds something usually wants to include
    # it right away, so it is selected.
    billing = "flat" if body.category == "other" else "per_day"
    return repository.insert_item(body.category, body.name, billing, selected=True)


def delete_item(item_id: int) -> None:
    repository.delete_item(item_id)


def reset() -> None:
    """Clears location, distance and selection ("Anfrage zurücksetzen"). The items and the buffer stay."""
    repository.clear_inquiry()
