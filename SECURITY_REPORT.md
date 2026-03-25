# 🔒 Security Audit Report — Coloriage Magique API

**Date:** 2026-03-25  
**Auditor:** Security Auditor Agent (T8)  
**MC Task:** #48  
**Scope:** API backend (FastAPI) + Frontend API client  
**Verdict:** ❌ **FAIL** — 3 vulnérabilités critiques bloquantes pour la mise en prod

---

## 🔴 Vulnérabilités Critiques

### C1 — Rate Limiting bypassable via X-Forwarded-For spoofing

**Fichier :** `apps/api/app/routes/jobs.py` — `_get_client_ip()`

```python
def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()  # ← CONFIANCE AVEUGLE
    if request.client:
        return request.client.host
    return "unknown"
```

**Problème :** Le header `X-Forwarded-For` est entièrement contrôlé par le client. N'importe qui peut envoyer `X-Forwarded-For: 1.2.3.4` pour usurper une IP arbitraire et soumettre un nombre illimité de jobs, contournant la limite de 3/heure.

**Vecteur d'attaque concret :**
```bash
for i in $(seq 1 1000); do
  curl -X POST https://api/api/v1/jobs \
    -H "X-Forwarded-For: 10.0.0.$((i % 255))" \
    -F "image=@photo.jpg" -F "difficulty=expert"
done
```

**Impact :** DoS complet de l'API + épuisement CPU/RAM.

**Correction :**
- Si l'API est derrière un reverse-proxy connu (Nginx/Traefik), configurer `trusted_hosts` et utiliser **uniquement** l'IP du proxy de confiance :
  ```python
  # Avec uvicorn/starlette ProxyHeadersMiddleware
  from starlette.middleware.trustedhost import TrustedHostMiddleware
  # Ou utiliser request.client.host directement si pas de proxy
  ```
- Utiliser `slowapi` avec `get_remote_address` configuré proprement sur l'IP réelle.
- Documenter quelle(s) IP(s) de proxy sont dignes de confiance.

---

### C2 — Absence de timeout sur les tâches de traitement (DoS CPU)

**Fichier :** `apps/api/app/routes/jobs.py` — `_process_job()` / `create_job()`

```python
background_tasks.add_task(_process_job, job_id, str(raw_path), diff, fmt)
```

**Problème :** Le background task n'a aucune limite de durée. Une image 20 MB traitée en mode `expert` (k-means k=19 sur potentiellement 4000×5000px ≈ 20 Mpx) peut prendre **plusieurs minutes** par job. Avec le rate limit cassé (voir C1), un attaquant peut saturer tous les workers Python avec des jobs bloquants.

**Estimation worst-case :** k-means k=19 sur 20 Mpx ≈ 19 × 20M distances par itération × 30-50 itérations = **10-60 secondes CPU par job** sur un serveur moyen, jusqu'à plusieurs minutes si la convergence est lente.

**Impact :** L'API cesse de répondre pour tous les utilisateurs légitimes (thread pool exhaustion).

**Correction :**
```python
import asyncio
import concurrent.futures

async def _process_job_with_timeout(job_id, image_path, difficulty, fmt):
    loop = asyncio.get_event_loop()
    with concurrent.futures.ProcessPoolExecutor(max_workers=2) as pool:
        try:
            await asyncio.wait_for(
                loop.run_in_executor(pool, _process_job, job_id, image_path, difficulty, fmt),
                timeout=120.0  # 2 minutes max
            )
        except asyncio.TimeoutError:
            storage.update_job(job_id, status=JobStatus.failed, error="Processing timeout")
```

Ou utiliser Celery/ARQ avec un `time_limit` sur les workers.

---

### C3 — Upload lu entièrement en RAM avant la vérification de taille

**Fichier :** `apps/api/app/routes/jobs.py` — `create_job()`

```python
content = await image.read()  # ← LECTURE COMPLÈTE EN RAM
if len(content) > MAX_IMAGE_SIZE:  # ← VÉRIFICATION TROP TARDIVE
    raise HTTPException(status_code=413, ...)
```

**Problème :** FastAPI/Starlette lit **tout** le fichier en mémoire avant de vérifier la taille. Avec 100 requêtes concurrentes de 20 MB chacune (rendu possible par C1), c'est **2 GB de RAM allouée** avant tout rejet.

