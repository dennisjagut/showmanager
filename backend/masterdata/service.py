"""Business logic of the module. The router calls only this, this calls the repository."""

from . import repository
from .models import PackingListCategory, PackingListItem
from .schemas import (
    PackingListDetails,
    PackingListGroup,
    PackingListIn,
    PackingListItemIn,
    PackingListSaveIn,
    PackingListSummary,
)


def group_items(categories: list[PackingListCategory], items: list[PackingListItem]) -> list[PackingListGroup]:
    """
    Items without a category first (only if there are any), then every category in its order, empty ones too. Items of
    a category that does not exist count as without a category.
    """
    ids = {c.id for c in categories}
    uncategorized = [i for i in items if i.category_id not in ids]
    groups = [PackingListGroup(category=None, items=uncategorized)] if uncategorized else []
    return groups + [PackingListGroup(category=c, items=[i for i in items if i.category_id == c.id]) for c in categories]


def packing_lists() -> list[PackingListSummary]:
    """All packing lists by name, with the number of items"""
    items = repository.find_items()
    return [
        PackingListSummary(packing_list=p, item_count=sum(1 for i in items if i.packing_list_id == p.id))
        for p in repository.find_packing_lists()
    ]


def packing_list_details(list_id: int) -> PackingListDetails | None:
    packing_list = repository.find_packing_list(list_id)
    if not packing_list:
        return None
    return PackingListDetails(
        packing_list=packing_list,
        groups=group_items(repository.find_categories(list_id), repository.find_items(list_id)),
    )


def create_packing_list(body: PackingListIn) -> int:
    return repository.insert_packing_list(body.name)


def copy_packing_list(list_id: int, body: PackingListIn) -> int | None:
    """Copy with all categories and items, e.g. to build "Volles Setup" from "Minimales Setup". None if the list does
    not exist."""
    if not repository.find_packing_list(list_id):
        return None
    return repository.copy_packing_list(list_id, body.name)


def save_packing_list(list_id: int, body: PackingListSaveIn) -> PackingListDetails | None:
    """
    Saves name, categories and items in one go and returns the saved list with the IDs of new entries. IDs that do not
    belong to this list (e.g. from another list open in a second tab) are added as new. None if the list does not
    exist.
    """
    if not repository.find_packing_list(list_id):
        return None
    category_ids = {c.id for c in repository.find_categories(list_id)}
    item_ids = {i.id for i in repository.find_items(list_id)}
    seen: set[int] = set()

    def own(items: list[PackingListItemIn]) -> list[PackingListItemIn]:
        result = []
        for item in items:
            # An item sent twice is saved twice, but only the first one keeps the ID
            keep = item.id in item_ids and item.id not in seen
            if keep and item.id is not None:
                seen.add(item.id)
            result.append(item if keep else item.model_copy(update={"id": None}))
        return result

    used_categories: set[int] = set()
    categories = []
    for c in body.categories:
        keep = c.id in category_ids and c.id not in used_categories
        if keep and c.id is not None:
            used_categories.add(c.id)
        categories.append(c.model_copy(update={"id": c.id if keep else None, "items": own(c.items)}))
    repository.save_packing_list(
        list_id, body.model_copy(update={"uncategorized": own(body.uncategorized), "categories": categories})
    )
    return packing_list_details(list_id)


def delete_packing_list(list_id: int) -> None:
    repository.delete_packing_list(list_id)
