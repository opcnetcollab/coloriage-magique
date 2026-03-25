"""FastAPI routes for Coloriage Magique jobs.

Prefix: /api/v1

Routes:
  POST   /jobs                       — Upload image + create job
  GET    /jobs/{job_id}              — Poll job status
  DELETE /jobs/{job_id}              — Delete job (RGPD Art. 17)
  GET    /jobs/{job_id}/preview      — PNG preview 800px
  GET    /jobs/{job_id}/coloring-pdf — Printable coloring PDF
  GET    /jobs/{job_id}/reference-pdf — Reference color PDF
  GET    /health                     — Health check
"""
from __future__ import annotations

import asyncio
import concurrent.futures
import logging
import time
import uuid
from collections import defaultdict
from pathlib import Path
from typing import Dict, List

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse

from app.models.job import Difficulty, Format, Job, JobCreateResponse, JobStatus
from app.services import image_processor, pdf_generator, storage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1")

MAX_IMAGE_SIZE = 20 * 1024 * 1024  # 20 MB
RATE_LIMIT_PER_HOUR = 3
PROCESSING_TIMEOUT_S = 120
API_VERSION = "1.0.0"

# Thread pool for CPU-bound processing
_executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

# Simple in-memory rate limiter: {ip: [timestamp, ...]}
# ⚠ Keyed on direct TCP peer IP only — not on forwarded headers (C1)
_rate_store: Dict[str, List[float]] = defaultdict(list)


# ──────────────────────────────────────────
# Health
# ──────────────────────────────────────────


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "version": API_VERSION,
        "queue_depth": storage.queue_depth(),
    }


# ──────────────────────────────────────────
# Create job
# ──────────────────────────────────────────


@router.post("/jobs", status_code=202)
async def create_job(
    request: Request,
    background_tasks: BackgroundTasks,
    image: UploadFile,
    difficulty: str = "beginner",
    format: str = "a4",
):
    # ── Validate difficulty & format ──────────────────────────────────
    try:
        diff = Difficulty(difficulty)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid difficulty: {difficulty}. Must be beginner|intermediate|expert",
        )

    try:
        fmt = Format(format)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format: {format}. Must be a4|a3",
        )

    # ── Rate limiting by direct TCP peer IP only (C1 — no X-Forwarded-For) ──
    client_ip = _get_client_ip(request)
    _check_rate_limit(client_ip)

    # ── Streaming read with size guard (C3) ───────────────────────────
    content = await _read_upload_streaming(image)

    # ── Validate magic bytes ──────────────────────────────────────────
    _validate_image_format(content, image.filename or "")

    # ── Create job ────────────────────────────────────────────────────
    job_id = str(uuid.uuid4())
    job = storage.create_job(job_id, diff, fmt)

    raw_path = storage.job_dir(job_id) / f"upload{_guess_ext(image.filename or '')}"
    raw_path.write_bytes(content)

    # ── Schedule background processing ───────────────────────────────
    background_tasks.add_task(_process_job, job_id, str(raw_path), diff, fmt)

    return JobCreateResponse(
        job_id=job_id,
        status=JobStatus.pending,
        poll_url=f"/api/v1/jobs/{job_id}",
    )


# ──────────────────────────────────────────
# Poll status
# ──────────────────────────────────────────


@router.get("/jobs/{job_id}", response_model=Job)
async def get_job(job_id: str):
    job = storage.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


# ──────────────────────────────────────────
# Delete job (RGPD Art. 17)
# ──────────────────────────────────────────


@router.delete("/jobs/{job_id}", status_code=204)
async def delete_job(job_id: str):
    """Delete a job and all its artefacts (right to erasure — RGPD Art. 17)."""
    job = storage.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    storage.delete_job(job_id)


# ──────────────────────────────────────────
# File downloads
# ──────────────────────────────────────────


@router.get("/jobs/{job_id}/preview")
async def get_preview(job_id: str):
    _get_done_job(job_id)
    preview_path = storage.job_dir(job_id) / "preview.png"
    if not preview_path.exists():
        raise HTTPException(status_code=404, detail="Preview not yet available")
    return FileResponse(str(preview_path), media_type="image/png")


@router.get("/jobs/{job_id}/coloring-pdf")
async def get_coloring_pdf(job_id: str):
    _get_done_job(job_id)
    pdf_path = storage.job_dir(job_id) / "coloring.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF not yet available")
    return FileResponse(
        str(pdf_path),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="coloriage.pdf"'},
    )


@router.get("/jobs/{job_id}/reference-pdf")
async def get_reference_pdf(job_id: str):
    _get_done_job(job_id)
    pdf_path = storage.job_dir(job_id) / "reference.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF not yet available")
    return FileResponse(
        str(pdf_path),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="reference.pdf"'},
    )


# ──────────────────────────────────────────
# Background processing task  (C2 — timeout)
# ──────────────────────────────────────────


