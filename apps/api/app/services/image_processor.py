"""Image processing pipeline for Coloriage Magique.

Pipeline:
  1. Load image (HEIC via pillow-heif), resize max 1500px
  2. K-means in LAB space (scikit-learn), k = f(difficulty)
  3. Reconstruct quantised image → reference.png
  4. Canny edge detection → coloring.png (white bg + black edges)
  5. Save labels.npy and edges.npy
  6. Build ColorLegendEntry list (symbol + hex + French name)
"""
from __future__ import annotations

import colorsys
import io
from pathlib import Path
from typing import List, Tuple, Union

import cv2
import numpy as np
from PIL import Image

from app.models.job import ColorLegendEntry, Difficulty

# ── Hachette symbol table ─────────────────────────────────────────────────────
HACHETTE_SYMBOLS: List[str] = (
    [str(i) for i in range(1, 10)]                            # "1"–"9"   (9)
    + list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")                      # A–Z      (26)
    + ["+", "-", "×", "÷", "=", "%", "&", "@", "#", "!", "?", "~", "^", "*", "§"]  # (15)
)  # total 50

# ── K-means clusters per difficulty ──────────────────────────────────────────
DIFFICULTY_K = {
    Difficulty.beginner: 6,
    Difficulty.intermediate: 11,
    Difficulty.expert: 19,
}

_MAX_PX = 1500


# ─────────────────────────────────────────────────────────────────────────────
# Public helpers
# ─────────────────────────────────────────────────────────────────────────────


def get_hachette_symbol(index: int) -> str:
    """Return Hachette symbol for *index* (0-based).

    Raises ValueError if index is out of range.
    """
    if index < 0 or index >= len(HACHETTE_SYMBOLS):
        raise ValueError(
            f"Symbol index {index} out of range [0, {len(HACHETTE_SYMBOLS) - 1}]"
        )
    return HACHETTE_SYMBOLS[index]


def _color_name_fr(rgb: Tuple[int, int, int]) -> str:
    """Return a heuristic French color name for an (R, G, B) tuple."""
    r, g, b = rgb
    # Normalise to [0, 1] for colorsys
    rn, gn, bn = r / 255.0, g / 255.0, b / 255.0
    h, s, v = colorsys.rgb_to_hsv(rn, gn, bn)
    h360 = h * 360  # hue in degrees

    if v < 0.15:
        return "Noir"
    if v > 0.85 and s < 0.15:
        return "Blanc"
    if s < 0.15:
        return "Gris"

    # Hue-based classification
    if h360 < 15 or h360 >= 345:
        return "Rouge"
    if h360 < 45:
        return "Orange"
    if h360 < 70:
        return "Jaune"
    if h360 < 165:
        return "Vert"
    if h360 < 195:
        return "Cyan"
    if h360 < 265:
        return "Bleu"
    if h360 < 295:
        return "Violet"
    return "Rose"


def name_color(hex_str: str) -> str:
    """Return a heuristic French color name for a hex string like '#rrggbb'."""
    hex_str = hex_str.lstrip("#")
    r = int(hex_str[0:2], 16)
    g = int(hex_str[2:4], 16)
    b = int(hex_str[4:6], 16)
    return _color_name_fr((r, g, b))


# ─────────────────────────────────────────────────────────────────────────────
# Main pipeline
# ─────────────────────────────────────────────────────────────────────────────


