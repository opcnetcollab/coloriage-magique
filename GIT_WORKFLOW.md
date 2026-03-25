# GIT_WORKFLOW.md — Coloriage Magique

> Stratégie de coordination inter-agents via Git branching.

## Règle d'or

**Aucun commit direct sur `main`** sauf pour le scaffolding initial.
Chaque agent travaille sur **sa propre branche dédiée**.

---

## Branches de référence

| Branche | Propriétaire | Usage |
|---------|-------------|-------|
| `main` | Orchestrateur | Code stable, production-ready |
| `feat/backend` | `dev-backend` | API FastAPI, logique serveur |
| `feat/frontend` | `react-nextjs` | Next.js 14, composants UI |
| `feat/image-processing` | `dev-backend` | Pipeline k-means, Canny, numérotation |
| `feat/pdf-generation` | `dev-backend` | Génération PDF + nuancier |
| `feat/ci-cd` | `devops` | GitHub Actions, Docker |
| `fix/security` | `security-auditor` | Correctifs sécurité |
| `fix/<bug-description>` | `debugger` | Correctifs bugs ciblés |
| `docs/<topic>` | `doc-engineer` | Documentation |

---

## Workflow obligatoire

```
1. Créer/checkout la branche dédiée
   git checkout -b feat/<feature> main

2. Travailler sur la branche
   git add .
   git commit -m "feat(scope): description courte

   - détail 1
   - détail 2

   Agent: <agent-id>"

3. Pusher la branche
   git push origin feat/<feature>

4. Ouvrir une PR vers main
   gh pr create --base main --title "feat: description" --body "Closes #<issue>"

5. L'orchestrateur review + merge
   gh pr merge <PR_NUMBER> --squash
```

---

## Conventions de commit

Format : `<type>(<scope>): <description>`

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation uniquement |
| `refactor` | Refactoring sans nouvelle feature |
| `test` | Ajout/modification de tests |
| `chore` | Maintenance (deps, config) |
| `ci` | CI/CD |

**Footer obligatoire** : `Agent: <agent-id>` pour la traçabilité

---

## Règles de coordination

1. **Avant de commencer** : vérifier qu'aucun autre agent ne travaille sur le même fichier
   ```bash
   gh pr list --state open
   ```

2. **Conflits de merge** : l'orchestrateur arbitre — ne pas tenter de résoudre soi-même

3. **Durée max d'une branche** : une tâche MC = une branche = une PR. Pas de branches longue durée.

4. **Nommage** : toujours préfixer par le type (`feat/`, `fix/`, `docs/`, `chore/`)

---

## Traçabilité agent

Chaque commit DOIT inclure dans le message ou le footer :
- `Agent: <agent-id>` (ex: `Agent: dev-backend`)
- Optionnel : `Task: MC#<task-id>`

Exemple complet :
```
feat(api): add image upload endpoint

- POST /api/upload accepts multipart/form-data
- Validates file type (PNG, JPG, WEBP)
- Returns job_id for async processing

Agent: dev-backend
Task: MC#42
```

---

## Merge strategy

- **PRs dev** → squash merge (historique propre sur main)
- **PRs hotfix** → merge commit (pour traçabilité urgence)
- **Pas de force push** sur `main` ni sur les branches d'autres agents

---

## Urgences

Si un bug critique en prod :
1. `debugger` ouvre une branche `hotfix/<description>`
2. Fix rapide + PR immédiate
3. Orchestrateur merge en priorité avec `gh pr merge --merge`
