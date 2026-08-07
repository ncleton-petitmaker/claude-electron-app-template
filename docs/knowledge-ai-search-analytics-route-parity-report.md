# Rapport routes recherche et analytics Connaissance

Source de verite inspectee :

- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/layout/AppLayout.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/knowledge/KnowledgeBrowser.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/knowledge/KnowledgeFilter.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/types/knowledge.types.ts`

Constat : `app-v2` expose les entrees de navigation `Recherche` et
`Analytics`, mais ne fournit pas deux pages autonomes equivalentes aux routes
Next `/search` et `/analytics`. Les anciennes routes cible redirigeaient vers
`/dashboard`, ce qui rendait les boutons non fonctionnels.

## Adaptation Bridge

- `/search` rend maintenant `SearchWorkspace`.
- `/analytics` rend maintenant `AnalyticsWorkspace`.
- Les deux vues restent dans `services/connaissance`, jamais dans Bridge admin.
- Les vues reprennent le shell Connaissance source-like : logo, switch
  Chat/Admin, navigation produit et profil.
- Les actions visibles appellent le contrat Bridge/service :
  - `knowledge_ai.knowledge.search`
  - `knowledge_ai.knowledge.filter.set`
  - `knowledge_ai.conversation.context.set`
  - `knowledge_ai.viewer.action`
  - `knowledge_ai.analytics.refresh`
  - `knowledge_ai.automation.run`
  - `knowledge_ai.runtime.status`
- Le runtime reste local-only : aucun appel IA externe direct.

## Captures cible

- `artifacts/knowledge-ai-parity/target-search-route-desktop.png`
- `artifacts/knowledge-ai-parity/target-search-route-mobile.png`
- `artifacts/knowledge-ai-parity/target-analytics-route-desktop.png`
- `artifacts/knowledge-ai-parity/target-analytics-route-mobile.png`

## Garde-fou

`scripts/knowledge-service-parity.mjs` verifie maintenant que les routes,
composants et actions de recherche/analytics ne regressent pas en redirections
ou surfaces muettes.

## Ecart assume

Ces routes sont des extensions produit necessaires a Bridge. Elles doivent
rester visuellement coherentes avec Connaissance et respecter les actions
Bridge, mais ne peuvent pas etre marquees comme pixel-perfect source tant
qu'aucune page autonome equivalente n'existe dans `app-v2`.
