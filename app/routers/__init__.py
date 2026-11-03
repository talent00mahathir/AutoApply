"""Routers package exports."""

from app.routers.auth import router as auth_router
from app.routers.analysis import router as analysis_router
from app.routers.resume import router as resume_router
from app.routers.applications import router as applications_router
from app.routers.dashboard import router as dashboard_router

__all__ = [
    "auth_router",
    "analysis_router",
    "resume_router",
    "applications_router",
    "dashboard_router"
]

