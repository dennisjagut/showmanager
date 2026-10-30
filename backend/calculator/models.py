"""Entities of the module, as they are stored in the tables calculator_inquiry and calculator_items."""

from typing import Literal

from ..core.base import ApiModel

Category = Literal["vehicle", "accommodation", "crew", "other"]
Billing = Literal["per_day", "flat"]


class CalculatorInquiry(ApiModel):
    id: int
    location: str | None
    one_way_km: float | None
    days: int
    buffer_percent: float
    round_trip: bool


class CalculatorItem(ApiModel):
    id: int
    category: Category
    name: str
    # Vehicles: rent per day or flat; crew is always per day, other always flat, accommodation per room and night
    billing: Billing
    amount: float
    # Vehicles only
    fuel_per_km: float
    # Rented vehicles only (rent > 0): this many km are included in the rent, fuel only counts above that
    free_km: float
    sort_order: int
    # The selection for the current inquiry is stored on the item, because there is only one shared inquiry
    selected: bool
    # Vehicles: how many of them go; accommodation: how many rooms of this type
    quantity: int
    # Vehicles rented per day: rental days, null = as many as days on site; accommodation: nights, null = 1
    duration: int | None
