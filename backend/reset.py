"""Deletes ALL tables of the configured database, so the next start of the API sets it up from scratch.

Usage: .venv/bin/python -m backend.reset --yes
"""

import sys

from .core import config


def main() -> None:
    if "--yes" not in sys.argv:
        print(f"This deletes all data in {config.DATABASE_URL}. Run it again with --yes to confirm.")
        sys.exit(1)
    from .core import db

    conn = db._connect()
    # Tables with foreign keys first, so no table is dropped while others still reference it
    rows = conn.execute(
        """select name, (select count(*) from pragma_foreign_key_list(m.name)) as fks
           from sqlite_master m where type = 'table' and name not like 'sqlite_%' order by fks desc"""
    ).fetchall()
    for (name, _) in rows:
        conn.execute(f'drop table if exists "{name}"')
    conn.commit()
    names = ", ".join(name for name, _ in rows)
    print(f"Dropped {names} from {config.DATABASE_URL}" if rows else f"{config.DATABASE_URL} was already empty")


if __name__ == "__main__":
    main()