def process_image(
    image_path: Union[str, Path],
    job_dir: Union[str, Path],
    difficulty: Difficulty,
) -> List[ColorLegendEntry]:
    """Run the full coloring-page pipeline.

    Parameters
    ----------
    image_path:
        Path to the source image (JPEG / PNG / WEBP / HEIC).
    job_dir:
        Output directory — will be created if absent.
    difficulty:
        Controls the number of k-means clusters.

    Returns
    -------
    List[ColorLegendEntry]
        One entry per colour cluster, in cluster-index order.
    """
    image_path = Path(image_path)
    job_dir = Path(job_dir)
    job_dir.mkdir(parents=True, exist_ok=True)

    k = DIFFICULTY_K[difficulty]

    # ── 1. Load & resize ─────────────────────────────────────────────────────
    img_pil = _load_image(image_path)
    img_pil = _resize(img_pil, _MAX_PX)
    img_rgb = np.array(img_pil.convert("RGB"), dtype=np.uint8)
    h, w = img_rgb.shape[:2]

    # ── 2. K-means in LAB space ───────────────────────────────────────────────
    lab = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    pixels = lab.reshape(-1, 3)

    from sklearn.cluster import KMeans  # lazy — heavy

    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels_flat = km.fit_predict(pixels)
    centers_lab = km.cluster_centers_  # shape (k, 3)

    labels = labels_flat.reshape(h, w).astype(np.int32)

    # ── 3. Reconstruct quantised image ────────────────────────────────────────
    centers_lab_u8 = centers_lab.clip(0, 255).astype(np.uint8)
    quantised_lab = centers_lab_u8[labels]  # shape (h, w, 3)
    quantised_rgb = cv2.cvtColor(quantised_lab, cv2.COLOR_LAB2RGB)

    reference_path = job_dir / "reference.png"
    Image.fromarray(quantised_rgb).save(str(reference_path))

    # ── 4. Edge detection → coloring page ────────────────────────────────────
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    edges_raw = cv2.Canny(blurred, threshold1=30, threshold2=100)  # 0 or 255

    # White background + black edges
    coloring = np.full((h, w, 3), 255, dtype=np.uint8)
    coloring[edges_raw > 0] = 0

    coloring_path = job_dir / "coloring.png"
    Image.fromarray(coloring).save(str(coloring_path))

    # ── 5. Save arrays ────────────────────────────────────────────────────────
    np.save(str(job_dir / "labels.npy"), labels)
    np.save(str(job_dir / "edges.npy"), edges_raw)

    # ── 6. Build colour legend ────────────────────────────────────────────────
    # Convert LAB cluster centres to RGB for hex + naming
    legend: List[ColorLegendEntry] = []
    for i in range(k):
        center_lab = centers_lab_u8[i : i + 1, np.newaxis, :]  # (1,1,3)
        center_rgb = cv2.cvtColor(center_lab, cv2.COLOR_LAB2RGB)[0, 0]
        r, g, b = int(center_rgb[0]), int(center_rgb[1]), int(center_rgb[2])
        hex_str = f"#{r:02x}{g:02x}{b:02x}"
        legend.append(
            ColorLegendEntry(
                symbol=HACHETTE_SYMBOLS[i],
                hex=hex_str,
                name=_color_name_fr((r, g, b)),
            )
        )

    return legend


def generate_preview(coloring_path: Union[str, Path], preview_path: Union[str, Path]) -> None:
    """Generate a small preview PNG (max 800px) from the coloring image."""
    coloring_path = Path(coloring_path)
    preview_path = Path(preview_path)

    img = Image.open(str(coloring_path))
    img = _resize(img, 800)
    img.save(str(preview_path))


# ─────────────────────────────────────────────────────────────────────────────
# Private helpers
# ─────────────────────────────────────────────────────────────────────────────


def _load_image(path: Path) -> Image.Image:
    """Load any supported image, including HEIC via pillow-heif."""
    suffix = path.suffix.lower()
    if suffix in (".heic", ".heif"):
        try:
            import pillow_heif  # noqa: F401 — registers HEIF opener

            pillow_heif.register_heif_opener()
        except ImportError:
            pass  # pillow-heif not installed — PIL will fail with a clear error
    return Image.open(str(path))


def _resize(img: Image.Image, max_px: int) -> Image.Image:
    """Resize *img* so that its longest side ≤ *max_px*, preserving aspect ratio."""
    w, h = img.size
    if max(w, h) <= max_px:
        return img
    scale = max_px / max(w, h)
    new_w, new_h = max(1, int(w * scale)), max(1, int(h * scale))
    return img.resize((new_w, new_h), Image.LANCZOS)
