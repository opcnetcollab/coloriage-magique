"""FastAPI application entry point for Coloriage Magique API."""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.jobs import router
from app.services.storage import purge_expired

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

_ENV = os.getenv("APP_ENV", "development").lower()
_IS_PROD = _ENV == "production"

# ── Scheduler ─────────────────────────────────────────────────────────────────
_scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: start/stop APScheduler."""
    _scheduler.add_job(
        purge_expired,
        trigger="interval",
        hours=1,
        id="purge_expired_jobs",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("APScheduler started — purge_expired every 1h")
    yield
    _scheduler.shutdown(wait=False)
    logger.info("APScheduler stopped")


app = FastAPI(
    title="Coloriage Magique API",
    description="Generate numbered coloring pages from photos.",
    version="1.0.0",
    lifespan=lifespan,
    # Disable interactive docs in production (security: no API surface exposure)
    docs_url=None if _IS_PROD else "/docs",
    redoc_url=None if _IS_PROD else "/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Origins via env var for flexibility across environments
_raw_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,https://coloriage-magique.srv1465877.hstgr.cloud",
)
_allow_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    # Restrict to only the HTTP methods actually used by this API
    allow_methods=["GET", "POST", "DELETE"],
    # Restrict to only the headers the frontend sends
    allow_headers=["Content-Type"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(router)
