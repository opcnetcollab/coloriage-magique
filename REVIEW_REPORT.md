# Code Review — Coloriage Magique
**Date :** 2026-03-25  
**Reviewer :** Agent Reviewer (T7)  
**Scope :** Backend FastAPI + Frontend Next.js  

---

## Verdict final : ❌ NEEDS_CHANGES

> **4 bloquants critiques** empêchent l'application de démarrer et de fonctionner.

---

## ✅ Points solides

### Backend
- **`storage.py`** : Architecture propre — dict in-memory thread-safe (`_lock`), TTL/purge bien pensé, API publique claire (`create_job`, `get_job`, `update_job`, `purge_expired`).
- **`routes/jobs.py`** : Validation des inputs complète (magic bytes, taille, difficulty/format), rate-limiting IP fonctionnel avec headers `X-RateLimit-Remaining` / `Retry-After`, logging structuré.
- **`main.py`** : Scheduler APScheduler bien intégré (lifespan-like via `on_event`), purge toutes les heures.
- **Tests `test_api.py`** : Couverture solide des happy paths et erreurs classiques (404, 413, 429, 400). Tests asyncio bien structurés.
- **Tests `test_image_processor.py`** : Très bonne couverture du système de symboles Hachette et du naming couleur.

### Frontend
- **`UploadZone.tsx`** : Drag-and-drop accessible (`role="button"`, `tabIndex`, `aria-label`, `onKeyDown`), validation côté client cohérente avec le backend (20MB, formats acceptés). Gestion du blob URL propre (`URL.revokeObjectURL` dans `reset`).
- **`DifficultySelector.tsx`** : Composant minimal et lisible, `aria-pressed` correct.
- **`ColorSwatchLegend.tsx`** : Nuancier interactif (hover tooltip), accessibility avec `aria-label`. Rendu conditionnel correct sur `result/[jobId]/page.tsx`.
- **`result/[jobId]/page.tsx`** : Polling avec `setTimeout` (non `setInterval`) — bonne pratique pour éviter les race conditions. Timeout max (90s) implémenté. Nettoyage dans `useEffect` cleanup.
- **Tests composants** : `ColorSwatchLegend.test.tsx` et `DifficultySelector.test.tsx` bien écrits, couvrent accessibilité, interactions et cas limites.

---

## ⚠️ Points à corriger

### 🔴 BLOQUANTS

#### 1. `models/job.py` — Schéma Pydantic incompatible avec le reste du code
**Fichier :** `apps/api/app/models/job.py`

Le modèle actuel est la version initiale et ne correspond **pas** au contrat API ni aux imports de `storage.py` :

| Ce qui est dans `models/job.py` | Ce qui est attendu |
|---|---|
| `job_id: str` | `id: str` |
| `JobStatus.PENDING/PROCESSING/DONE/ERROR` | `pending/processing/done/failed` |
| `pdf_url: Optional[str]` | `preview_url`, `coloring_pdf_url`, `reference_pdf_url` |
| Pas de `Difficulty`, `Format` | Requis par `storage.py` et `routes/jobs.py` |
| Pas de `JobCreateResponse` | Requis par `routes/jobs.py` |
| Pas de `color_legend`, `color_count`, `processing_ms`, `expires_at` | Requis par le contrat API |

`storage.py` ligne 12 importe `Difficulty, Format, Job, JobStatus, JobCreateResponse` → **ImportError au démarrage**.

**Fix :** Remplacer `models/job.py` par le modèle complet correspondant au contrat API v1.

---

#### 2. `image_processor.py` — Fonctions core manquantes
**Fichier :** `apps/api/app/services/image_processor.py`

`routes/jobs.py` (`_process_job`) appelle :
- `image_processor.process_image(image_path, job_d, difficulty)` → **n'existe pas**
- `image_processor.generate_preview(...)` → **n'existe pas**

Les tests `test_image_processor.py` importent :
- `get_hachette_symbol` → **n'existe pas**
- `process_image` → **n'existe pas**
- `_color_name_fr` → **n'existe pas**

Le fichier actuel contient uniquement `to_coloring_page()` (edge detection simple sans k-means) et `open_from_bytes()`. La logique métier principale — segmentation k-means, nuancier, labels, génération des fichiers `coloring.png`, `reference.png`, `labels.npy`, `edges.npy` — est **absente**.

**Impact :** Tout job lancé passe en `failed` immédiatement. L'ensemble des tests `test_image_processor.py` échoue.

**Fix :** Implémenter `process_image()`, `generate_preview()`, `get_hachette_symbol()`, `_color_name_fr()` conformément aux tests existants et au contrat.

---

#### 3. `pdf_generator.py` — Fonctions core manquantes
**Fichier :** `apps/api/app/services/pdf_generator.py`

`routes/jobs.py` appelle :
- `pdf_generator.generate_coloring_pdf(label_map_path, edges_path, legend, fmt, output_path)` → **n'existe pas**
- `pdf_generator.generate_reference_pdf(reference_img_path, legend, fmt, output_path)` → **n'existe pas**

