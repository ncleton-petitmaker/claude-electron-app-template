# Rapport route parametres Connaissance

Sources inspectees :

- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/App.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/layout/AppLayout.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/components/Settings/SettingsModal.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/components/Settings/sections/SettingsAutomation.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/components/Settings/sections/SettingsWorkflows.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/components/Settings/sections/SettingsConnectors.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/components/Settings/sections/SettingsData.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/components/Settings/sections/SettingsApiKeys.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/components/Settings/sections/SettingsAccount.tsx`

## Changement cible

Avant cette tranche, `/settings` rendait le chat avec une petite modale
`Parametres`. La route est maintenant une vraie surface service dans
`services/connaissance`, avec le shell Connaissance et les sections source :

- Tri automatique
- Integrations
- Connecteurs
- Donnees
- Cles API
- Compte

## Adaptation Bridge

Les appels source directs a Supabase, Edge Functions et API keys sont remplaces
par des actions Bridge/service :

- `knowledge_ai.settings.update`
- `knowledge_ai.settings.automation.save`
- `knowledge_ai.settings.workflow.save`
- `knowledge_ai.connector.connect`
- `knowledge_ai.connector.disconnect`
- `knowledge_ai.data.export`
- `knowledge_ai.data.retention.update`
- `knowledge_ai.api_key.create`
- `knowledge_ai.api_key.revoke`
- `knowledge_ai.account.update`
- `knowledge_ai.account.logout`
- `knowledge_ai.runtime.status`

La page conserve le contexte produit Connaissance mais respecte le mode
local-only : aucune cle IA cloud, aucun fallback OpenAI/Anthropic/Mistral/
Google/Perplexity.

## Captures cible

- `artifacts/knowledge-ai-parity/target-settings-route-desktop.png`
- `artifacts/knowledge-ai-parity/target-settings-route-mobile.png`

## Verification interactive

Playwright a verifie :

- URL finale `/settings`.
- Shell `.knowledge-source-app` present.
- 6 sections parametres visibles.
- Ancienne modale chat `knowledge-v2-modal[aria-label="Paramètres"]` absente.
- Pas de `bridge-url-missing`.
- Pas d'overflow horizontal mobile.
- Les sections `Tri automatique`, `Integrations`, `Connecteurs`, `Donnees`,
  `Cles API`, `Compte` affichent chacune 3 lignes.
- Une action par section repond en HTTP 200 via `/api/bridge/actions/*`.

## Ecart assume

La source expose ces parametres sous forme de modal. Dans Bridge, `/settings`
devient une route service dediee pour eviter d'empiler l'interface produit dans
le chat et pour rendre les actions agentic-first. La composition reste
Connaissance et non admin Bridge.
