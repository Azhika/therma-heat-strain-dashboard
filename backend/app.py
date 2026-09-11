"""Vercel-compatible FastAPI entrypoint.

The application itself remains in api.py so the local Uvicorn and Render
commands continue to work unchanged.
"""

from api import app

__all__ = ["app"]

