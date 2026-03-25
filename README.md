# 🎨 Coloriage Magique

> Transformez vos photos en coloriages numérotés à imprimer — pour les enfants et les grands !

Uploadez une photo, choisissez un niveau de difficulté, et obtenez en quelques secondes un PDF prêt à imprimer avec zones numérotées et nuancier Hachette.

![Screenshot placeholder](docs/screenshot-placeholder.png)

---

## ✨ Fonctionnalités

| Feature | Détail |
|---------|--------|
| 📤 Upload photo | JPEG, PNG, WEBP, HEIC — max 20 MB |
| 🎯 3 niveaux de difficulté | Débutant (5–8 couleurs), Intermédiaire (8–14), Expert (14–25) |
| 🔢 Numérotation Hachette | 1–9, A–Z, puis symboles mathématiques (+, −, ×, ÷…) |
| 🎨 Nuancier (ColorSwatchLegend) | Carrés colorés + symbole centré, inclus dans le PDF |
| 📄 Export PDF A4 / A3 | Coloriage N&B + hachures de secours pour impression monochrome |
| 📋 PDF de référence | Image originale colorée + nuancier en bas de page |
| 🔒 RGPD | Suppression via `DELETE /jobs/{id}`, TTL 24h automatique |

---

## 🛠 Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python 3.11), OpenCV, Pillow, scikit-learn, ReportLab |
| Tests front | Vitest + Testing Library |
| Tests back | pytest + pytest-asyncio |
| CI/CD | GitHub Actions → GHCR → Hostinger VPS |
| Infra | Docker, nginx reverse proxy |

---

## 🚀 Quickstart — Dev local

### Option 1 : Docker Compose (recommandé)

```bash
# Préparer le volume de stockage local
mkdir -p /tmp/coloriage-jobs

# Démarrer tous les services
docker compose up --build
```

Services disponibles :

| URL | Service |
|-----|---------|
| http://localhost | App complète (nginx) |
| http://localhost:3000 | Next.js direct |
| http://localhost:8000 | FastAPI direct |
| http://localhost:8000/docs | Swagger UI |

### Option 2 : Sans Docker

**Frontend**
```bash
cd apps/web
npm install
cp .env.example .env.local   # éditer si besoin
npm run dev                  # http://localhost:3000
npm test                     # vitest run
```

**Backend**
```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## ⚙️ Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | URL de l'API FastAPI (frontend) |
| `PYTHONUNBUFFERED` | `1` | Logs Python sans buffer (API) |

> Copier `apps/web/.env.example` → `apps/web/.env.local` pour override local.

---

## 🏗 Architecture

Monorepo `apps/web` (Next.js) + `apps/api` (FastAPI), reliés par nginx en reverse proxy. Le pipeline image (k-means → Canny → ReportLab) tourne entièrement côté API, les jobs sont stockés localement avec TTL 24h.

```
┌──────────────┐   HTTP    ┌──────────────┐   BG Task   ┌─────────────────────┐
│  Next.js 14  │ ────────▶ │   FastAPI    │ ──────────▶ │  Image Pipeline     │
│  (port 3000) │           │  (port 8000) │             │  OpenCV + ReportLab │
└──────────────┘           └──────────────┘             └─────────────────────┘
        │                         │
        └─────── nginx ───────────┘
                (port 80)
```

---

## 🌐 Production

| | |
|-|-|
| **URL** | https://coloriage-magique.srv1465877.hstgr.cloud |
| **Repo** | https://github.com/opcnetcollab/coloriage-magique |
| **Image API** | `ghcr.io/opcnetcollab/coloriage-magique-api:latest` |
| **Image Web** | `ghcr.io/opcnetcollab/coloriage-magique-web:latest` |

Le pipeline CI/CD build et push automatiquement à chaque push sur `main`.

---

## 🤝 Contribuer

1. Créer une branche `feature/<nom>` depuis `main`
2. Commiter avec des messages conventionnels (`feat:`, `fix:`, `docs:`, `chore:`)
3. Ouvrir une PR → les tests CI se lancent automatiquement
4. Review + merge → deploy automatique

---

## 📄 Documentation

- [API Reference](docs/API.md) — Endpoints, exemples curl, codes d'erreur
- [Changelog](CHANGELOG.md) — Historique des versions
- [ADR](architecture/ADR.md) — Décisions d'architecture
- [API Contract](api/API_CONTRACT.md) — Contrat OpenAPI
