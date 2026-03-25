"""In-memory + filesystem storage for Coloriage Magique jobs.

Jobs are stored:
- In-memory dict for fast lookup (keyed by job_id)
- On disk at /tmp/coloriage-jobs/{job_id}/ for artifacts

TTL: 24 hours. purge_expired() removes stale jobs.
"""
from __future__ import annotations

import logging
import shutil
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Optional

from app.models.job import Difficulty, Format, Job, JobStatus

logger = logging.getLogger(__name__)

_JOBS_BASE = Path("/tmp/coloriage-jobs")
_TTL_HOURS = 24

# Thread-safe in-memory store
_lock = threading.Lock()
_jobs: Dict[str, Job] = {}


# ──────────────────────────────────────────
# Public API
# ──────────────────────────────────────────


def job_dir(job_id: str) -> Path:
    """Return the filesystem directory for a job's artifacts."""
    return _JOBS_BASE / job_id


def create_job(job_id: str, difficulty: Difficulty, fmt: Format) -> Job:
    """Create and store a new job in pending state."""
    now = datetime.now(tz=timezone.utc)
    expires = now + timedelta(hours=_TTL_HOURS)

    job = Job(
        id=job_id,
        status=JobStatus.pending,
        difficulty=difficulty,
        format=fmt,
        created_at=now,
        expires_at=expires,
    )

    # Create job directory
    d = job_dir(job_id)
    d.mkdir(parents=True, exist_ok=True)

    with _lock:
        _jobs[job_id] = job

    logger.debug("Created job %s (difficulty=%s, format=%s)", job_id, difficulty, fmt)
    return job


def get_job(job_id: str) -> Optional[Job]:
    """Retrieve a job by ID. Returns None if not found."""
    with _lock:
        return _jobs.get(job_id)


def update_job(job_id: str, **kwargs) -> Optional[Job]:
    """Update job fields. Returns updated job or None if not found."""
    with _lock:
        job = _jobs.get(job_id)
        if job is None:
            return None
        updated = job.model_copy(update=kwargs)
        _jobs[job_id] = updated
        return updated


def purge_expired() -> int:
    """Remove expired jobs from memory and disk. Returns count removed."""
    now = datetime.now(tz=timezone.utc)
    expired_ids = []

    with _lock:
        for job_id, job in list(_jobs.items()):
            if job.expires_at < now:
                expired_ids.append(job_id)
        for job_id in expired_ids:
            del _jobs[job_id]

    for job_id in expired_ids:
        d = job_dir(job_id)
        if d.exists():
            shutil.rmtree(d, ignore_errors=True)
            logger.debug("Purged job dir: %s", d)

    if expired_ids:
        logger.info("Purged %d expired job(s)", len(expired_ids))

    return len(expired_ids)


def delete_job(job_id: str) -> bool:
    """Delete a job from memory and disk. Returns True if found and deleted."""
    with _lock:
        if job_id not in _jobs:
            return False
        del _jobs[job_id]

    d = job_dir(job_id)
    if d.exists():
        shutil.rmtree(d, ignore_errors=True)
        logger.debug("Deleted job dir: %s", d)

    logger.info("Deleted job %s (RGPD erasure request)", job_id)
    return True


def queue_depth() -> int:
    """Return number of jobs currently pending or processing."""
    with _lock:
        return sum(
            1
            for j in _jobs.values()
            if j.status in (JobStatus.pending, JobStatus.processing)
        )
