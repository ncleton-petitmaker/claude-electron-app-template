# Parite chat raccourcis Connaissance

Date : 2026-06-14

## Source

- Code source inspecte :
  - `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/chat/ShortcutsBar.tsx`
  - `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/chat/SlashCommandMenu.tsx`
  - `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/chat/ShortcutsManagerModal.tsx`
  - `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/types/chat.types.ts`
- Serveur source lance sur `http://127.0.0.1:5174/index-app-v2.html`.
- Blocage visuel source : la source affiche `LoginPage` et exige une session Supabase. Aucune session Supabase reelle n'a ete forcee, afin de respecter le mode sans appel IA externe et de ne pas contourner l'auth.
- Capture du blocage source : `artifacts/knowledge-ai-parity/source-app-v2-login-blocked-desktop.png`.

## Cible portee

- Composant cible ajoute : `services/connaissance/components/ConnaissanceShortcuts.tsx`.
- Chat cible connecte : `services/connaissance/components/ConnaissanceNewChat.tsx`.
- Styles cible ajoutes : `services/connaissance/app/globals.css`.

## Fonctionnalites visibles portees

- Barre horizontale de raccourcis quand le composer est focus et vide.
- Boutons de raccourcis avec icones source-like.
- Bouton d'edition des raccourcis.
- Menu slash `/` avec :
  - en-tete `Raccourcis`;
  - liste filtree des raccourcis;
  - etat vide de recherche;
  - action `Creer un raccourci`.
- Modale `Mes raccourcis` avec :
  - info banner;
  - ordre des 4 premiers raccourcis visibles;
  - boutons monter/descendre;
  - bouton modifier;
  - bouton supprimer;
  - ecran creation;
  - ecran edition;
  - choix mode `Connaissance Pro` / `LLM Direct`;
  - grille d'icones;
  - apercu.

## Actions Bridge raccordees

- Selection raccourci : `knowledge_ai.shortcut.track_usage`.
- Creation : `knowledge_ai.shortcut.create`.
- Edition : `knowledge_ai.shortcut.update`.
- Reordonnancement : `knowledge_ai.shortcut.reorder`.
- Suppression : `knowledge_ai.shortcut.delete`.

## Verification cible

- `npm run service:connaissance:typecheck` : OK.
- `npm run service:connaissance:build` : OK.
- Verification navigateur `http://localhost:3200/chat` :
  - barre de raccourcis presente;
  - menu slash present;
  - modale gestion presente apres correction du bug de blur.
- Captures cible :
  - `artifacts/knowledge-ai-parity/target-chat-shortcuts-bar-desktop.png`
  - `artifacts/knowledge-ai-parity/target-chat-slash-menu-desktop.png`
  - `artifacts/knowledge-ai-parity/target-chat-shortcuts-manager-desktop.png`

## Ecart restant

La comparaison pixel-perfect source/cible de ces trois surfaces n'est pas encore prouvee par screenshot interne source, car la source est bloquee par `LoginPage`. Prochaine etape : ajouter un mode fixture local de reference ou un adapter auth local-only dans une copie de travail source/cible pour capturer les ecrans internes sans session Supabase reelle.
