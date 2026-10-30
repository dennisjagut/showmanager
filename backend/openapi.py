"""Writes the OpenAPI description of the API, from which `npm run api:types` creates the TypeScript types."""

import json
import sys
from pathlib import Path

from .main import app

if __name__ == "__main__":
    target = Path(sys.argv[1])
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(app.openapi(), indent=2))