async def _process_job(
    job_id: str, image_path: str, difficulty: Difficulty, fmt: Format
) -> None:
    """Async wrapper around the CPU-bound pipeline with a hard timeout (C2)."""
    logger.info(
        "Processing job %s (difficulty=%s, format=%s)", job_id, difficulty, fmt
    )
    storage.update_job(job_id, status=JobStatus.processing)

    loop = asyncio.get_event_loop()
    try:
        await asyncio.wait_for(
            loop.run_in_executor(
                _executor,
                _sync_pipeline,
                job_id,
                image_path,
                difficulty,
                fmt,
            ),
            timeout=float(PROCESSING_TIMEOUT_S),
        )
    except asyncio.TimeoutError:
        logger.error("Job %s timed out after %ds", job_id, PROCESSING_TIMEOUT_S)
        storage.update_job(
            job_id,
            status=JobStatus.failed,
            error="Traitement trop long (timeout 2min)",
        )


def _sync_pipeline(
    job_id: str, image_path: str, difficulty: Difficulty, fmt: Format
) -> None:
    """Synchronous CPU-bound pipeline — runs inside a ThreadPoolExecutor."""
    start_ms = time.time()

    try:
        job_d = storage.job_dir(job_id)

        # Image processing
        color_legend = image_processor.process_image(image_path, job_d, difficulty)

        # Preview
        image_processor.generate_preview(job_d / "coloring.png", job_d / "preview.png")

        # PDFs
        pdf_generator.generate_coloring_pdf(
            label_map_path=job_d / "labels.npy",
            edges_path=job_d / "edges.npy",
            legend=color_legend,
            fmt=fmt,
            output_path=job_d / "coloring.pdf",
        )
        pdf_generator.generate_reference_pdf(
            reference_img_path=job_d / "reference.png",
            legend=color_legend,
            fmt=fmt,
            output_path=job_d / "reference.pdf",
        )

        processing_ms = int((time.time() - start_ms) * 1000)

        storage.update_job(
            job_id,
            status=JobStatus.done,
            color_count=len(color_legend),
            color_legend=color_legend,
            preview_url=f"/api/v1/jobs/{job_id}/preview",
            coloring_pdf_url=f"/api/v1/jobs/{job_id}/coloring-pdf",
            reference_pdf_url=f"/api/v1/jobs/{job_id}/reference-pdf",
            processing_ms=processing_ms,
        )
        logger.info("Job %s done in %dms", job_id, processing_ms)

    except Exception as exc:
        logger.exception("Job %s failed: %s", job_id, exc)
        storage.update_job(job_id, status=JobStatus.failed, error=str(exc))


# ──────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────


def _get_done_job(job_id: str) -> Job:
    job = storage.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != JobStatus.done:
        raise HTTPException(
            status_code=409,
            detail=f"Job is not done yet (status={job.status})",
        )
    return job


def _get_client_ip(request: Request) -> str:
    """Return the direct TCP peer IP — never trust X-Forwarded-For (C1).

    This prevents rate-limit bypass via header spoofing.
    If a trusted reverse-proxy layer is required, add a TrustedHostMiddleware
    and explicitly extract the proxy-verified IP from request.state instead.
    """
    if request.client:
        return request.client.host
    return "unknown"


def _check_rate_limit(ip: str) -> None:
    now = time.time()
    window_start = now - 3600  # 1-hour sliding window
    timestamps = [t for t in _rate_store[ip] if t > window_start]
    _rate_store[ip] = timestamps

    remaining = RATE_LIMIT_PER_HOUR - len(timestamps)

    if remaining <= 0:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Maximum 3 jobs per hour.",
            headers={
                "X-RateLimit-Remaining": "0",
                "Retry-After": "3600",
            },
        )

    _rate_store[ip].append(now)


async def _read_upload_streaming(image: UploadFile) -> bytes:
    """Stream-read the upload, rejecting oversized files before buffering (C3).

    Raises HTTP 413 as soon as the cumulative size exceeds MAX_IMAGE_SIZE,
    without first loading the whole file into memory.
    """
    chunks: List[bytes] = []
    size = 0
    async for chunk in image.stream():
        size += len(chunk)
        if size > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Image trop grande (max 20MB)",
            )
        chunks.append(chunk)
    return b"".join(chunks)


def _validate_image_format(content: bytes, filename: str) -> None:
    """Check magic bytes for supported image formats."""
    if len(content) < 12:
        raise HTTPException(status_code=422, detail="File too small or corrupted")

    magic = content[:12]

    is_jpeg = magic[:3] == b"\xff\xd8\xff"
    is_png = magic[:4] == b"\x89PNG"
    is_webp = magic[:4] == b"RIFF" and magic[8:12] == b"WEBP"
    is_heic = _is_heic(content)

    if not any([is_jpeg, is_png, is_webp, is_heic]):
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format. Accepted: JPEG, PNG, WEBP, HEIC",
        )


def _is_heic(content: bytes) -> bool:
    """Detect HEIC/HEIF via ftyp box."""
    if len(content) < 12:
        return False
    ftyp = content[4:8]
    brand = content[8:12]
    return ftyp == b"ftyp" and brand in (b"heic", b"heis", b"hevc", b"mif1", b"msf1")


def _guess_ext(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    return ext if ext in (".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif") else ".jpg"
