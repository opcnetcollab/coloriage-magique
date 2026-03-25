"""Tests for image_processor.py — Hachette numbering, color naming, full pipeline."""
from __future__ import annotations

import numpy as np
import pytest
from pathlib import Path
import tempfile

from app.services.image_processor import (
    get_hachette_symbol,
    process_image,
    _color_name_fr,
)
from app.models.job import Difficulty


# ──────────────────────────────────────────
# Hachette numbering
# ──────────────────────────────────────────


class TestHachetteSymbols:
    def test_index_0_is_one(self):
        assert get_hachette_symbol(0) == "1"

    def test_index_8_is_nine(self):
        assert get_hachette_symbol(8) == "9"

    def test_index_9_is_A(self):
        assert get_hachette_symbol(9) == "A"

    def test_index_34_is_Z(self):
        assert get_hachette_symbol(34) == "Z"

    def test_index_35_is_plus(self):
        assert get_hachette_symbol(35) == "+"

    def test_index_36_is_minus(self):
        assert get_hachette_symbol(36) == "-"

    def test_all_first_nine_are_digits(self):
        for i in range(9):
            assert get_hachette_symbol(i) == str(i + 1)

    def test_all_letters_A_to_Z(self):
        for i in range(26):
            assert get_hachette_symbol(9 + i) == chr(65 + i)

    def test_out_of_range_raises(self):
        with pytest.raises(ValueError):
            get_hachette_symbol(-1)
        with pytest.raises(ValueError):
            get_hachette_symbol(100)


# ──────────────────────────────────────────
# Color naming
# ──────────────────────────────────────────


class TestColorNames:
    def test_black(self):
        assert _color_name_fr((10, 10, 10)) == "Noir"

    def test_white(self):
        assert _color_name_fr((240, 240, 240)) == "Blanc"

    def test_red(self):
        name = _color_name_fr((220, 20, 20))
        assert "Rouge" in name

    def test_green(self):
        name = _color_name_fr((20, 180, 20))
        assert "Vert" in name

    def test_blue(self):
        name = _color_name_fr((20, 20, 200))
        assert "Bleu" in name

    def test_yellow(self):
        name = _color_name_fr((240, 230, 30))
        assert "Jaune" in name

    def test_orange(self):
        name = _color_name_fr((230, 120, 10))
        assert "Orange" in name

    def test_gray(self):
        name = _color_name_fr((128, 128, 128))
        assert "Gris" in name

    def test_returns_string(self):
        for r in range(0, 256, 32):
            for g in range(0, 256, 32):
                for b in range(0, 256, 32):
                    name = _color_name_fr((r, g, b))
                    assert isinstance(name, str)
                    assert len(name) > 0


# ──────────────────────────────────────────
# Full pipeline test
# ──────────────────────────────────────────


class TestProcessImage:
    def _make_synthetic_image(self, path: Path) -> None:
        """Create a 100×100 test image with solid color blocks."""
        from PIL import Image
        img = Image.new("RGB", (100, 100), color=(200, 100, 50))
        # Add some color variety
        for x in range(25, 75):
            for y in range(25, 75):
                img.putpixel((x, y), (50, 150, 200))
        for x in range(0, 25):
            for y in range(0, 25):
                img.putpixel((x, y), (240, 240, 30))
        img.save(str(path))

    def test_process_beginner(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            img_path = tmpdir / "test.png"
            self._make_synthetic_image(img_path)

            legend = process_image(img_path, tmpdir / "out", Difficulty.beginner)

            assert len(legend) == 6
            assert (tmpdir / "out" / "labels.npy").exists()
            assert (tmpdir / "out" / "edges.npy").exists()
            assert (tmpdir / "out" / "coloring.png").exists()
            assert (tmpdir / "out" / "reference.png").exists()

    def test_process_intermediate(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            img_path = tmpdir / "test.jpg"
            self._make_synthetic_image(img_path)
            legend = process_image(img_path, tmpdir / "out", Difficulty.intermediate)
            assert len(legend) == 11

    def test_process_expert(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            img_path = tmpdir / "test.png"
            self._make_synthetic_image(img_path)
            legend = process_image(img_path, tmpdir / "out", Difficulty.expert)
            assert len(legend) == 19

    def test_legend_has_correct_fields(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            img_path = tmpdir / "test.png"
            self._make_synthetic_image(img_path)
            legend = process_image(img_path, tmpdir / "out", Difficulty.beginner)

            for entry in legend:
                assert entry.symbol in "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-×÷=%&@#!?~^*§"
                assert entry.hex.startswith("#")
                assert len(entry.hex) == 7
                assert isinstance(entry.name, str)
                assert len(entry.name) > 0

    def test_labels_shape_matches_image(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            img_path = tmpdir / "test.png"
            self._make_synthetic_image(img_path)
            process_image(img_path, tmpdir / "out", Difficulty.beginner)

            labels = np.load(tmpdir / "out" / "labels.npy")
            assert labels.shape == (100, 100)

    def test_coloring_is_white_with_edges(self):
        """Coloring image must be mostly white (background)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            img_path = tmpdir / "test.png"
            self._make_synthetic_image(img_path)
            process_image(img_path, tmpdir / "out", Difficulty.beginner)

            from PIL import Image
            coloring = np.array(Image.open(tmpdir / "out" / "coloring.png"))
            # Most pixels should be white or black
            whites = np.all(coloring == 255, axis=-1).sum()
            blacks = np.all(coloring == 0, axis=-1).sum()
            total = 100 * 100
            assert whites + blacks > total * 0.7, "Coloring page should be mostly white/black"

    def test_hachette_symbols_assigned_sequentially(self):
        """First color zone gets symbol '1', second gets '2', etc."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            img_path = tmpdir / "test.png"
            self._make_synthetic_image(img_path)
            legend = process_image(img_path, tmpdir / "out", Difficulty.beginner)

            expected_symbols = ["1", "2", "3", "4", "5", "6"]
            actual_symbols = [e.symbol for e in legend]
            assert actual_symbols == expected_symbols
