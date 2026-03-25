"""PDF generation for Coloriage Magique.

Two PDFs per job:
  coloring.pdf   — white background + black edges + colour legend (printable)
  reference.pdf  — quantised colour image + colour legend
"""
from __future__ import annotations

import io
from pathlib import Path
from typing import List, Union

import numpy as np
from PIL import Image
from reportlab.lib.colors import HexColor, black, Color
from reportlab.lib.pagesizes import A4, A3
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas as rl_canvas

from app.models.job import ColorLegendEntry, Format

# ── Constants ─────────────────────────────────────────────────────────────────
PAGE_SIZES = {"a4": A4, "a3": A3}
LEGEND_HEIGHT = 70   # pt  — reserved at bottom of page
SWATCH_SIZE = 22     # pt  — coloured square side
SWATCH_GAP = 3       # pt  — gap between swatches
MARGIN = 30          # pt  — page margin (left/right/top)

# Hatching patterns for monochrome-accessible swatches (alternating)
_HATCH_PATTERNS = ["///", "---", "XXX", "|||", "+++", "\\\\\\"]


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────


def generate_coloring_pdf(
    label_map_path: Union[str, Path],
    edges_path: Union[str, Path],
    legend: List[ColorLegendEntry],
    fmt: Union[Format, str],
    output_path: Union[str, Path],
) -> None:
    """Generate the printable B&W coloring PDF.

    Renders the Canny edges on a white background and appends a colour
    legend (numbered swatches) at the bottom.

    Parameters
    ----------
    label_map_path:
        Path to labels.npy (H×W int32 cluster-index array). Reserved for
        future zone-numbering overlay; not used in current rendering.
    edges_path:
        Path to edges.npy (H×W uint8, non-zero = edge pixel).
    legend:
        List of ColorLegendEntry produced by image_processor.
    fmt:
        Page format ("a4" or "a3", or Format enum).
    output_path:
        Where to write the PDF file.
    """
    fmt_key = fmt.value if hasattr(fmt, "value") else str(fmt)
    page_size = PAGE_SIZES[fmt_key]
    page_w, page_h = page_size

    edges = np.load(str(edges_path))

    # Build B&W coloring image: white background + black edges
    h_px, w_px = edges.shape
    coloring_arr = np.full((h_px, w_px, 3), 255, dtype=np.uint8)
    coloring_arr[edges > 0] = 0
    coloring_img = Image.fromarray(coloring_arr, "RGB")

    c = rl_canvas.Canvas(str(output_path), pagesize=page_size)

    # ── Draw image ────────────────────────────────────────────────────────────
    legend_area_h = LEGEND_HEIGHT if legend else 0
    img_x, img_y, img_w, img_h = _image_bounds(
        w_px, h_px, page_w, page_h, legend_area_h
    )
    c.drawImage(
        ImageReader(coloring_img),
        img_x,
        img_y,
        width=img_w,
        height=img_h,
        preserveAspectRatio=True,
    )

    # ── Draw legend ───────────────────────────────────────────────────────────
    if legend:
        _draw_legend(c, legend, page_w, page_h)

    c.save()


def generate_reference_pdf(
    reference_img_path: Union[str, Path],
    legend: List[ColorLegendEntry],
    fmt: Union[Format, str],
    output_path: Union[str, Path],
) -> None:
    """Generate the reference PDF with the quantised colour image + legend.

    Parameters
    ----------
    reference_img_path:
        Path to reference.png (quantised colour image).
    legend:
        List of ColorLegendEntry produced by image_processor.
    fmt:
        Page format ("a4" or "a3", or Format enum).
    output_path:
        Where to write the PDF file.
    """
    fmt_key = fmt.value if hasattr(fmt, "value") else str(fmt)
    page_size = PAGE_SIZES[fmt_key]
    page_w, page_h = page_size

    ref_img = Image.open(str(reference_img_path)).convert("RGB")
    w_px, h_px = ref_img.size

    c = rl_canvas.Canvas(str(output_path), pagesize=page_size)

    # ── Draw image ────────────────────────────────────────────────────────────
    legend_area_h = LEGEND_HEIGHT if legend else 0
    img_x, img_y, img_w, img_h = _image_bounds(
        w_px, h_px, page_w, page_h, legend_area_h
    )
    c.drawImage(
        ImageReader(ref_img),
        img_x,
        img_y,
        width=img_w,
        height=img_h,
        preserveAspectRatio=True,
    )

    # ── Draw legend ───────────────────────────────────────────────────────────
    if legend:
        _draw_legend(c, legend, page_w, page_h)

    c.save()


