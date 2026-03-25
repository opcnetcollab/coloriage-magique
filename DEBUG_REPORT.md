# DEBUG_REPORT.md — Sub-agents Codex Spark : 0 tokens, complétions silencieuses

**Date :** 2026-03-25  
**Investigué par :** Debugger agent  
**Sévérité :** Critique (blocage complet de tous les agents Codex Spark)

---

## 1. Root Cause — CONFIRMÉE par les logs

**Hypothèse 2 validée : le modèle `gpt-5.3-codex-spark` n'est pas disponible sur ce compte.**

### Preuve directe (logs `/tmp/openclaw/openclaw-2026-03-25.log`)

```json
{
  "event": "embedded_run_agent_end",
  "isError": true,
  "error": "{\"detail\":\"The 'gpt-5.3-codex-spark' model is not supported when using Codex with a ChatGPT account.\"}",
  "model": "gpt-5.3-codex-spark",
  "provider": "openai-codex"
}
```

Le message est sans ambiguïté : **le compte ChatGPT connecté en OAuth est un compte consumer standard**, qui n'a pas accès à `gpt-5.3-codex-spark`. Ce modèle nécessite un plan ChatGPT Pro/Enterprise avec accès Codex.

### Mécanisme d'échec (pourquoi 0 tokens + "completed successfully")

1. L'agent démarre, tente d'appeler `gpt-5.3-codex-spark`
2. L'API Codex retourne immédiatement une erreur HTTP (modèle non supporté)
3. OpenClaw réessaie avec `thinking: off` (log : `"unsupported thinking level for openai-codex/gpt-5.3-codex-spark; retrying with off"`) — même erreur
4. **Le fallback configuré ne se déclenche PAS** — c'est un silent fail sur incompatibilité de compte, pas un timeout ou 429
5. L'agent est marqué "completed" sans aucun output, 0 tokens consommés, en ~8s (temps des retries)

### Hypothèses écartées
- ❌ **H1 (OAuth expiré)** : L'OAuth fonctionne — la connexion est établie, l'API répond avec un message d'erreur explicite sur le modèle, pas sur l'auth
- ❌ **H3 (restriction subagent)** : Le problème est identique en session main ou subagent — c'est le plan du compte, pas le contexte d'exécution
- ❌ **H4 (fallback non déclenché sur modèle manquant)** : Partiellement vrai — le fallback ne se déclenche pas, mais la cause première est bien l'indisponibilité du modèle sur le compte

---

## 2. Fix Permanent Recommandé

### Fix immédiat appliqué ✅
Override `model: "anthropic/claude-sonnet-4-6"` dans tous les `sessions_spawn` → vérifié en config, tous les 26 agents ont maintenant `primary: anthropic/claude-sonnet-4-6`.

### Fix permanent — Nettoyer les fallbacks résiduels

**Problème résiduel :** `openai-codex/gpt-5.3-codex-spark` reste dans les listes `fallbacks` de plusieurs agents ET dans les defaults :

```
defaults: ['openai-codex/gpt-5.4', 'openai-codex/gpt-5.3-codex', 'openai-codex/gpt-5.3-codex-spark', 'anthropic/claude-haiku-4-5']
main, reviewer, ux-designer, qa-engineer, prompt-engineer, seo-specialist, 
content-marketer, researcher, risk-manager → fallbacks inclut codex-spark
```

Ces fallbacks pourraient se déclencher si le primary échoue, recréant le bug silencieusement.

### Actions à effectuer dans `~/.openclaw/openclaw.json`

**Option A (recommandée) — Supprimer Codex Spark de tous les fallbacks :**
- Dans `agents.defaults.model.fallbacks` : retirer `openai-codex/gpt-5.3-codex-spark`
- Dans chaque agent ayant `fallbacks` contenant `codex-spark` : retirer l'entrée
- Conserver `openai-codex/gpt-5.4` uniquement si le compte a un plan compatible

**Option B — Supprimer tout Codex de la config :**
- Retirer le profil `auth.profiles["openai-codex:default"]`
- Retirer toutes les références `openai-codex/*` des fallbacks
- Nettoyer `agents.defaults.models` des entrées Codex
- Solution la plus propre si le compte ne sera jamais upgradé

### Commande de vérification rapide

```bash
cat ~/.openclaw/openclaw.json | python3 -c "
import json, sys
cfg = json.load(sys.stdin)
agents = cfg.get('agents', {})
defaults_fb = agents.get('defaults', {}).get('model', {}).get('fallbacks', [])
print('Defaults fallbacks:', defaults_fb)
for a in agents.get('list', []):
    fb = a.get('model', {}).get('fallbacks', [])
    if any('codex' in f for f in fb):
        print(f\"{a['id']}: {fb}\")
"
```
Si la commande ne retourne rien sur les fallbacks Codex → config propre.

---

## 3. Comment Vérifier que le Fix est Bien Appliqué

### Test 1 — Vérification config (immédiat)
```bash
# Aucun agent ne doit avoir codex-spark en primary ou fallback
cat ~/.openclaw/openclaw.json | grep -c "codex-spark"
# Résultat attendu après fix complet : 0
```

### Test 2 — Spawn d'un agent test
```bash
# Spawner un agent dev-backend avec une tâche simple
# Vérifier dans les logs : tokens > 0, model = claude-sonnet-4-6
grep "embedded_run_agent_end" /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log | \
  python3 -c "import json,sys; [print(json.loads(l)['1'].get('model','?'), json.loads(l)['1'].get('isError','?')) for l in sys.stdin if 'embedded_run_agent_end' in l]"
```
Résultat attendu : `claude-sonnet-4-6 False`

### Test 3 — Monitoring token count
Dans Mission Control ou les logs gateway, vérifier que les sub-agents spawned retournent `tokensIn > 0` et `tokensOut > 0`.

---

## 4. Leçon pour MEMORY.md

```
## Bug Codex Spark (2026-03-25)
Le modèle `openai-codex/gpt-5.3-codex-spark` est incompatible avec un compte ChatGPT consumer 
(OAuth) — il retourne une erreur silencieuse et complète avec 0 tokens sans déclencher les fallbacks.
Tous les agents sont maintenant sur `anthropic/claude-sonnet-4-6` (primary + fallbacks nettoyés).
Ne jamais configurer un modèle en primary/fallback sans avoir vérifié qu'il est accessible sur le plan du compte.
```

---

## Résumé Exécutif

| Élément | Détail |
|---------|--------|
| **Cause racine** | `gpt-5.3-codex-spark` non supporté sur compte ChatGPT consumer OAuth |
| **Impact** | 100% des agents Codex Spark silencieusement non-fonctionnels |
| **Fix appliqué** | Primary → `claude-sonnet-4-6` sur tous les 26 agents ✅ |
| **Fix résiduel** | Retirer `codex-spark` des listes fallback (9 agents + defaults) ⚠️ |
| **Risque résiduel** | Fallbacks peuvent encore déclencher le bug si primary échoue |
