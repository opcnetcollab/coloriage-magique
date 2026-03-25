# DEBUG_MC_STATUS.md — Désynchronisation Mission Control / Workspace

**Date :** 2026-03-25  
**Investigué par :** Debugger agent  
**Sévérité :** Haute (tâches bloquées en `in_progress` malgré code livré)

---

## 1. État constaté vs état attendu

| Ticket | Tâche | Agent MC ID | Statut MC avant fix | Fichiers workspace | Statut attendu | Action effectuée |
|--------|-------|-------------|---------------------|--------------------|----------------|-----------------|
| COLOR-001 | T1 — Architecture + ADR | 28 | `done` ✅ | `architecture/ADR.md` | `done` | — (déjà correct) |
| COLOR-002 | T2 — Contrat API | 27 | `done` ✅ | `api/API_CONTRACT.md` | `done` | — (déjà correct) |
| COLOR-003 | T3 — Design system + maquettes | 13 | `in_progress` | Aucun fichier `.stitch/`, pas de DESIGN.md | `in_progress` | Laissé tel quel — non terminé |
| COLOR-004 | T4 — Setup scaffolding | 38 | `in_progress` ❌ | Monorepo complet, `.github/workflows/`, `.editorconfig`, `tsconfig.json` | `done` | **Corrigé → `done`** ✅ |
| COLOR-005 | T5 — Backend FastAPI | 14 | `in_progress` ❌ | `apps/api/` complet avec routes, services, tests | `done` | **Corrigé → `done`** ✅ |
| COLOR-006 | T6 — Frontend Next.js | 35 | `in_progress` ❌ | `apps/web/` complet avec composants, tests Vitest | `done` | **Corrigé → `done`** ✅ |
| COLOR-007 | T7 — Code review | 15 | `in_progress` | Aucun rapport de review produit | `in_progress` | Laissé tel quel — non terminé |
| COLOR-008 | T8 — Audit sécurité | 29 | `in_progress` | Aucun rapport d'audit produit | `in_progress` | Laissé tel quel — non terminé |
| COLOR-009 | T9 — QA + tests | 30 | `assigned` | Tests unitaires dans T5/T6, pas de rapport QA global | `assigned` | Laissé tel quel |
| COLOR-010 | T10 — Documentation | 33 | `assigned` | `README.md` basique présent | `assigned` | Laissé tel quel |
| COLOR-011 | T11 — Déploiement VPS | 31 | `assigned` | `docker-compose.yml`, `nginx.conf`, `Dockerfiles` présents | `in_progress` (partiel) | Non corrigé — déploiement MCP Hostinger non effectué |

---

## 2. Root Cause — L'orchestrateur n'appelle pas MC après completion des sub-agents

### Mécanisme de la désynchronisation

Le cycle de vie d'une tâche requiert **3 appels explicites** à l'API MC :

```
1. Spawn agent  →  PUT /api/tasks/<id>  { status: "in_progress" }      ← fait par l'orchestrateur
2. Agent termine ses fichiers                                            ← fait par le sub-agent
3. Completion event reçu → PUT /api/tasks/<id> { status: "review" }    ← MANQUANT ❌
4. Quality review → POST /api/quality-review { status: "approved" }    ← MANQUANT ❌
```

**L'orchestrateur fait l'étape 1 mais oublie les étapes 3 et 4 après reception des completion events des sub-agents.**

MC n'est pas un observateur passif du workspace — il ne détecte pas automatiquement quand des fichiers sont créés. **Toute transition de statut doit être déclenchée manuellement via l'API.**

### Pourquoi T3, T7, T8 restent `in_progress` légitimement

Ces agents ont été spawned (statut passé à `in_progress`) mais n'ont produit aucun livrable workspace :
- **T3 (ux-designer)** : Pas de dossier `.stitch/`, pas de `DESIGN.md` → agent probablement victime du bug Codex Spark (voir `DEBUG_REPORT.md`) ou non terminé
- **T7 (reviewer)** : Pas de rapport de code review → idem
- **T8 (security-auditor)** : Pas de rapport d'audit → idem

Ces tâches sont **correctement** `in_progress` dans MC puisqu'elles ne sont pas finies.

---

## 3. Fix — Procédure obligatoire à la fin de chaque sub-agent

### Pattern à implémenter dans l'orchestrateur

```javascript
// Après réception du completion event d'un sub-agent :
async function onAgentComplete(taskId, summary) {
  // Étape 1 : passer en review
  await fetch(`${MC_URL}/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'x-api-key': MC_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'review' })
  });

  // Étape 2 : approuver (quality-review)
  await fetch(`${MC_URL}/api/quality-review`, {
    method: 'POST',
    headers: { 'x-api-key': MC_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, status: 'approved', notes: summary })
  });

  // Étape 3 : passer l'agent MC en idle
  await fetch(`${MC_URL}/api/agents/${mcAgentId}/status`, {
    method: 'PATCH',
    headers: { 'x-api-key': MC_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'idle', activity: 'Tâche terminée' })
  });
}
```

### Règle mnémotechnique pour l'orchestrateur

> **Chaque sub-agent qui renvoie sa completion** → immédiatement :  
> `PUT task → review` + `POST quality-review approved` + `PATCH agent → idle`

Ce triple appel est **non-négociable** et doit figurer dans le template de spawn de chaque agent.

---

## 4. Statuts MC après corrections (état final)

```
COLOR-001  done        ✅  Architecture ADR
COLOR-002  done        ✅  Contrat API
COLOR-003  in_progress ⏳  Design (non terminé)
COLOR-004  done        ✅  Scaffolding (corrigé)
COLOR-005  done        ✅  Backend FastAPI (corrigé)
COLOR-006  done        ✅  Frontend Next.js (corrigé)
COLOR-007  in_progress ⏳  Code review (non terminé)
COLOR-008  in_progress ⏳  Audit sécurité (non terminé)
COLOR-009  assigned    📋  QA (non démarré)
COLOR-010  assigned    📋  Documentation (non démarré)
COLOR-011  assigned    📋  Déploiement (fichiers partiels, MCP Hostinger non exécuté)
```

---

## 5. Actions suivantes recommandées

1. **T3 (Design)** : Re-spawner `ux-designer` avec skill `ux-vision` (claude-sonnet-4-6, pas Codex Spark)
2. **T7 (Review)** : Re-spawner `reviewer` pour review du backend + frontend livrés
3. **T8 (Audit)** : Re-spawner `security-auditor` (upload, MIME, rate-limit, RGPD)
4. **T11 (Deploy)** : Spawner `devops` pour push GitHub + déploiement MCP Hostinger (docker-compose.yml et Dockerfiles sont prêts)
5. **Mettre à jour AGENTS.md** : Ajouter la règle "après chaque completion event → 3 appels MC obligatoires"