# ─────────────────────────────────────────────────────────────────────────────
# Private helpers
# ─────────────────────────────────────────────────────────────────────────────


def _image_bounds(
    img_w: int,
    img_h: int,
    page_w: float,
    page_h: float,
    legend_area_h: float,
) -> tuple:
    """Return (x, y, draw_w, draw_h) for the image on the page.

    Reserves *legend_area_h* pt at the bottom and *MARGIN* on all sides.
    """
    avail_w = page_w - 2 * MARGIN
    avail_h = page_h - 2 * MARGIN - legend_area_h

    scale = min(avail_w / img_w, avail_h / img_h)
    draw_w = img_w * scale
    draw_h = img_h * scale

    x = (page_w - draw_w) / 2
    y = MARGIN + legend_area_h  # image sits above legend

    return x, y, draw_w, draw_h


def _draw_legend(
    c: rl_canvas.Canvas,
    legend: List[ColorLegendEntry],
    page_w: float,
    page_h: float,
) -> None:
    """Draw coloured swatches along the bottom of the page.

    Each swatch shows:
      - A filled coloured square (22×22 pt)
      - The Hachette symbol centred in bold 9 pt (black)
      - The French colour name below in 5 pt grey
      - A hatched B&W overlay pattern (every other swatch) for mono printing
    """
    n = len(legend)
    if n == 0:
        return

    # Total width of the swatch row; centre it horizontally
    row_w = n * SWATCH_SIZE + (n - 1) * SWATCH_GAP
    # If swatches overflow page width, shrink them
    if row_w > page_w - 2 * MARGIN:
        effective_size = (page_w - 2 * MARGIN - (n - 1) * SWATCH_GAP) / n
    else:
        effective_size = SWATCH_SIZE

    x_start = (page_w - (n * effective_size + (n - 1) * SWATCH_GAP)) / 2
    # Vertical position: near bottom, leaving MARGIN pt + label space
    swatch_y = MARGIN + 20  # bottom of swatch square

    for idx, entry in enumerate(legend):
        x = x_start + idx * (effective_size + SWATCH_GAP)

        # ── Colour fill ───────────────────────────────────────────────────────
        try:
            fill_color = HexColor(entry.hex)
        except Exception:
            fill_color = HexColor("#cccccc")

        c.setFillColor(fill_color)
        c.setStrokeColor(HexColor("#999999"))
        c.setLineWidth(0.3)
        c.rect(x, swatch_y, effective_size, effective_size, fill=1, stroke=1)

        # ── Monochrome hatching overlay (alternating pattern for B&W print) ──
        if idx % 2 == 0:
            _draw_hatch(c, x, swatch_y, effective_size, idx)

        # ── Symbol (bold, centred in square) ─────────────────────────────────
        c.setFillColor(black)
        c.setFont("Helvetica-Bold", min(9, effective_size * 0.45))
        c.drawCentredString(
            x + effective_size / 2,
            swatch_y + effective_size / 2 - 3,
            entry.symbol,
        )

        # ── Colour name below square ──────────────────────────────────────────
        c.setFont("Helvetica", min(5, effective_size * 0.25))
        c.setFillColor(Color(0.4, 0.4, 0.4))
        label = entry.name[:9]  # truncate long names
        c.drawCentredString(x + effective_size / 2, swatch_y - 9, label)


def _draw_hatch(
    c: rl_canvas.Canvas,
    x: float,
    y: float,
    size: float,
    idx: int,
) -> None:
    """Overlay a light hatching pattern inside the swatch for B&W printing."""
    pattern = idx % 3  # 0=horizontal, 1=vertical, 2=diagonal
    step = size / 4
    c.saveState()
    # Clip to swatch area
    p = c.beginPath()
    p.rect(x, y, size, size)
    c.clipPath(p, stroke=0)
    c.setStrokeColor(Color(0, 0, 0, alpha=0.25))
    c.setLineWidth(0.4)

    if pattern == 0:  # horizontal lines
        yy = y + step
        while yy < y + size:
            c.line(x, yy, x + size, yy)
            yy += step
    elif pattern == 1:  # vertical lines
        xx = x + step
        while xx < x + size:
            c.line(xx, y, xx, y + size)
            xx += step
    else:  # diagonal lines
        for offset in range(-int(size), int(size) + 1, int(step)):
            c.line(x + offset, y, x + offset + size, y + size)

    c.restoreState()
