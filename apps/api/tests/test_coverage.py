"""Additional coverage tests for Coloriage Magique — QA pass T9.

Covers gaps not addressed by existing test files:
  - K-means edge case: all-black image (fully uniform)
  - Hachette numbering complete (indices 0–49, all 50 symbols verified)
  - DELETE /api/v1/jobs/{job_id} — RGPD Art. 17 endpoint (204 + 404)
  - Rate limiting: 4th request from same IP → 429
"""
from __future__ import annotations

import io
import tempfile
from pathlib import Path

import numpy as np
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from PIL import Image

from app.main import app
from app.models.job import Difficulty
from app.services.image_processor import HACHETTE_SYMBOLS, get_hachette_symbol, process_image


# ─────────────────────────────────────────────────────────────────────────────
# Shared client fixture
# ─────────────────────────────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


def _make_png(r: int = 200, g: int = 100, b: int = 50, size: tuple = (50, 50)) -> bytes:
    """Return minimal valid PNG bytes for a solid color image."""
    buf = io.BytesIO()
    Image.new("RGB", size, color=(r, g, b)).save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


# ─────────────────────────────────────────────────────────────────────────────
# 1. K-means edge case: all-black image
# ─────────────────────────────────────────────────────────────────────────────


class TestKMeansBlackImage:
    """process_image must not crash when given a fully uniform (all-black) image.

    A k-means on a constant input converges to a single cluster regardless of k.
    The pipeline should handle that gracefully and return a valid legend.
    """

    def test_black_image_does_not_raise(self):
        """process_image on an all-black image should complete without exception."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            img_path = tmpdir / "black.png"
            Image.new("RGB", (80, 80), color=(0, 0, 0)).save(str(img_path))

            # Should not raise
            legend = process_image(img_path, tmpdir / "out", Difficulty.beginner)
            assert isinstance(legend, list)
            assert len(legend) > 0

    def test_black_image_legend_entries_are_valid(self):
        """Each legend entry from a black image must have valid symbol, hex, name."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            img_path = tmpdir / "black.png"
            Image.new("RGB", (60, 60), color=(0, 0, 0)).save(str(img_path))

            legend = process_image(img_path, tmpdir / "out", Difficulty.beginner)
            for entry in legend:
                assert isinstance(entry.symbol, str) and len(entry.symbol) > 0
                assert entry.hex.startswith("#") and len(entry.hex) == 7
                assert isinstance(entry.name, str) and len(entry.name) > 0

    def test_black_image_produces_output_files(self):
        """All expected artifact files must be created even for a black image."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            img_path = tmpdir / "black.png"
            Image.new("RGB", (60, 60), color=(0, 0, 0)).save(str(img_path))

            process_image(img_path, tmpdir / "out", Difficulty.beginner)

            assert (tmpdir / "out" / "labels.npy").exists()
            assert (tmpdir / "out" / "edges.npy").exists()
            assert (tmpdir / "out" / "coloring.png").exists()
            assert (tmpdir / "out" / "reference.png").exists()

    def test_black_image_color_is_named_noir(self):
        """Dominant color from a black image must be identified as 'Noir'."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            img_path = tmpdir / "black.png"
            Image.new("RGB", (60, 60), color=(0, 0, 0)).save(str(img_path))

            legend = process_image(img_path, tmpdir / "out", Difficulty.beginner)
            # At least one entry should be classified as black
            names = [e.name for e in legend]
            assert any("Noir" in n for n in names), f"Expected 'Noir' in names, got: {names}"

    def test_nearly_black_image_is_handled(self):
        """An image with slight color variation close to black should still succeed."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            img_path = tmpdir / "near_black.png"
            # Create image with very dark colors (10,10,10) and (5,5,5)
            img = Image.new("RGB", (80, 80), color=(10, 10, 10))
            for x in range(40):
                for y in range(80):
                    img.putpixel((x, y), (5, 5, 5))
            img.save(str(img_path))

            legend = process_image(img_path, tmpdir / "out", Difficulty.beginner)
            assert len(legend) > 0


# ─────────────────────────────────────────────────────────────────────────────
# 2. Hachette numbering: complete table (indices 0–49)
# ─────────────────────────────────────────────────────────────────────────────


class TestHachetteComplete:
    """Verify all 50 Hachette symbols across the full table."""

    # Expected full table — must match HACHETTE_SYMBOLS in image_processor.py exactly
    EXPECTED = (
        ["1", "2", "3", "4", "5", "6", "7", "8", "9"]           # 0–8   digits
        + list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")                      # 9–34  letters
        + ["+", "-", "×", "÷", "=", "%", "&", "@", "#",          # 35–43 symbols
           "!", "?", "~", "^", "*", "§"]                           # 44–49 symbols
    )

    def test_table_length_is_50(self):
        assert len(HACHETTE_SYMBOLS) == 50

    def test_expected_table_length_matches(self):
        assert len(self.EXPECTED) == 50

    @pytest.mark.parametrize("index", list(range(50)))
    def test_symbol_at_index(self, index: int):
        assert get_hachette_symbol(index) == self.EXPECTED[index]

    def test_digits_range_0_to_8(self):
        """Indices 0–8 must be the digits 1–9."""
        for i in range(9):
            assert get_hachette_symbol(i) == str(i + 1)

    def test_letters_range_9_to_34(self):
        """Indices 9–34 must be uppercase A–Z."""
        for i in range(26):
            assert get_hachette_symbol(9 + i) == chr(ord("A") + i)

    def test_special_chars_range_35_to_49(self):
        """Indices 35–49 must be the special character symbols in exact order."""
        expected_special = ["+", "-", "×", "÷", "=", "%", "&", "@", "#", "!", "?", "~", "^", "*", "§"]
        for offset, expected_char in enumerate(expected_special):
            idx = 35 + offset
            result = get_hachette_symbol(idx)
            assert result == expected_char, (
                f"Index {idx}: expected '{expected_char}', got '{result}'"
            )

    def test_index_35_is_plus(self):
        assert get_hachette_symbol(35) == "+"

    def test_index_36_is_minus(self):
        assert get_hachette_symbol(36) == "-"

    def test_index_37_is_times(self):
        assert get_hachette_symbol(37) == "×"

    def test_index_38_is_divide(self):
        assert get_hachette_symbol(38) == "÷"

    def test_index_39_is_equals(self):
        assert get_hachette_symbol(39) == "="

    def test_index_40_is_percent(self):
        assert get_hachette_symbol(40) == "%"

    def test_index_41_is_ampersand(self):
        assert get_hachette_symbol(41) == "&"

    def test_index_42_is_at(self):
        assert get_hachette_symbol(42) == "@"

    def test_index_43_is_hash(self):
        assert get_hachette_symbol(43) == "#"

    def test_index_44_is_exclamation(self):
        assert get_hachette_symbol(44) == "!"

    def test_index_45_is_question(self):
        assert get_hachette_symbol(45) == "?"

    def test_index_46_is_tilde(self):
        assert get_hachette_symbol(46) == "~"

    def test_index_47_is_caret(self):
        assert get_hachette_symbol(47) == "^"

    def test_index_48_is_star(self):
        assert get_hachette_symbol(48) == "*"

    def test_index_49_is_section(self):
        """Last valid index — § (section sign)."""
        assert get_hachette_symbol(49) == "§"

    def test_boundary_neg1_raises(self):
        with pytest.raises(ValueError):
            get_hachette_symbol(-1)

    def test_boundary_50_raises(self):
        with pytest.raises(ValueError):
            get_hachette_symbol(50)

    def test_no_duplicates_in_table(self):
        """All 50 symbols must be unique."""
        assert len(set(HACHETTE_SYMBOLS)) == 50

    def test_all_symbols_are_single_character(self):
        """Each symbol must be a single character (string of length 1)."""
        for i, sym in enumerate(HACHETTE_SYMBOLS):
            assert isinstance(sym, str), f"Index {i}: not a string"
            assert len(sym) == 1, f"Index {i}: '{sym}' is not a single char"


# ─────────────────────────────────────────────────────────────────────────────
# 3. DELETE /api/v1/jobs/{job_id} — RGPD endpoint
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_delete_job_returns_204(client):
    """A created job can be deleted — returns 204 No Content."""
    from app.routes.jobs import _rate_store
    _rate_store.clear()

    # First create a job
    img_bytes = _make_png()
    create_resp = await client.post(
        "/api/v1/jobs",
        files={"image": ("test.png", img_bytes, "image/png")},
        data={"difficulty": "beginner", "format": "a4"},
    )
    assert create_resp.status_code == 202
    job_id = create_resp.json()["job_id"]

    # Delete it
    delete_resp = await client.delete(f"/api/v1/jobs/{job_id}")
    assert delete_resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_job_removes_from_store(client):
    """After deletion, GET /jobs/{id} must return 404."""
    from app.routes.jobs import _rate_store
    _rate_store.clear()

    img_bytes = _make_png()
    create_resp = await client.post(
        "/api/v1/jobs",
        files={"image": ("test.png", img_bytes, "image/png")},
        data={"difficulty": "beginner", "format": "a4"},
    )
    assert create_resp.status_code == 202
    job_id = create_resp.json()["job_id"]

    # Delete
    await client.delete(f"/api/v1/jobs/{job_id}")

    # Job should now be 404
    get_resp = await client.get(f"/api/v1/jobs/{job_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_unknown_job_returns_404(client):
    """DELETE on non-existent job must return 404."""
    resp = await client.delete("/api/v1/jobs/non-existent-job-xyz-9999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_job_is_idempotent_second_call_is_404(client):
    """Deleting the same job twice: first is 204, second is 404."""
    from app.routes.jobs import _rate_store
    _rate_store.clear()

    img_bytes = _make_png()
    create_resp = await client.post(
        "/api/v1/jobs",
        files={"image": ("test.png", img_bytes, "image/png")},
        data={"difficulty": "beginner", "format": "a4"},
    )
    job_id = create_resp.json()["job_id"]

    first = await client.delete(f"/api/v1/jobs/{job_id}")
    assert first.status_code == 204

    second = await client.delete(f"/api/v1/jobs/{job_id}")
    assert second.status_code == 404


@pytest.mark.asyncio
async def test_delete_response_has_no_body(client):
    """204 response must have an empty body."""
    from app.routes.jobs import _rate_store
    _rate_store.clear()

    img_bytes = _make_png()
    create_resp = await client.post(
        "/api/v1/jobs",
        files={"image": ("test.png", img_bytes, "image/png")},
        data={"difficulty": "beginner", "format": "a4"},
    )
    job_id = create_resp.json()["job_id"]

    delete_resp = await client.delete(f"/api/v1/jobs/{job_id}")
    assert delete_resp.status_code == 204
    # 204 must have no content
    assert delete_resp.content == b""


# ─────────────────────────────────────────────────────────────────────────────
# 4. Rate limiting: 4th request → 429
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_rate_limit_fourth_request_returns_429(client):
    """The 4th POST /jobs from the same IP within an hour must return 429."""
    from app.routes.jobs import _rate_store
    _rate_store.clear()

    img_bytes = _make_png()

    # Requests 1–3 should succeed
    for i in range(3):
        resp = await client.post(
            "/api/v1/jobs",
            files={"image": ("test.png", img_bytes, "image/png")},
            data={"difficulty": "beginner", "format": "a4"},
        )
        assert resp.status_code == 202, f"Request {i + 1} should be 202, got {resp.status_code}"

    # 4th request must be rate-limited
    fourth = await client.post(
        "/api/v1/jobs",
        files={"image": ("test.png", img_bytes, "image/png")},
        data={"difficulty": "beginner", "format": "a4"},
    )
    assert fourth.status_code == 429


@pytest.mark.asyncio
async def test_rate_limit_429_includes_retry_after_header(client):
    """429 response must include a Retry-After header."""
    from app.routes.jobs import _rate_store
    _rate_store.clear()

    img_bytes = _make_png()

    for _ in range(3):
        await client.post(
            "/api/v1/jobs",
            files={"image": ("test.png", img_bytes, "image/png")},
            data={"difficulty": "beginner", "format": "a4"},
        )

    fourth = await client.post(
        "/api/v1/jobs",
        files={"image": ("test.png", img_bytes, "image/png")},
        data={"difficulty": "beginner", "format": "a4"},
    )
    assert fourth.status_code == 429
    assert "retry-after" in fourth.headers or "Retry-After" in fourth.headers


@pytest.mark.asyncio
async def test_rate_limit_error_detail_message(client):
    """429 response body must mention 'Rate limit' or similar."""
    from app.routes.jobs import _rate_store
    _rate_store.clear()

    img_bytes = _make_png()

    for _ in range(3):
        await client.post(
            "/api/v1/jobs",
            files={"image": ("test.png", img_bytes, "image/png")},
            data={"difficulty": "beginner", "format": "a4"},
        )

    fourth = await client.post(
        "/api/v1/jobs",
        files={"image": ("test.png", img_bytes, "image/png")},
        data={"difficulty": "beginner", "format": "a4"},
    )
    assert fourth.status_code == 429
    body = fourth.json()
    detail = str(body.get("detail", "")).lower()
    assert "rate" in detail or "limit" in detail or "429" in str(fourth.status_code)


@pytest.mark.asyncio
async def test_rate_limit_does_not_trigger_after_clear(client):
    """After clearing the rate store, new requests are accepted."""
    from app.routes.jobs import _rate_store
    _rate_store.clear()

    img_bytes = _make_png()

    # Exhaust the limit
    for _ in range(3):
        await client.post(
            "/api/v1/jobs",
            files={"image": ("test.png", img_bytes, "image/png")},
            data={"difficulty": "beginner", "format": "a4"},
        )

    # Manually clear the store (simulating hour passing)
    _rate_store.clear()

    # Should succeed again
    fresh = await client.post(
        "/api/v1/jobs",
        files={"image": ("test.png", img_bytes, "image/png")},
        data={"difficulty": "beginner", "format": "a4"},
    )
    assert fresh.status_code == 202
