# Entry point of the Python function on Vercel: Vercel serves the FastAPI app exported as `app`.
# The code lives in backend/, which is found from the project root.
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.main import app  # noqa: E402

__all__ = ["app"]
