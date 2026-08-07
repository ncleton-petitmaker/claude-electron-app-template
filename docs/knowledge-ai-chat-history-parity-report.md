# Parite historique chat Connaissance

Date : 2026-06-14

## Source inspectee

- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/chat/ChatHistory.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/types/chat.types.ts`

## Cible portee

- `services/connaissance/components/ChatHistory.tsx`
- Integration :
  - `services/connaissance/components/ConnaissanceNewChat.tsx`
- Styles :
  - `services/connaissance/app/globals.css`

## Fonctionnalites visibles portees

- Titre `Historique`.
- Bouton `Nouveau`.
- Recherche `Rechercher...`.
- Groupes par date : `Aujourd'hui`, `Hier`, `Cette semaine`, `Ce mois`, `Plus ancien`.
- Item conversation avec icone mode RAG/LLM, titre, dernier message, date relative et compteur messages.
- Etat selectionne avec bordure jaune a droite.
- Etat archive avec label `Archivee`.
- Toggle `Voir archivees` / `Masquer archivees`.
- Etats loading skeleton et empty/search empty.
- Actions hover : archiver/desarchiver, supprimer.

## Actions Bridge raccordees

- Selection : `knowledge_ai.conversation.load`.
- Nouveau : `knowledge_ai.conversation.clear`.
- Archive/desarchive : `knowledge_ai.conversation.archive`.
- Suppression : `knowledge_ai.conversation.delete`.

## Verification cible

- `npm run service:connaissance:typecheck` : OK.
- `npm run service:connaissance:build` : OK.
- `node scripts/knowledge-app-v2-inventory.mjs` : OK.
- `node scripts/knowledge-behavior-parity.mjs` : OK.
- Verification navigateur `http://localhost:3200/chat` :
  - `.knowledge-v2-history` present;
  - titre `Historique`;
  - 3 conversations non archivees visibles;
  - toggle `Voir archivees` present;
  - apres toggle : 4 conversations, 1 archivee, footer `Masquer archivees`.
- Capture cible :
  - `artifacts/knowledge-ai-parity/target-chat-history-desktop.png`

## Ecart restant

La comparaison pixel-perfect source/cible n'est pas encore prouvee par screenshot source interne, car `connaissanceNEW` reste bloque par `LoginPage` sans session Supabase locale. Le prochain passage doit capturer la source via un harness fixture local-only, puis comparer les espacements exacts et l'etat hover des actions.