La méthode actuelle `PDFGenerator.generate()` est un wrapper basique sans nuancier, inutilisée par le code de production. Le **nuancier (`color_legend`)** n'est intégré nulle part dans les PDFs.

**Contrat API :** `GET /jobs/{job_id}/coloring-pdf` doit inclure `ColorSwatchLegend` (carrés 20×20pt, symbole, nom). Non implémenté.

**Fix :** Implémenter les deux fonctions avec :
- Rendu zones numérotées + contours (depuis `labels.npy` / `edges.npy`)
- Nuancier ReportLab en bas de page (carrés colorés, symbole, hex, nom)
- Support A4/A3 via `fmt`

---

#### 4. `api.test.ts` — Tests cassés : fonction inexistante
**Fichier :** `apps/web/src/lib/api.test.ts`

Les tests importent et appellent `getJobStatus` → **n'existe pas dans `api.ts`** (la fonction s'appelle `getJob`).

Les assertions testent `result.job_id` et `result.pdf_url` → ancienne API. Le contrat actuel utilise `result.id` et `result.coloring_pdf_url`.

**Fix :** Réécrire `api.test.ts` pour tester `createJob` et `getJob` avec les bons types (`Job`, `CreateJobResponse`).

---

### 🟡 SUGGESTIONS (non bloquants)

#### 5. `job_store.py` — Fichier orphelin
**Fichier :** `apps/api/app/services/job_store.py`

`JobStore` est une ancienne implémentation, jamais importée par le code actuel (qui utilise `storage.py`). **Dead code** à supprimer pour éviter la confusion.

---

#### 6. `main.py` — API `on_event` dépréciée
FastAPI ≥ 0.93 a déprécié `@app.on_event`. Migrer vers le pattern `lifespan` :
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    _scheduler.start()
    yield
    _scheduler.shutdown(wait=False)

app = FastAPI(lifespan=lifespan, ...)
```

---

#### 7. CORS hardcodé dans `main.py`
Les origines CORS sont en dur. À externaliser via env var :
```python
allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
```

---

#### 8. `_rate_store` en mémoire — Leak potentiel
Le dict `_rate_store` dans `routes/jobs.py` accumule des entrées par IP sans purge globale. En production avec beaucoup d'IPs différentes, cela croît indéfiniment. Ajouter une purge périodique ou utiliser un TTL.

---

#### 9. Tests manquants — Edge cases critiques
| Cas | Fichier concerné | Priorité |
|---|---|---|
| Upload image corrompue → 422 | `test_api.py` | Haute |
| Image monochrome (1 couleur, k-means k=1) | `test_image_processor.py` | Haute |
| Timeout processing (job bloqué >60s) | `test_api.py` | Moyenne |
| `generate_coloring_pdf` avec légende vide | `test_pdf_generator.py` (manquant) | Haute |
| `generate_reference_pdf` output valide | `test_pdf_generator.py` (manquant) | Haute |
| Accès preview/pdf pour un job non-done → 409 | `test_api.py` | Haute |

**Note :** Aucun fichier `test_pdf_generator.py` n'existe. C'est un angle mort important.

---

#### 10. `test_health.py` — Duplication
`test_health.py` duplique exactement les tests déjà dans `test_api.py`. À supprimer ou fusionner.

---

#### 11. `ColorSwatchLegend.tsx` — Lisibilité swatch sur fond clair
La couleur du texte des symboles est toujours `text-white`. Pour des couleurs très claires (jaune pâle, blanc), le contraste est insuffisant. Considérer un calcul de luminosité pour switcher noir/blanc automatiquement.

---

#### 12. `result/[jobId]/page.tsx` — Pas de gestion 409
Si le polling reçoit une 409 (job non done) avant le timeout, l'erreur est propagée vers l'utilisateur comme une erreur réseau. Ajouter une gestion spécifique du status 409 (continuer à poller).

---

## Résumé des fichiers à modifier

| Fichier | Statut | Action |
|---|---|---|
| `app/models/job.py` | 🔴 Bloquant | Réécrire complètement |
| `app/services/image_processor.py` | 🔴 Bloquant | Implémenter les fonctions manquantes |
| `app/services/pdf_generator.py` | 🔴 Bloquant | Implémenter `generate_coloring_pdf` + `generate_reference_pdf` avec nuancier |
| `apps/web/src/lib/api.test.ts` | 🔴 Bloquant | Réécrire pour `getJob`/`createJob` |
| `app/services/job_store.py` | 🟡 Suggestion | Supprimer (dead code) |
| `app/main.py` | 🟡 Suggestion | Migrer vers `lifespan` |
| `apps/api/tests/test_api.py` | 🟡 Suggestion | Ajouter 409, 422, edge cases |
| `apps/api/tests/test_pdf_generator.py` | 🟡 Suggestion | Créer le fichier |
| `apps/api/tests/test_health.py` | 🟡 Suggestion | Supprimer (doublon) |
