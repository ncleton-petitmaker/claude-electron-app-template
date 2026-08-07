# Knowledge AI chat runtime and source parity report

Date: 2026-06-14

## Scope

Tranche traitee: chat Connaissance, contrat d'action local-only et premiere
comparaison visuelle source/cible.

Source de verite inspectee:

- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/App.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/pages/chat/ChatPage.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/chat/ChatPanel.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/chat/ChatInput.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/chat/ChatMessage.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/chat/StructuredDataView.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/stores/authStore.ts`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/stores/chatStore.ts`

## Fixes faits

- `services/connaissance/app/api/bridge/actions/[id]/route.ts`
  lit maintenant `params` comme une promesse Next 16. Avant ce correctif,
  `params.id` valait `undefined`, donc `knowledge_ai.chat.stream` tombait
  toujours dans le fallback generique.
- Le fallback standalone local pour `knowledge_ai.chat.stream` et
  `knowledge_ai.chat.send` renvoie maintenant une reponse riche compatible UI:
  `message`, `citations`, `webSources`, `structuredData` et `performanceMs`.
- Les reponses de l'action sont marquees `no-store`, et la route est forcee
  dynamique.
- Le bouton visible "Retirer le contexte" appelle maintenant
  `knowledge_ai.conversation.context.set` au lieu de seulement modifier l'etat
  React local.

## Verification contrat

Commande:

```bash
curl -sS -X POST http://localhost:3200/api/bridge/actions/knowledge_ai.chat.stream \
  -H 'content-type: application/json' \
  --data '{"message":"test"}'
```

Resultat verifie:

- `ok: true`
- `action: knowledge_ai.chat.stream`
- `mode: standalone-local`
- 3 citations
- 1 source web
- tableau structure `Production par site`
- aucun `bridge-url-missing`

## Captures produites

Source app-v2 non authentifiee:

- `artifacts/knowledge-ai-parity/source-chat-empty-desktop.png`
- `artifacts/knowledge-ai-parity/source-chat-empty-mobile.png`

Ces captures prouvent que la source Vite demarre naturellement sur
`Connexion par email` sans session.

Source app-v2 authentifiee via contexte Playwright mocke, sans modifier
connaissanceNEW:

- `artifacts/knowledge-ai-parity/source-chat-authenticated-desktop.png`
- `artifacts/knowledge-ai-parity/source-chat-authenticated-mobile.png`

Cible service:

- `artifacts/knowledge-ai-parity/target-chat-empty-desktop.png`
- `artifacts/knowledge-ai-parity/target-chat-rich-response-desktop.png`
- `artifacts/knowledge-ai-parity/target-chat-rich-response-mobile.png`
- `artifacts/knowledge-ai-parity/target-chat-source-aligned-empty-desktop.png`
- `artifacts/knowledge-ai-parity/target-chat-source-aligned-rich-desktop.png`
- `artifacts/knowledge-ai-parity/target-chat-source-aligned-empty-mobile-fixed-2.png`

## Ecart bloquant identifie puis reduit

La premiere cible n'etait pas fidele a l'ecran chat authentifie principal de
`src/app-v2/App.tsx`.

Source authentifiee observee:

- sidebar gauche large `w-72`;
- logo Connaissance en haut;
- switch Chat/Admin;
- navigation verticale: Chat, Ajouter, Connaissances;
- section Historique avec etat vide;
- profil utilisateur en bas;
- zone centrale avec header compact `Connaissance Pro` et `Autres modeles`;
- input placeholder `Posez une question...`;
- raccourcis visibles: Traduire, Brainstorm, Post LinkedIn, Fiche de synthese.

Ancienne cible observee:

- rail gauche etroit + panneau historique separe;
- panneau fichiers partages a droite;
- empty state centre avec avatar C et suggestions Resumer/Rechercher/Comparer/Plan d'action;
- input placeholder `Posez une question sur vos connaissances...`;
- contexte `Base de connaissances`;
- reponse riche fonctionnelle avec sources et table.

Corrections appliquees ensuite:

- sidebar large source-like;
- switch Chat/Admin;
- navigation Chat/Ajouter/Connaissances;
- historique vide source-like;
- profil utilisateur en bas sur desktop;
- header `Connaissance Pro` / `Autres modeles`;
- placeholder `Posez une question...`;
- raccourcis source: Traduire, Brainstorm, Post LinkedIn, Fiche de synthese;
- suppression du panneau `Fichiers partages` dans `/chat`;
- conservation du runtime riche local-only.

Conclusion: le runtime chat local est corrige et le layout desktop se rapproche
fortement de la source authentifiee. Le mobile source brut clippe fortement; la
cible Bridge a donc ete adaptee pour supprimer l'overflow horizontal tout en
conservant les boutons et raccourcis source. Cette adaptation est volontaire et
documentee.

## Prochaines actions obligatoires

1. Continuer le pixel pass desktop: logo source reel, espacements exacts,
   icones exactes, ombres et typographies.
2. Conserver le contrat Bridge deja corrige pour `knowledge_ai.chat.stream`.
3. Brancher la persistance reelle des conversations et raccourcis via Supabase
   dedie + actions Bridge.
4. Conserver les boutons d'action visibles et les relier aux actions
   `knowledge_ai.*`.
5. Remplacer les donnees demo par les donnees service tout en gardant l'etat
   vide source quand aucune conversation n'existe.
