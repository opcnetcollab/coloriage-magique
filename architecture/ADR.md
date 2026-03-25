# ADR — Coloriage Magique

## Contexte
Web app freemium de génération de coloriages numérotés à partir de photos.
Cible : familles, enfants, adultes créatifs.

## Stack Recommandée

### Frontend : Next.js 14 (App Router)
- SSR pour SEO + performance initiale
- Route handlers pour le BFF léger
- React 18 pour l'upload interactif
- Tailwind CSS + shadcn/ui

### Backend : FastAPI (Python 3.11+)
- Traitement image Python natif (OpenCV, Pillow, scikit-learn)
- Endpoints async + background tasks
- Uvicorn + Gunicorn en prod

### Image Processing Pipeline
1. **Resize** → 1500px max (Pillow)
2. **Quantification couleurs** → k-means (scikit-learn) sur l'espace LAB (meilleur rendu perceptuel que RGB)
   - Débutant : k=6 (±1)
   - Confirmé : k=11 (±3)
   - Expert : k=19 (±5)
3. **Edge detection** → Canny (OpenCV) sur grayscale
4. **Segmentation zones** → contours + flood-fill pour assigner symboles
5. **Numérotation Hachette** : 1-9 → A-Z → +, -, ×, ÷, =, %, &, @, #
6. **Génération SVG** → contours + labels de zones
7. **PDF A4/A3** → ReportLab (layout précis, nuancier en bas de page)

### PDF Generation : ReportLab ✅ (vs WeasyPrint ❌)
**Choix : ReportLab**
- Contrôle pixel-perfect du layout
- Gestion native des formats A4 (595×842pt) et A3 (842×1190pt)
- Rendu du nuancier : grille de carrés colorés avec symboles, en bas de page
- Support N&B : patterns/hachures en fallback pour imprimantes monochrome
- WeasyPrint = HTML→PDF, moins précis pour layouts graphiques

### Nuancier (ColorSwatchLegend)
Composant généré dans le PDF :
- Position : bas de page, hauteur fixe (~60pt)
- Layout : rangée de carrés (20×20pt) avec symbole centré
- Couleur : hex exact du cluster k-means
- N&B fallback : hachures diagonales différentes par zone
- Présent sur les 2 pages (coloriage + référence)

### Storage : Fichiers temporaires locaux (TTL 24h)
- Phase MVP : stockage local `/tmp/coloriage-jobs/`
- Migration vers Cloudflare R2 en phase 2 si scale
- Jobs purgés automatiquement après 24h (cron APScheduler)

### Jobs Async : FastAPI Background Tasks (MVP)
- Simple `BackgroundTasks` FastAPI pour MVP
- Migration vers Celery+Redis si >100 req/min

### Modèle Freemium
- Anonyme : 3 coloriages/heure, watermark discret, résolution A4 uniquement
- Compte gratuit : 10/jour, sans watermark, A4+A3
- Premium : illimité, priorité queue, formats spéciaux

## Risques Techniques
1. **Temps de traitement** : k-means sur grande image ~2-8s → UX spinner obligatoire
2. **HEIC iOS** → nécessite `pillow-heif` ou conversion préalable
3. **Zones trop petites** → seuil minimum de surface avant assignation symbole
4. **Qualité du découpage** → Canny sensible au bruit → pré-processing blur obligatoire

## Décision Finale
**Monorepo** : `apps/web` (Next.js) + `apps/api` (FastAPI)
**Déploiement** : 2 containers Docker, nginx reverse proxy
