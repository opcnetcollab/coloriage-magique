# Changelog

All notable changes to Coloriage Magique are documented here.  
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] - 2026-03-25

### Added

- Image upload (JPEG/PNG/WEBP/HEIC, max 20MB)
- 3 difficulty levels: beginner (5-8 colors), intermediate (8-14), expert (14-25)
- Hachette numbering system (1-9, A-Z, math symbols)
- Color swatch legend (nuancier) in generated PDFs
- PDF export A4/A3 with B&W hatch fallback for monochrome printing
- Reference PDF with original colored image + legend
- RGPD: DELETE endpoint, 24h TTL
- Rate limiting: 3 jobs/hour (anonymous)
- PNG preview (800px) available before PDF download
- Health check endpoint (`GET /api/v1/health`) with queue depth
- Docker Compose setup (API + Web + nginx)
- GitHub Actions CI/CD pipeline (test + build + push GHCR)
- FastAPI async background task pipeline (OpenCV → k-means → ReportLab)
- Next.js 14 App Router frontend with Tailwind CSS
- `ColorSwatchLegend` interactive component (frontend)
- `DifficultySelector` component with 3 presets
- `UploadZone` with drag-and-drop support
- Vitest + Testing Library (frontend tests)
- pytest + pytest-asyncio (backend tests, coverage ≥ 80%)
