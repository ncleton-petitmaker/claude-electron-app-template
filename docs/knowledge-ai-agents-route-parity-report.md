# Rapport route agents Connaissance

Source de verite inspectee :

- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/App.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/chat/SlashCommandMenu.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/knowledge/GroupDetailModal.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/knowledge/AutomationTab.tsx`

Constat : `app-v2` ne contient pas de page autonome `agents`. Les agents sont
une exigence Bridge du module `knowledge_ai`, pas une route source exacte.

## Adaptation Bridge

- `/agents` ne redirige plus vers `/settings`.
- La route produit vit dans `services/connaissance/app/agents/page.tsx`.
- La vue utilise le shell Connaissance source-like : logo, switch Chat/Admin,
  navigation Chat/Ajouter/Connaissances et profil.
- Les actions visibles appellent le contrat Bridge/service :
  - `knowledge_ai.agent.create`
  - `knowledge_ai.agent.test`
  - `knowledge_ai.agent.update`
  - `knowledge_ai.agent.duplicate`
  - `knowledge_ai.agent.archive`
- Le runtime reste `local-only` : LM Studio local, Bridge Codex, DGX Spark LAN
  desactive en v1.

## Captures cible

- Desktop :
  `artifacts/knowledge-ai-parity/target-agents-route-desktop.png`
- Mobile :
  `artifacts/knowledge-ai-parity/target-agents-route-mobile.png`

Checks Playwright :

- URL finale `/agents`, sans redirection `/settings`.
- Shell `.knowledge-source-app` present.
- 3 agents demo visibles.
- 4 actions agent visibles.
- Pas de `bridge-url-missing`.
- Pas d'overflow horizontal mobile.

## Ecart assume

Cette route est une extension produit necessaire a Bridge. Elle doit rester
visuellement coherente avec Connaissance, mais elle ne peut pas etre marquee
comme pixel-perfect source tant qu'aucun ecran agents equivalent n'existe dans
`app-v2`.
