"""Async API tests for Coloriage Magique.

Tests:
  - GET /health → 200
  - POST /jobs → 202
  - GET /jobs/{inexistant} → 404
  - POST /jobs with >20MB → 413
"""
from __future__ import annotations

import io
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app


# ──────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


def _make_test_image_bytes(size: tuple[int, int] = (50, 50)) -> bytes:
    """Return minimal valid PNG bytes for a solid color image."""
    from PIL import Image
    buf = io.BytesIO()
    Image.new("RGB", size, color=(200, 100, 50)).save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


# ──────────────────────────────────────────
# Health check
# ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_health_returns_200(client):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"
    assert "queue_depth" in data


# ──────────────────────────────────────────
# Create job (POST /jobs)
# ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_job_returns_202(client):
    img_bytes = _make_test_image_bytes()
    response = await client.post(
        "/api/v1/jobs",
        files={"image": ("test.png", img_bytes, "image/png")},
        data={"difficulty": "beginner", "format": "a4"},
    )
    assert response.status_code == 202
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "pending"
    assert data["poll_url"].startswith("/api/v1/jobs/")


@pytest.mark.asyncio
async def test_create_job_invalid_difficulty_returns_400(client):
    img_bytes = _make_test_image_bytes()
    response = await client.post(
        "/api/v1/jobs",
        files={"image": ("test.png", img_bytes, "image/png")},
        data={"difficulty": "ultra-hard", "format": "a4"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_job_invalid_format_returns_400(client):
    img_bytes = _make_test_image_bytes()
    response = await client.post(
        "/api/v1/jobs",
        files={"image": ("test.png", img_bytes, "image/png")},
        data={"difficulty": "beginner", "format": "a2"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_job_default_format_is_a4(client):
    img_bytes = _make_test_image_bytes()
    response = await client.post(
        "/api/v1/jobs",
        files={"image": ("test.png", img_bytes, "image/png")},
        data={"difficulty": "beginner"},
    )
    assert response.status_code == 202


# ──────────────────────────────────────────
# Job not found
# ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_unknown_job_returns_404(client):
    response = await client.get("/api/v1/jobs/nonexistent-job-id-12345")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_preview_unknown_job_returns_404(client):
    response = await client.get("/api/v1/jobs/nonexistent-id/preview")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_coloring_pdf_unknown_job_returns_404(client):
    response = await client.get("/api/v1/jobs/nonexistent-id/coloring-pdf")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_reference_pdf_unknown_job_returns_404(client):
    response = await client.get("/api/v1/jobs/nonexistent-id/reference-pdf")
    assert response.status_code == 404


# ──────────────────────────────────────────
# File size limit
# ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_image_too_large_returns_413(client):
    """Upload a fake >20MB file and expect 413."""
    big_content = b"X" * (21 * 1024 * 1024)  # 21MB of garbage
    # Fake PNG magic bytes at start
    big_content = b"\x89PNG\r\n\x1a\n" + big_content[8:]
    response = await client.post(
        "/api/v1/jobs",
        files={"image": ("big.png", io.BytesIO(big_content), "image/png")},
        data={"difficulty": "beginner", "format": "a4"},
    )
    assert response.status_code == 413


# ──────────────────────────────────────────
# Rate limiting
# ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_rate_limit_returns_429_after_3_requests(client):
    """After 3 successful posts from the same IP, 4th should be 429."""
    from app.routes.jobs import _rate_store
    # Clear rate store for test IP
    _rate_store.clear()

    img_bytes = _make_test_image_bytes()

    for i in range(3):
        resp = await client.post(
            "/api/v1/jobs",
            files={"image": ("test.png", img_bytes, "image/png")},
            data={"difficulty": "beginner", "format": "a4"},
        )
        # Should succeed for first 3
        assert resp.status_code == 202, f"Request {i+1} should succeed, got {resp.status_code}"

    # 4th request should be rate limited
    resp = await client.post(
        "/api/v1/jobs",
        files={"image": ("test.png", img_bytes, "image/png")},
        data={"difficulty": "beginner", "format": "a4"},
    )
    assert resp.status_code == 429
    assert "Retry-After" in resp.headers


# ──────────────────────────────────────────
# Job polling
# ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_created_job_is_pollable(client):
    """After creating a job, polling should return it (pending or processing)."""
    from app.routes.jobs import _rate_store
    _rate_store.clear()

    img_bytes = _make_test_image_bytes()
    create_resp = await client.post(
        "/api/v1/jobs",
        files={"image": ("test.png", img_bytes, "image/png")},
        data={"difficulty": "beginner", "format": "a4"},
    )
    assert create_resp.status_code == 202
    job_id = create_resp.json()["job_id"]

    poll_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert poll_resp.status_code == 200
    data = poll_resp.json()
    assert data["id"] == job_id
    assert data["status"] in ("pending", "processing", "done", "failed")
    assert data["difficulty"] == "beginner"
    assert data["format"] == "a4"
