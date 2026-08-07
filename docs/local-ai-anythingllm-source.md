# AnythingLLM source locale pour Bridge

Ce document fixe AnythingLLM comme source UI principale pour le futur module
`local_ai`.

## Decision

- Repo upstream : `https://github.com/Mintplex-Labs/anything-llm.git`
- Dossier de reference intact : `/Volumes/Docker/anythingllm-upstream`
- Dossier de travail Bridge : `/Volumes/Docker/anythingllm-yaka-bridge`
- Branche upstream : `master`
- Branche de travail Bridge : `yaka-bridge-integration`
- Commit clone le 2026-06-14 : `6442ea9ee675a7779f04c80107bebba44394f042`
- Licence racine lue dans le clone : MIT
- Frontend source : `/Volumes/Docker/anythingllm-yaka-bridge/frontend`
- Backend/RAG/agents source : `/Volumes/Docker/anythingllm-yaka-bridge/server`
- Collector source : `/Volumes/Docker/anythingllm-yaka-bridge/collector`

## Politique UI

L'UI AnythingLLM doit etre copiee et etudiee telle quelle. La premiere variante
Bridge ne doit pas reimplementer les ecrans a la main.

Priorite :

1. Conserver une reference upstream intacte dans `anythingllm-upstream`.
2. Adapter uniquement le worktree `anythingllm-yaka-bridge`.
3. Garder la structure UI AnythingLLM pour les workspaces, documents, chat,
   agents, settings et providers.
4. Ajouter ensuite des variantes de theme qui rappellent le design system Bridge
   sans casser les layouts AnythingLLM.

## Variantes Bridge prevues

- `anythingllm-default` : rendu upstream exact.
- `bridge-warm` : couleurs proches du design system Yaka/Bridge.
- `bridge-compact` : densite adaptee a l'usage ERP quotidien.

Ces variantes doivent etre appliquees par tokens CSS/theme, pas par reecriture
des composants.

Le worktree Bridge contient deja le point d'extension :

```text
/Volumes/Docker/anythingllm-yaka-bridge/frontend/src/bridge-theme-variants.css
```

Ce fichier n'est pas importe par defaut : le rendu upstream exact reste le
premier etat de reference. Bridge pourra ensuite activer
`data-bridge-theme="warm"` ou `data-bridge-theme="compact"` au niveau racine.

## Integration cible

L'utilisateur final ne doit pas installer ou ouvrir une app AnythingLLM separee.

Experience cible :

```text
Bridge / Yaka
-> IA locale
-> interface chat/projets/documents issue de l'UI AnythingLLM
-> execution locale via Bridge daemon et providers locaux/reseau
```

AnythingLLM sert de base UI/fonctionnelle. Bridge reste le plan de controle :
droits, projets Yaka, fichiers autorises, audit, providers locaux et futur DGX
Spark reseau.

## Commandes de verification

```bash
git -C /Volumes/Docker/anythingllm-upstream status --short --branch
git -C /Volumes/Docker/anythingllm-upstream rev-parse --abbrev-ref HEAD
git -C /Volumes/Docker/anythingllm-upstream rev-parse HEAD
git -C /Volumes/Docker/anythingllm-yaka-bridge status --short --branch
```

## Commandes AnythingLLM utiles

Depuis `/Volumes/Docker/anythingllm-yaka-bridge` :

```bash
yarn setup
yarn dev:server
yarn dev:collector
yarn dev:frontend
yarn dev:all
```

Ces commandes viennent du `package.json` racine AnythingLLM. Elles ne sont pas
lancees automatiquement par Bridge tant que l'adaptateur n'est pas defini.