**Impact :** OOM kill du processus Python en production.

**Correction :** Utiliser un streaming avec limite explicite dès le middleware, ou vérifier le `Content-Length` header en amont :
```python
from fastapi import Request

# Middleware de taille max
@app.middleware("http")
async def limit_upload_size(request: Request, call_next):
    if request.method == "POST":
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_IMAGE_SIZE + 1024:  # +1KB pour les headers multipart
            return JSONResponse(status_code=413, content={"detail": "Image too large"})
    return await call_next(request)
```

Note : `Content-Length` peut aussi être falsifié, mais cela réduit la surface d'attaque accidentelle. La solution robuste est un streaming reader avec `SpooledTemporaryFile` et une limite de lecture.

---

## 🟡 Risques Moyens (à corriger avant v1)

### M1 — OpenAPI docs exposés en production

**Fichier :** `apps/api/app/main.py`

```python
app = FastAPI(
    docs_url="/docs",   # Swagger UI public
    redoc_url="/redoc", # ReDoc public
)
```

**Risque :** Facilite la découverte des endpoints et paramètres pour un attaquant. Pour une API publique, désactiver en prod ou restreindre par IP.

**Correction :**
```python
import os
docs_url = "/docs" if os.getenv("ENV") != "production" else None
app = FastAPI(docs_url=docs_url, redoc_url=None)
```

---

### M2 — Messages d'erreur internes exposés dans le statut des jobs

**Fichier :** `apps/api/app/routes/jobs.py`

```python
storage.update_job(job_id, status=JobStatus.failed, error=str(exc))
```

**Risque :** Les exceptions Python incluent des chemins filesystem (`/tmp/coloriage-jobs/...`), des noms de modules, des stack traces. Ces infos facilitent la reconnaissance de l'infrastructure.

**Correction :** Logger l'erreur complète côté serveur, retourner un message générique côté client :
```python
logger.exception("Job %s failed", job_id)
storage.update_job(job_id, status=JobStatus.failed, error="Processing failed. Please retry.")
```

---

### M3 — Rate store en mémoire : non-persistant, non-distribué

**Fichier :** `apps/api/app/routes/jobs.py`

```python
_rate_store: Dict[str, List[float]] = defaultdict(list)
```

**Risques :**
1. **Reset au redémarrage** : un restart du container remet le compteur à zéro.
2. **Multi-instance** : si 2 réplicas API tournent, chaque instance a son propre store → limite effective = 3 × N par heure.
3. **Memory leak** : `_rate_store` grossit indéfiniment avec les IPs uniques. Aucun nettoyage des entrées vides.

**Correction :** Utiliser Redis + `slowapi` pour un rate limiting persistant et distribué.

---

### M4 — Pas d'endpoint de suppression explicite (RGPD Art. 17 — Droit à l'effacement)

**Fichier :** `apps/api/app/routes/jobs.py`

L'API n'expose pas de `DELETE /api/v1/jobs/{job_id}` pour que l'utilisateur puisse supprimer ses données à la demande.

**Risque légal :** Le RGPD impose un délai "sans retard injustifié" pour le droit à l'effacement. Le TTL 24h est une bonne pratique mais ne suffit pas — l'utilisateur doit pouvoir demander la suppression immédiate.

**Correction :**
```python
@router.delete("/jobs/{job_id}", status_code=204)
async def delete_job(job_id: str):
    job = storage.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404)
    storage.delete_job(job_id)  # À implémenter
```

---

### M5 — CORS : `allow_methods=["*"]` et `allow_headers=["*"]` trop permissifs

**Fichier :** `apps/api/app/main.py`

Les origines sont correctement restreintes ✅, mais les méthodes et headers sont ouverts. Cela permet n'importe quelle méthode HTTP (PUT, DELETE, PATCH, etc.) depuis les origines autorisées.

**Correction :** Restreindre explicitement :
```python
allow_methods=["GET", "POST"],
allow_headers=["Content-Type", "Accept"],
```

---

### M6 — Protection décompression bomb incomplète pour les formats HEIC/WebP

**Fichier :** `apps/api/app/routes/jobs.py` + `image_processor.py`

