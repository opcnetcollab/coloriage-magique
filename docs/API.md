# 📡 API Reference — Coloriage Magique

**Base URL (production):** `https://coloriage-magique.srv1465877.hstgr.cloud/api/v1`  
**Base URL (local):** `http://localhost:8000/api/v1`  
**Version:** 1.0.0

---

## Sommaire

- [Authentification & Rate Limiting](#authentification--rate-limiting)
- [Modèles](#modèles)
- [Endpoints](#endpoints)
  - [POST /jobs — Créer un job](#post-jobs)
  - [GET /jobs/{id} — Statut du job](#get-jobsid)
  - [GET /jobs/{id}/preview — Aperçu PNG](#get-jobsidpreview)
  - [GET /jobs/{id}/coloring-pdf — PDF coloriage](#get-jobsidcoloring-pdf)
  - [GET /jobs/{id}/reference-pdf — PDF référence](#get-jobsidreference-pdf)
  - [DELETE /jobs/{id} — Supprimer un job](#delete-jobsid)
  - [GET /health — Health check](#get-health)
- [Codes d'erreur](#codes-derreur)
- [Nuancier (color_legend)](#nuancier-color_legend)

---

## Authentification & Rate Limiting

L'API est publique (pas de clé requise en MVP). Les limites s'appliquent par IP :

| Contexte | Limite |
|----------|--------|
| Anonyme | **3 jobs / heure** |

Les headers de rate limiting sont inclus dans chaque réponse :

```
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 2
X-RateLimit-Reset: 1711360800
```

Quand la limite est atteinte, l'API répond `429 Too Many Requests` avec un header `Retry-After` (secondes avant reset).

---

## Modèles

### Job

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "done",
  "difficulty": "beginner",
  "format": "a4",
  "color_count": 7,
  "color_legend": [ ... ],
  "preview_url": "/api/v1/jobs/550e8400.../preview",
  "coloring_pdf_url": "/api/v1/jobs/550e8400.../coloring-pdf",
  "reference_pdf_url": "/api/v1/jobs/550e8400.../reference-pdf",
  "processing_ms": 3420,
  "created_at": "2026-03-25T08:00:00Z",
  "expires_at": "2026-03-26T08:00:00Z"
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique du job |
| `status` | enum | `pending` · `processing` · `done` · `failed` |
| `difficulty` | enum | `beginner` · `intermediate` · `expert` |
| `format` | enum | `a4` · `a3` |
| `color_count` | int | Nombre de couleurs réelles générées par le k-means |
| `color_legend` | array | Nuancier — voir [section dédiée](#nuancier-color_legend) |
| `preview_url` | string\|null | URL PNG 800px (disponible quand `status=done`) |
| `coloring_pdf_url` | string\|null | URL PDF coloriage (disponible quand `status=done`) |
| `reference_pdf_url` | string\|null | URL PDF référence (disponible quand `status=done`) |
| `processing_ms` | int | Temps de traitement en millisecondes |
| `created_at` | ISO8601 | Date de création |
| `expires_at` | ISO8601 | Date d'expiration (TTL 24h, puis suppression automatique) |

---

## Endpoints

### POST /jobs

Crée un job de génération à partir d'une image uploadée.

**Request** : `multipart/form-data`

| Champ | Type | Requis | Valeurs |
|-------|------|--------|---------|
| `image` | file | ✅ | JPEG, PNG, WEBP, HEIC — max 20 MB |
| `difficulty` | string | ✅ | `beginner` · `intermediate` · `expert` |
| `format` | string | ❌ | `a4` (défaut) · `a3` |

**Exemple curl :**

```bash
curl -X POST https://coloriage-magique.srv1465877.hstgr.cloud/api/v1/jobs \
  -F "image=@/chemin/vers/photo.jpg" \
  -F "difficulty=beginner" \
  -F "format=a4"
```

**Réponse 202 Accepted :**

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "poll_url": "/api/v1/jobs/550e8400-e29b-41d4-a716-446655440000"
}
```

---

### GET /jobs/{id}

Récupère le statut et les résultats d'un job. À utiliser en polling jusqu'à `status=done` ou `status=failed`.

**Exemple curl :**

```bash
curl https://coloriage-magique.srv1465877.hstgr.cloud/api/v1/jobs/550e8400-e29b-41d4-a716-446655440000
```

**Réponse 200 (en cours) :**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "difficulty": "beginner",
  "format": "a4",
  "color_count": null,
  "color_legend": [],
  "preview_url": null,
  "coloring_pdf_url": null,
  "reference_pdf_url": null,
  "processing_ms": null,
  "created_at": "2026-03-25T08:00:00Z",
  "expires_at": "2026-03-26T08:00:00Z"
}
```

**Réponse 200 (terminé) :**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "done",
  "difficulty": "beginner",
  "format": "a4",
  "color_count": 7,
  "color_legend": [
    { "symbol": "1", "hex": "#FF6B6B", "name": "Rouge corail" },
    { "symbol": "2", "hex": "#4ECDC4", "name": "Turquoise" },
    { "symbol": "3", "hex": "#FFE66D", "name": "Jaune soleil" },
    { "symbol": "4", "hex": "#2C3E50", "name": "Bleu nuit" },
    { "symbol": "5", "hex": "#A8E6CF", "name": "Vert menthe" },
    { "symbol": "6", "hex": "#FFEAA7", "name": "Jaune pâle" },
    { "symbol": "7", "hex": "#DDA0DD", "name": "Violet prune" }
  ],
  "preview_url": "/api/v1/jobs/550e8400.../preview",
  "coloring_pdf_url": "/api/v1/jobs/550e8400.../coloring-pdf",
  "reference_pdf_url": "/api/v1/jobs/550e8400.../reference-pdf",
  "processing_ms": 3420,
  "created_at": "2026-03-25T08:00:00Z",
  "expires_at": "2026-03-26T08:00:00Z"
}
```

> **Stratégie de polling recommandée :** 1 requête/seconde, timeout client après 60s.

---

### GET /jobs/{id}/preview

Retourne une image PNG 800px — aperçu rapide du coloriage avant téléchargement PDF.

**Exemple curl :**

```bash
curl -o preview.png \
  https://coloriage-magique.srv1465877.hstgr.cloud/api/v1/jobs/550e8400.../preview
```

**Réponse :** `image/png` — disponible uniquement quand `status=done`.

---

### GET /jobs/{id}/coloring-pdf

PDF imprimable : contours noirs, zones blanches numérotées (symbole Hachette centré), nuancier en bas de page.

**Contenu du PDF :**
- Page unique : coloriage (zones blanches + symbole centré, contours noirs)
- Bas de page : nuancier — rangée de carrés 20×20pt avec symbole + nom de couleur
- Fallback N&B : hachures diagonales uniques par zone (si impression monochrome)

**Exemple curl :**

```bash
curl -o coloriage.pdf \
  https://coloriage-magique.srv1465877.hstgr.cloud/api/v1/jobs/550e8400.../coloring-pdf
```

**Réponse :** `application/pdf` avec header `Content-Disposition: attachment; filename="coloriage.pdf"`

---

### GET /jobs/{id}/reference-pdf

PDF de référence : image originale colorée + nuancier en bas de page. Permet à l'enfant de savoir quelle couleur utiliser pour chaque numéro.

**Exemple curl :**

```bash
curl -o reference.pdf \
  https://coloriage-magique.srv1465877.hstgr.cloud/api/v1/jobs/550e8400.../reference-pdf
```

**Réponse :** `application/pdf`

---

### DELETE /jobs/{id}

Supprime immédiatement un job et tous ses fichiers associés (RGPD : droit à l'oubli).

**Exemple curl :**

```bash
curl -X DELETE \
  https://coloriage-magique.srv1465877.hstgr.cloud/api/v1/jobs/550e8400-e29b-41d4-a716-446655440000
```

**Réponse 204 No Content** (succès, corps vide).

> Les jobs sont également supprimés automatiquement après **24h** (TTL géré par APScheduler).

---

### GET /health

Health check — utilisé par Docker, nginx et le monitoring.

**Exemple curl :**

```bash
curl https://coloriage-magique.srv1465877.hstgr.cloud/api/v1/health
```

**Réponse 200 :**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "queue_depth": 3
}
```

---

## Codes d'erreur

| Code | Signification | Cause fréquente |
|------|---------------|-----------------|
| `400 Bad Request` | Paramètre invalide | `difficulty` ou `format` non reconnu |
| `404 Not Found` | Job introuvable | ID incorrect ou job expiré (>24h) |
| `413 Payload Too Large` | Image trop grande | Fichier > 20 MB |
| `422 Unprocessable Entity` | Fichier corrompu | Image illisible ou format non supporté |
| `429 Too Many Requests` | Rate limit atteint | > 3 jobs/heure (anonyme) |
| `500 Internal Server Error` | Erreur serveur | Erreur inattendue dans le pipeline |

**Format d'erreur standardisé :**

```json
{
  "detail": "Image file is corrupted or format is not supported.",
  "code": "INVALID_IMAGE"
}
```

---

## Nuancier (color_legend)

Le champ `color_legend` est un tableau de couleurs générées par l'algorithme k-means. Il est retourné dès que `status=done`.

### Structure d'un élément

```json
{
  "symbol": "1",
  "hex": "#FF6B6B",
  "name": "Rouge corail"
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `symbol` | string | Symbole Hachette : `1`–`9`, puis `A`–`Z`, puis `+`, `-`, `×`, `÷`, `=`, `%`, `&`, `@`, `#` |
| `hex` | string | Couleur exacte du cluster k-means (format `#RRGGBB`) |
| `name` | string | Nom lisible de la couleur (généré automatiquement) |

### Nombre de couleurs par niveau

| Niveau | `difficulty` | Plage de couleurs |
|--------|-------------|-------------------|
| Débutant | `beginner` | 5 – 8 couleurs |
| Intermédiaire | `intermediate` | 8 – 14 couleurs |
| Expert | `expert` | 14 – 25 couleurs |

### Usage frontend

Le `color_legend` permet d'afficher un aperçu interactif des couleurs **avant même le téléchargement du PDF**. Exemple : afficher les carrés colorés dans le composant `ColorSwatchLegend`.

### Rendu dans le PDF

Dans le PDF généré par ReportLab :
- Carrés **20×20pt** remplis de la couleur hex
- Symbole centré en noir (9pt, bold)
- Nom de couleur en dessous (6pt, gris)
- Fallback N&B : chaque zone reçoit un **pattern de hachures diagonal unique** pour distinguer les couleurs à l'impression monochrome
