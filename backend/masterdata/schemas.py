"""What the API receives and returns. The entities themselves are in models.py."""

from ..core.base import ApiModel, OptionalQuantity, RequiredText
from .models import PackingList, PackingListCategory, PackingListItem


class PackingListSummary(ApiModel):
    packing_list: PackingList
    item_count: int


class PackingListGroup(ApiModel):
    # None for the items without a category
    category: PackingListCategory | None
    # In the order of the category
    items: list[PackingListItem]


class PackingListDetails(ApiModel):
    packing_list: PackingList
    # First the items without a category (only if there are any), then every category in its order, empty ones too
    groups: list[PackingListGroup]


class PackingListIn(ApiModel):
    name: RequiredText


class PackingListItemIn(ApiModel):
    # None for a new item
    id: int | None = None
    name: RequiredText
    # Empty means 1
    quantity: OptionalQuantity = None


class PackingListCategoryIn(ApiModel):
    # None for a new category
    id: int | None = None
    name: RequiredText
    # In this order
    items: list[PackingListItemIn] = []


class PackingListSaveIn(ApiModel):
    """The whole list as it should be afterwards: what is missing is deleted, what has no ID is added"""

    name: RequiredText
    # Items without a category, in this order
    uncategorized: list[PackingListItemIn] = []
    # In this order
    categories: list[PackingListCategoryIn] = []
