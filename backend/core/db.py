"""Database access with plain SQL.

Locally the database is a SQLite file (Python's sqlite3), on Vercel a Turso database (the libsql package). Both have
the same interface, so the rest of the code does not need to know which one it talks to.
"""

import sqlite3
import threading
import time
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Any

from . import config
from .migrations import MIGRATIONS

Row = dict[str, Any]

_lock = threading.RLock()
_connection: Any = None
_last_used = 0.0
_migrated = False

# Vercel freezes the function between requests and Turso drops idle connections meanwhile. Reusing such a connection
# fails with "Hrana: http error: connection closed before message completed", so after a pause we open a new one.
MAX_IDLE_SECONDS = 5


def _is_remote() -> bool:
    return not config.DATABASE_URL.startswith("file:")


def _is_connection_error(error: BaseException) -> bool:
    """Network error of the Turso connection (as opposed to an error in the SQL)"""
    return isinstance(error, ValueError) and str(error).startswith("Hrana: `http error")


def _drop_connection() -> None:
    global _connection
    if _connection is not None:
        try:
            _connection.close()
        except Exception:
            pass  # it is broken anyway
        _connection = None


def _connect() -> Any:
    url = config.DATABASE_URL
    if url.startswith("file:"):
        path = Path(url.removeprefix("file:"))
        if not path.is_absolute():
            path = config.ROOT / path
        path.parent.mkdir(parents=True, exist_ok=True)
        return sqlite3.connect(path, check_same_thread=False)
    import libsql  # only needed for Turso

    return libsql.connect(database=url, auth_token=config.DATABASE_AUTH_TOKEN)


@contextmanager
def connection() -> Iterator[Any]:
    """The shared connection. One request at a time uses it; the queries are small, so this is no bottleneck."""
    global _connection, _last_used, _migrated
    with _lock:
        if _connection is not None and _is_remote() and time.time() - _last_used > MAX_IDLE_SECONDS:
            _drop_connection()
        if _connection is None:
            _connection = _connect()
            if not _migrated:
                _migrate(_connection)
                _migrated = True
        try:
            yield _connection
        except BaseException as e:
            if _is_connection_error(e):
                _drop_connection()  # the next use connects again
            raise
        finally:
            _last_used = time.time()


def _rows(cursor: Any) -> list[Row]:
    columns = [c[0] for c in cursor.description or []]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def query(sql: str, params: tuple | list = ()) -> list[Row]:
    try:
        with connection() as conn:
            return _rows(conn.execute(sql, params))
    except ValueError as e:
        if not _is_connection_error(e):
            raise
    # Reading has no side effects, so one more try on a new connection is safe
    with connection() as conn:
        return _rows(conn.execute(sql, params))


def one(sql: str, params: tuple | list = ()) -> Row | None:
    rows = query(sql, params)
    return rows[0] if rows else None


class Writer:
    """Collects writes of one transaction, see `write()`."""

    def __init__(self, conn: Any):
        self._conn = conn

    def execute(self, sql: str, params: tuple | list = ()) -> int | None:
        """Runs a statement and returns the ID of an inserted row"""
        cursor = self._conn.execute(sql, params)
        return cursor.lastrowid

    def query(self, sql: str, params: tuple | list = ()) -> list[Row]:
        return _rows(self._conn.execute(sql, params))


@contextmanager
def write() -> Iterator[Writer]:
    """Everything inside runs in one transaction: either all of it is saved or nothing."""
    with connection() as conn:
        try:
            yield Writer(conn)
            conn.commit()
        except BaseException:
            try:
                conn.rollback()
            except ValueError as e:
                # Without a connection there is nothing to roll back: Turso discards the open transaction itself
                if not _is_connection_error(e):
                    raise
            raise


def _applied(conn: Any) -> set[str]:
    tables = {r["name"] for r in _rows(conn.execute("select name from sqlite_master where type = 'table'"))}
    if "schema_migrations" in tables:
        return {r["name"] for r in _rows(conn.execute("select name from schema_migrations"))}
    if "__drizzle_migrations" in tables:
        # Database set up by the former drizzle-kit setup: its migrations are the first ones in our list
        count = conn.execute("select count(*) from __drizzle_migrations").fetchone()[0]
        return {name for name, _ in MIGRATIONS[:count]}
    return set()


def _migrate(conn: Any) -> None:
    """Applies the migrations that are still missing. Runs once per server instance, before the first query."""
    if all(name in _applied(conn) for name, _ in MIGRATIONS):
        return
    # Write lock, then check again: two instances starting at the same time must not both apply a migration
    conn.execute("begin immediate")
    try:
        applied = _applied(conn)
        conn.execute("create table if not exists schema_migrations (name text primary key, applied_at text not null)")
        for name in applied:
            conn.execute("insert or ignore into schema_migrations values (?, datetime('now'))", (name,))
        for name, statements in MIGRATIONS:
            if name in applied:
                continue
            for statement in statements:
                conn.execute(statement)
            conn.execute("insert into schema_migrations values (?, datetime('now'))", (name,))
        conn.commit()
    except BaseException:
        conn.rollback()
        raise
