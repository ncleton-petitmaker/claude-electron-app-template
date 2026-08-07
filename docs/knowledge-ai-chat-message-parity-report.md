# Parite chat messages Connaissance

Date : 2026-06-14

## Source inspectee

- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/chat/ChatMessage.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/chat/StructuredDataView.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/types/chat.types.ts`

## Cible portee

- `services/connaissance/components/ConnaissanceChatMessage.tsx`
- Alias de parite :
  - `services/connaissance/components/ChatMessage.tsx`
  - `services/connaissance/components/StructuredDataView.tsx`
- Integration chat :
  - `services/connaissance/components/ConnaissanceNewChat.tsx`
- Styles :
  - `services/connaissance/app/globals.css`

## Fonctionnalites visibles portees

- Rendu distinct user / agent / system.
- Avatar agent `C` et avatar utilisateur avec initiales.
- Nom d'emetteur source-like : `Connaissance.pro` / `Vous`.
- Markdown simple : gras, code inline, blocs de code.
- Liens Slack-style `<url|label>`.
- Citations inline `[1]` raccordees aux citations du message.
- Section `Sources (n)` avec cartes source, index, titre, contributeur, date et score.
- Sources web sous forme de badges, sans appel favicon externe.
- Donnees structurees GenBI : KPI, tableau, variantes chart, details SQL, plein ecran chart.
- Timestamp relatif et performance `ms`.

## Adaptations Bridge obligatoires

- Aucun appel direct Supabase client.
- Aucun appel favicon Google copie depuis la source.
- Les clics citation/source passent par actions Bridge/service :
  - `knowledge_ai.citation.open`
  - `knowledge_ai.web_source.open`
- Les reponses chat acceptent `message`, `answer`, `citations`, `webSources`, `structuredData`, `performanceMs` depuis `knowledge_ai.chat.stream`.
- En absence de `BRIDGE_WEB_URL`, l'UI affiche `bridge-url-missing` et ne bascule jamais vers un provider cloud.

## Verification

- `npm run service:connaissance:typecheck` : OK.
- `npm run service:connaissance:build` : OK.
- `node scripts/knowledge-app-v2-inventory.mjs` : OK.
- `node scripts/knowledge-behavior-parity.mjs` : OK.
- Verification navigateur `http://localhost:3200/chat` :
  - page chargee;
  - envoi d'un message;
  - `.knowledge-v2-chat-message` : 2;
  - `.knowledge-v2-chat-bubble` : 2;
  - ancien `.knowledge-v2-bubble` : 0;
  - erreur locale visible : `bridge-url-missing`.
- Capture cible :
  - `artifacts/knowledge-ai-parity/target-chat-message-rich-desktop.png`

## Ecart restant

La comparaison pixel-perfect source/cible du rendu interne source reste non prouvee par screenshot source, car `connaissanceNEW` est bloque par son `LoginPage` Supabase sans session locale. La prochaine etape doit ajouter un harness fixture local-only ou une session de reference non productive pour capturer les ecrans source internes sans contourner l'architecture Bridge.
