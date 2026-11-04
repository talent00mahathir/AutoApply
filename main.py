"""AutoApply - Main FastAPI Application Entrypoint.

Orchestrates Authentication, PDF Ingestion, Multi-Agent Pipeline, Resume PDF Generation,
and Frontend Web Dashboard.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.database.connection import init_db
from app.pipeline.agents import DEFAULT_MODEL
from app.routers import (
    auth_router,
    analysis_router,
    resume_router,
    applications_router,
    dashboard_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context: initialize database tables on startup."""
    init_db()
    yield


app = FastAPI(
    title="AutoApply API",
    description="An Agentic AI Assistant for Job and Internship Applications (Google ADK & FastAPI)",
    version="1.0.0",
    lifespan=lifespan
)

ALLOWED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

import uuid
from starlette.middleware.base import BaseHTTPMiddleware

# CORS Middleware (strict local origins, credential-safe)
# SEC-20: :3000 dev origins stripped automatically when ENV=production.
import os as _os
_ENV = _os.getenv("ENV", "development").lower()
_PROD_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
_ACTIVE_ORIGINS = _PROD_ORIGINS if _ENV == "production" else ALLOWED_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ACTIVE_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "X-Request-ID", "Accept"],
)

# Request ID & Traceability Middleware (BE-3)
# SEC-15: added CSP, Referrer-Policy, Permissions-Policy. HSTS only if HTTPS (no-op on http).
@app.middleware("http")
async def request_trace_middleware(request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        # HOTFIX: index.html uses inline tailwind.config + theme init. Allow inline scripts
        # until those blocks are moved to static/js/*.js files with nonces.
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://fonts.googleapis.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data:; "
        "connect-src 'self'"
    )
    return response

# Global Exception Handler (prevents leaking internal stack traces / SQL errors)
@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    import logging
    logging.getLogger("autoapply").error(f"Unhandled server error at {request.url.path}: {exc}", exc_info=True)
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please check server logs or try again later."}
    )


# Include Routers
app.include_router(auth_router)
app.include_router(analysis_router)
app.include_router(resume_router)
app.include_router(applications_router)
app.include_router(dashboard_router)

# Mount Static Files
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", tags=["Frontend"])
async def serve_frontend():
    """Serve the interactive web frontend dashboard."""
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "service": "AutoApply Backend API",
        "status": "online",
        "docs_url": "/docs"
    }


@app.get("/api/health", tags=["Health Check"])
def health_check():
    """Service status and health check."""
    return {
        "service": "AutoApply Backend API",
        "status": "online",
        "database": "MySQL (autoapply)",
        "active_model": DEFAULT_MODEL,
        "docs_url": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
