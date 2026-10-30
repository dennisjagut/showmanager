"""Settings from environment variables. Locally they come from .env, on Vercel from the project settings."""

import os
from pathlib import Path

# Root of the repository (backend/core/config.py → three levels up)
ROOT = Path(__file__).resolve().parent.parent.parent


def _load_dotenv() -> None:
    # Minimal .env support for local development, values already set in the environment win
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


_load_dotenv()

# Set by Vercel in every deployment
ON_VERCEL = bool(os.environ.get("VERCEL"))

# TURSO_* is set automatically by the Turso integration in the Vercel Marketplace
DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("TURSO_DATABASE_URL") or ""
DATABASE_AUTH_TOKEN = os.environ.get("DATABASE_AUTH_TOKEN") or os.environ.get("TURSO_AUTH_TOKEN") or None

if not DATABASE_URL:
    # The file system on Vercel is ephemeral, a local SQLite file would lose data
    if ON_VERCEL:
        raise RuntimeError("No database configured: on Vercel, DATABASE_URL or TURSO_DATABASE_URL must point to Turso.")
    DATABASE_URL = "file:data/showmanager.db"

# Shows take place in Germany. Vercel runs in UTC, so "today" is computed in this time zone.
TIME_ZONE = "Europe/Berlin"
