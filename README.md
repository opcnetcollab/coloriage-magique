# 🎨 Coloriage Magique

> Transformez vos photos en coloriages magiques à imprimer — pour les enfants et les grands !

Uploadez une photo (JPEG, PNG, WEBP ou HEIC), et obtenez un coloriage noir et blanc en PDF, prêt à imprimer en quelques secondes.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python 3.11), OpenCV, Pillow, ReportLab |
| Tests front | Vitest + Testing Library |
| Tests back | pytest + pytest-asyncio |
| CI/CD | GitHub Actions → GHCR → Hostinger VPS |
| Infra | Docker, nginx reverse proxy |

---

## Dev local

### Prérequis

- Node.js 20+
- Python 3.11+
- (Optionnel) Docker + Docker Compose

### Frontend (Next.js)

```bash
cd apps/web
npm install
npm run dev          # http://localhost:3000
npm test             # vitest run
```

### Backend (FastAPI)

```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# API docs → http://localhost:8000/docs
```

### Avec Docker Compose

```bash
# Créer le volume local
mkdir -p /tmp/coloriage-jobs

# Démarrer tous les services
docker compose up --build

# Services :
#   http://localhost      → App complète (nginx)
#   http://localhost:3000 → Next.js direct
#   http://localhost:8000 → FastAPI direct
#   http://localhost:8000/docs → Swagger UI
```

---

## Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | URL de l'API FastAPI |

Copier `.env.example` → `.env.local` dans `apps/web/` pour override.

---

## Architecture API

```
POST   /api/jobs              Upload image → retourne job_id (202)
GET    /api/jobs/{id}         Status du job (pending/processing/done/error)
GET    /api/jobs/{id}/pdf     Télécharger le PDF (quand status=done)
GET    /api/health            Health check
```

---

## Production

- **URL :** https://coloriage-magique.srv1465877.hstgr.cloud
- **Repo :** https://github.com/opcnetcollab/coloriage-magique
- **Images GHCR :**
  - `ghcr.io/opcnetcollab/coloriage-magique-api:latest`
  - `ghcr.io/opcnetcollab/coloriage-magique-web:latest`

Le pipeline CI/CD build et push automatiquement à chaque push sur `main`.

---

## Contribuer

1. Créer une branche `feature/<nom>` depuis `main`
2. Commiter avec des messages conventionnels (`feat:`, `fix:`, `chore:`)
3. Ouvrir une PR → les tests CI se lancent automatiquement
4. Review + merge → deploy automatique