La vérification magic bytes est présente ✅ mais :
- OpenCV ne décode pas HEIC nativement — si un plugin tiers est installé, une image HEIC compressée de 20 MB pourrait représenter une image de plusieurs gigapixels avant le resize.
- PIL n'a pas de limite `MAX_IMAGE_PIXELS` configurée explicitement, ce qui peut causer un `DecompressionBombError` silencieux ou un crash mémoire.

**Correction :**
```python
from PIL import Image
Image.MAX_IMAGE_PIXELS = 100_000_000  # 100 Mpx max (avant resize)
```
Et vérifier que `cv2.imdecode` retourne `None` pour les fichiers HEIC non supportés (déjà géré via le `if img is None: raise ValueError`).

---

### M7 — Pas de mention légale / politique de confidentialité dans l'API

**RGPD Art. 13/14 :** Les utilisateurs doivent être informés du traitement de leurs données (photos de visages/personnes) au moment de la collecte.

**Recommandation :** Ajouter un champ `privacy_policy_url` dans la réponse de `/health` ou dans la documentation OpenAPI, et afficher une mention claire sur le frontend avant l'upload.

---

## 🟢 Bonnes Pratiques Identifiées

| # | Pratique | Détail |
|---|---------|--------|
| ✅ | **CORS sécurisé** | Origines explicitement restreintes (`localhost:3000` + domaine prod). Pas de wildcard. |
| ✅ | **Validation magic bytes** | Vérifie les magic bytes réels (JPEG, PNG, WebP, HEIC) et non le Content-Type header facilement falsifiable. |
| ✅ | **UUID4 pour les job IDs** | IDs aléatoires et non-énumérables — empêche la découverte par force brute. |
| ✅ | **Nom de fichier neutralisé** | Le fichier est sauvegardé en `upload{ext}` et non avec le nom original fourni par l'utilisateur. |
| ✅ | **Extension whitelistée** | `_guess_ext` n'autorise que les extensions connues, fallback `.jpg`. |
| ✅ | **Path traversal implicitement protégé** | `_get_done_job` vérifie d'abord l'existence du job dans le dict en mémoire (clés = UUIDs exclusivement) avant toute opération filesystem. |
| ✅ | **TTL 24h + purge planifiée** | APScheduler nettoie les jobs expirés toutes les heures. |
| ✅ | **Thread-safe** | `threading.Lock()` sur le dict partagé. |
| ✅ | **Resize image** | Résolution limitée à 2000px max avant traitement — borne la consommation CPU/RAM sur l'image décompressée. |
| ✅ | **Validation Difficulty/Format via Enum** | Rejette immédiatement les valeurs invalides avant tout traitement. |
| ✅ | **Headers rate limit exposés** | `X-RateLimit-Remaining` et `Retry-After` dans les 429. |

---

## Résumé Exécutif

| Sévérité | Nb | IDs |
|----------|-----|-----|
| 🔴 Critique | 3 | C1, C2, C3 |
| 🟡 Moyen | 7 | M1–M7 |
| 🟢 Bonne pratique | 11 | — |

**Les 3 vulnérabilités critiques sont liées entre elles :** C1 (XFF spoofing) permet de contourner le rate limit → C3 (upload en RAM) devient exploitable en masse → C2 (pas de timeout) laisse les workers occupés indéfiniment. Ensemble, ils forment un vecteur DoS complet.

---

## Plan de Remédiation Recommandé

**Priorité immédiate (avant toute mise en prod) :**
1. Corriger `_get_client_ip()` : configurer `trusted_proxies` ou utiliser `request.client.host` directement si pas de reverse-proxy.
2. Ajouter un timeout sur `_process_job` (120s recommandé).
3. Ajouter un middleware de limite de taille en streaming avant la lecture en RAM.

**Avant v1 :**
4. Désactiver `/docs` et `/redoc` en production.
5. Généraliser les messages d'erreur retournés aux clients.
6. Ajouter `DELETE /api/v1/jobs/{job_id}`.
7. Migrer le rate store vers Redis.
8. Restreindre `allow_methods` et `allow_headers` dans le CORS.

---

*Rapport généré le 2026-03-25 par Security Auditor Agent — Coloriage Magique T8*
