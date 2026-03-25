# Root Cause — Absence de commentaires MC post-complétion

**Cause** : Ni les sub-agents ni l'orchestrateur ne postent de commentaire sur les tâches MC après complétion. Les sub-agents reçoivent uniquement l'instruction de produire des fichiers, sans consigne de reporting vers MC.

**Impact** : Le board MC ne reflète pas les livrables réels — l'utilisateur ne peut pas voir ce qui a été produit sans lire les logs.

**Fix rétroactif** : Commentaires postés manuellement sur T4 (#44), T5 (#45), T6 (#46) — IDs commentaires 26, 27, 28.

---

## Règle obligatoire pour l'Orchestrateur

> **Après chaque completion event d'un sub-agent**, l'orchestrateur DOIT poster un commentaire sur la tâche MC correspondante via `POST /api/tasks/<id>/comments` avec un résumé en 2-3 bullet points des livrables produits.
