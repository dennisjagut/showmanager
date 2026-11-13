"""Database access of the module: the SQL for packing lists, their categories and items."""

from ..core import db
from .models import PackingList, PackingListCategory, PackingListItem
from .schemas import PackingListItemIn, PackingListSaveIn

# --- Packing lists ---------------------------------------------------------------------------------------------------


def find_packing_lists() -> list[PackingList]:
    """All packing lists by name"""
    rows = db.query("select * from packing_lists order by name collate nocase, id")
    return [PackingList.model_validate(r) for r in rows]


def find_packing_list(list_id: int) -> PackingList | None:
    row = db.one("select * from packing_lists where id = ?", (list_id,))
    return PackingList.model_validate(row) if row else None


def insert_packing_list(name: str) -> int:
    with db.write() as w:
        return w.execute("insert into packing_lists (name) values (?)", (name,))


def copy_packing_list(list_id: int, name: str) -> int:
    """New list with the given name and the same categories and items in the same order"""
    with db.write() as w:
        new_id = w.execute("insert into packing_lists (name) values (?)", (name,))
        new_category = {}
        for c in w.query("select * from packing_list_categories where packing_list_id = ?", (list_id,)):
            new_category[c["id"]] = w.execute(
                "insert into packing_list_categories (packing_list_id, name, sort_order) values (?, ?, ?)",
                (new_id, c["name"], c["sort_order"]),
            )
        for i in w.query("select * from packing_list_items where packing_list_id = ?", (list_id,)):
            w.execute(
                """insert into packing_list_items (packing_list_id, category_id, name, quantity, sort_order)
                   values (?, ?, ?, ?, ?)""",
                (new_id, new_category.get(i["category_id"]), i["name"], i["quantity"], i["sort_order"]),
            )
        return new_id


def save_packing_list(list_id: int, body: PackingListSaveIn) -> None:
    """
    Saves the whole list in one transaction. Categories and items with an ID are updated, the others added; whatever is
    no longer in the body is deleted, including the marks of shows for deleted items. The IDs must belong to the list.
    """
    with db.write() as w:
        w.execute("update packing_lists set name = ?, updated_at = datetime('now') where id = ?", (body.name, list_id))
        kept_categories: list[int] = []
        kept_items: list[int] = []

        def save_items(category_id: int | None, items: list[PackingListItemIn]) -> None:
            for index, item in enumerate(items):
                values = (category_id, item.name, item.quantity or 1, (index + 1) * 10)
                if item.id is None:
                    kept_items.append(
                        w.execute(
                            """insert into packing_list_items (category_id, name, quantity, sort_order, packing_list_id)
                               values (?, ?, ?, ?, ?)""",
                            (*values, list_id),
                        )
                    )
                else:
                    w.execute(
                        """update packing_list_items set category_id = ?, name = ?, quantity = ?, sort_order = ?
                           where id = ? and packing_list_id = ?""",
                        (*values, item.id, list_id),
                    )
                    kept_items.append(item.id)

        save_items(None, body.uncategorized)
        for index, category in enumerate(body.categories):
            if category.id is None:
                category_id = w.execute(
                    "insert into packing_list_categories (packing_list_id, name, sort_order) values (?, ?, ?)",
                    (list_id, category.name, (index + 1) * 10),
                )
            else:
                category_id = category.id
                w.execute(
                    "update packing_list_categories set name = ?, sort_order = ? where id = ? and packing_list_id = ?",
                    (category.name, (index + 1) * 10, category_id, list_id),
                )
            kept_categories.append(category_id)
            save_items(category_id, category.items)

        dropped_items = f"select id from packing_list_items where packing_list_id = ? {_not_in(kept_items)}"
        w.execute(f"delete from show_packing_marks where item_id in ({dropped_items})", (list_id, *kept_items))
        w.execute(f"delete from packing_list_items where id in ({dropped_items})", (list_id, *kept_items))
        w.execute(
            f"delete from packing_list_categories where packing_list_id = ? {_not_in(kept_categories)}",
            (list_id, *kept_categories),
        )


def _not_in(ids: list[int]) -> str:
    """Condition "and id not in (…)" with one placeholder per ID; without IDs there is nothing to keep"""
    return f"and id not in ({', '.join('?' * len(ids))})" if ids else ""


def delete_packing_list(list_id: int) -> None:
    """Deletes the list with its categories and items; shows that used it no longer have a packing list"""
    with db.write() as w:
        w.execute(
            """delete from show_packing_marks
               where item_id in (select id from packing_list_items where packing_list_id = ?)""",
            (list_id,),
        )
        w.execute("update shows set packing_list_id = null where packing_list_id = ?", (list_id,))
        w.execute("delete from packing_list_items where packing_list_id = ?", (list_id,))
        w.execute("delete from packing_list_categories where packing_list_id = ?", (list_id,))
        w.execute("delete from packing_lists where id = ?", (list_id,))


# --- Categories and items --------------------------------------------------------------------------------------------


def find_categories(list_id: int | None = None) -> list[PackingListCategory]:
    """Categories of one list, or of all lists without list_id, in the order of the list"""
    if list_id is None:
        rows = db.query("select * from packing_list_categories order by packing_list_id, sort_order, id")
    else:
        rows = db.query(
            "select * from packing_list_categories where packing_list_id = ? order by sort_order, id", (list_id,)
        )
    return [PackingListCategory.model_validate(r) for r in rows]


def find_items(list_id: int | None = None) -> list[PackingListItem]:
    """Items of one list, or of all lists without list_id, in their order within the category"""
    if list_id is None:
        rows = db.query("select * from packing_list_items order by packing_list_id, sort_order, id")
    else:
        rows = db.query(
            "select * from packing_list_items where packing_list_id = ? order by sort_order, id", (list_id,)
        )
    return [PackingListItem.model_validate(r) for r in rows]
