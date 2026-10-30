"""Database access of the module: the SQL for the tables festivals and applications."""

from ..core import db
from .models import Application, ApplicationStatus, Festival

FESTIVAL_FIELDS = ["name", "location", "state", "month", "website", "deadline", "contact", "notes", "active"]


def _application_of(row: db.Row) -> Application | None:
    # Columns of the joined application carry the prefix a_
    if row.get("a_id") is None:
        return None
    return Application(
        id=row["a_id"],
        festival_id=row["id"],
        season=row["a_season"],
        status=row["a_status"],
        applied_on=row["a_applied_on"],
        note=row["a_note"],
        updated_at=row["a_updated_at"],
    )


def find_all_with_application(season: int) -> list[tuple[Festival, Application | None]]:
    """All festivals by name, each with its application in the season (or None)"""
    rows = db.query(
        """select f.*, a.id a_id, a.season a_season, a.status a_status, a.applied_on a_applied_on, a.note a_note,
                  a.updated_at a_updated_at
           from festivals f left join applications a on a.festival_id = f.id and a.season = ?
           order by f.name collate nocase""",
        (season,),
    )
    return [(Festival.model_validate(r), _application_of(r)) for r in rows]


def find_by_id(festival_id: int) -> Festival | None:
    row = db.one("select * from festivals where id = ?", (festival_id,))
    return Festival.model_validate(row) if row else None


def find_applications(festival_id: int) -> list[Application]:
    """All applications of a festival, newest season first"""
    rows = db.query("select * from applications where festival_id = ? order by season desc", (festival_id,))
    return [Application.model_validate(r) for r in rows]


def find_seasons() -> set[int]:
    """Seasons that have at least one application"""
    return {r["season"] for r in db.query("select distinct season from applications")}


def find_states() -> list[str]:
    return [r["state"] for r in db.query("select distinct state from festivals where state is not null order by state")]


def insert(values: dict[str, object]) -> int:
    with db.write() as w:
        return w.execute(
            f"insert into festivals ({', '.join(FESTIVAL_FIELDS)}) values ({', '.join('?' * len(FESTIVAL_FIELDS))})",
            [values[k] for k in FESTIVAL_FIELDS],
        )


def update(festival_id: int, values: dict[str, object]) -> None:
    with db.write() as w:
        w.execute(
            f"update festivals set {', '.join(f'{k} = ?' for k in FESTIVAL_FIELDS)}, updated_at = datetime('now') "
            "where id = ?",
            [*(values[k] for k in FESTIVAL_FIELDS), festival_id],
        )


def delete(festival_id: int) -> None:
    """Deletes the festival with all its applications"""
    with db.write() as w:
        w.execute("delete from applications where festival_id = ?", (festival_id,))
        w.execute("delete from festivals where id = ?", (festival_id,))


def save_application(
    festival_id: int, season: int, status: ApplicationStatus, applied_on: str | None, note: str | None
) -> None:
    """Creates the application of the season or overwrites it"""
    with db.write() as w:
        w.execute(
            """insert into applications (festival_id, season, status, applied_on, note) values (?, ?, ?, ?, ?)
               on conflict (festival_id, season) do update set
                 status = excluded.status, applied_on = excluded.applied_on, note = excluded.note,
                 updated_at = datetime('now')""",
            (festival_id, season, status, applied_on, note),
        )


def save_status(festival_id: int, season: int, status: ApplicationStatus, applied_on: str | None) -> None:
    """Sets the status of the season; an existing date is kept, applied_on only fills an empty one"""
    with db.write() as w:
        w.execute(
            """insert into applications (festival_id, season, status, applied_on) values (?, ?, ?, ?)
               on conflict (festival_id, season) do update set
                 status = excluded.status, applied_on = coalesce(applications.applied_on, excluded.applied_on),
                 updated_at = datetime('now')""",
            (festival_id, season, status, applied_on),
        )


def delete_application(festival_id: int, season: int) -> None:
    with db.write() as w:
        w.execute("delete from applications where festival_id = ? and season = ?", (festival_id, season))
