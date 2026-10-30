"""What the API receives and returns. The entities themselves are in models.py."""

from typing import Annotated

from pydantic import Field

from ..core.base import ApiModel, OptionalText
from .models import Billing, CalculatorInquiry, CalculatorItem, Category

Amount = Annotated[float, Field(ge=0)]


class CalculatorData(ApiModel):
    inquiry: CalculatorInquiry
    items: list[CalculatorItem]


class CalculatorInquiryIn(ApiModel):
    location: OptionalText = None
    one_way_km: Amount | None = None
    days: Annotated[int, Field(ge=1)] = 1
    buffer_percent: Amount = 10
    round_trip: bool = True


class CalculatorItemIn(ApiModel):
    # An empty name is not saved, the old one stays
    name: OptionalText = None
    billing: Billing
    amount: Amount
    fuel_per_km: Amount
    free_km: Amount
    selected: bool
    quantity: Annotated[int, Field(ge=1)]
    duration: Annotated[int, Field(ge=1)] | None


class NewCalculatorItemIn(ApiModel):
    category: Category
    # The frontend sends the name in the app language, e.g. "Neues Fahrzeug"
    name: str
