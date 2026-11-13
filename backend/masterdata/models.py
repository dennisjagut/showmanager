"""Entities of the module, as they are stored in the tables packing_lists, packing_list_categories and
packing_list_items."""

from ..core.base import ApiModel


class PackingList(ApiModel):
    id: int
    # e.g. "Minimales Setup" or "Volles Setup"
    name: str
    created_at: str
    updated_at: str


class PackingListCategory(ApiModel):
    """Section of a packing list, e.g. Kabel, Instrumente, Drums"""

    id: int
    packing_list_id: int
    name: str
    sort_order: int


class PackingListItem(ApiModel):
    id: int
    packing_list_id: int
    # None: not in a category, these items come first
    category_id: int | None
    name: str
    quantity: int
    # Position within its category
    sort_order: int
