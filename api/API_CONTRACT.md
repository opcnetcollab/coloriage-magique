# Contrat API — Coloriage Magique v1

Base URL : `https://coloriage-magique.srv1465877.hstgr.cloud/api/v1`

## Modèles

### Job
```json
{
  "id": "uuid",
  "status": "pending|processing|done|failed",
  "difficulty": "beginner|intermediate|expert",
  "format": "a4|a3",
  "color_count": 8,
  "created_at": "ISO8601",
  "expires_at": "ISO8601",
  "color_legend": [
    { "symbol": "1", "hex": "#FF6B6B", "name": "Rouge corail" },
    { "symbol": "2", "hex": "#4ECDC4", "name": "Turquoise" },
    { "symbol": "A", "hex": "#FFE66D", "name": "Jaune soleil" }
  ],
  "preview_url": "string|null",
  "coloring_pdf_url": "string|null",
  "reference_pdf_url": "string|null",
  "processing_ms": 3200
}
```

## Endpoints

### POST /jobs
Upload image + créer un job de génération.

**Request** : `multipart/form-data`
- `image` (file, required) : JPEG/PNG/WEBP/HEIC, max 20MB
- `difficulty` (string, required) : `beginner|intermediate|expert`
- `format` (string, default: `a4`) : `a4|a3`

**Response 202**
```json
{ "job_id": "abc123", "status": "pending", "poll_url": "/api/v1/jobs/abc123" }
```

**Errors** : 400 (format invalide), 413 (image trop grande), 422 (fichier corrompu), 429 (rate limit)

---

### GET /jobs/{job_id}
Polling du statut.

**Response 200**
```json
{
  "id": "abc123",
  "status": "done",
  "difficulty": "beginner",
  "format": "a4",
  "color_count": 7,
  "color_legend": [...],
  "preview_url": "/api/v1/jobs/abc123/preview",
  "coloring_pdf_url": "/api/v1/jobs/abc123/coloring-pdf",
  "reference_pdf_url": "/api/v1/jobs/abc123/reference-pdf",
  "processing_ms": 3420,
  "created_at": "2026-03-25T08:00:00Z",
  "expires_at": "2026-03-26T08:00:00Z"
}
```

**Polling recommandé** : toutes les 1s, max 60s avant timeout client.

---

### GET /jobs/{job_id}/preview
PNG preview 800px (rapide, pour affichage avant download PDF).
**Response** : `image/png`

---

### GET /jobs/{job_id}/coloring-pdf
PDF imprimable — contours + zones numérotées + **nuancier en bas de page**.
**Response** : `application/pdf`, `Content-Disposition: attachment; filename="coloriage.pdf"`

Contenu du PDF :
- Page 1 : coloriage (zones blanches avec symbole centré, contours noirs)
- Bas de page : `ColorSwatchLegend` — rangée de carrés 20×20pt avec symbole + hex

---

### GET /jobs/{job_id}/reference-pdf
PDF référence — image originale colorée + nuancier en bas de page.
**Response** : `application/pdf`

---

### GET /health
```json
{ "status": "ok", "version": "1.0.0", "queue_depth": 3 }
```

## Rate Limiting
- Anonyme : 3 jobs/heure (header `X-RateLimit-Remaining`)
- Header `Retry-After` sur 429

## Notes Nuancier
Le champ `color_legend` est retourné dès que `status=done`.
Il permet au frontend d'afficher un aperçu interactif des couleurs avant même le download.
Dans le PDF, le nuancier est rendu par ReportLab avec :
- Carrés colorés 20×20pt
- Symbole centré en noir (9pt, bold)
- Nom de couleur en dessous (6pt, gris)
- Fallback N&B : patterns hachurés uniques par zone
