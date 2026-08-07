# Knowledge AI Knowledge Modals Parity Report

Date: 2026-06-14

## Source active

- Source UI: `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/knowledge`
- Composants inspectes:
  - `GroupDetailModal.tsx`
  - `GenericDetailViewer.tsx`
  - `KnowledgeEditorModal.tsx`
  - `AssociateKnowledgeModal.tsx`
  - `ReplaceContentModal.tsx`
  - `VersionHistoryModal.tsx`

## Cible Bridge

- Service autonome: `/Users/nicolascleton/Documents/Yaka-Bridge/services/connaissance`
- Route testee: `/dashboard`
- Composant cible: `/Users/nicolascleton/Documents/Yaka-Bridge/services/connaissance/components/ConnaissanceNewDashboard.tsx`
- CSS cible: `/Users/nicolascleton/Documents/Yaka-Bridge/services/connaissance/app/globals.css`

## Captures cible

- Groupe desktop: `/Users/nicolascleton/Documents/Yaka-Bridge/artifacts/knowledge-ai-parity/target-dashboard-modal-group-desktop.png`
- Detail desktop: `/Users/nicolascleton/Documents/Yaka-Bridge/artifacts/knowledge-ai-parity/target-dashboard-modal-detail-desktop.png`
- Edition desktop: `/Users/nicolascleton/Documents/Yaka-Bridge/artifacts/knowledge-ai-parity/target-dashboard-modal-editor-desktop.png`
- Association desktop: `/Users/nicolascleton/Documents/Yaka-Bridge/artifacts/knowledge-ai-parity/target-dashboard-modal-associate-desktop.png`
- Remplacement desktop: `/Users/nicolascleton/Documents/Yaka-Bridge/artifacts/knowledge-ai-parity/target-dashboard-modal-replace-desktop.png`
- Versions desktop: `/Users/nicolascleton/Documents/Yaka-Bridge/artifacts/knowledge-ai-parity/target-dashboard-modal-versions-desktop.png`
- Groupe mobile: `/Users/nicolascleton/Documents/Yaka-Bridge/artifacts/knowledge-ai-parity/target-dashboard-modal-group-mobile.png`

## Adaptations realisees

- Remplacement de la modale generique par un panel source-like: overlay sombre, blur, panel arrondi, header iconographique, body scrollable et footer sticky.
- `Voir` groupe: hero dossier, liste des fichiers, chips date/fichiers, actions `Copier le lien` et `Interroger`.
- `Voir` connaissance: onglets iOS selon le type (`Document`, `Resume`, `Texte OCR`, `Automatisation`, etc.), toolbar document et placeholder de preview sans stockage externe.
- `Modifier`: champs titre/resume, visibilite, tags, tags semantiques locaux, recapitulatif de diff avant sauvegarde quand necessaire.
- `Associer`: recherche, liste de connaissances, confirmation source-like si la connaissance quitte un groupe.
- `Remplacer le fichier`: fichier courant, dropzone, choix fichier, raison optionnelle, bouton desactive tant qu'aucun fichier n'est choisi.
- `Historique des versions`: carte version actuelle et etat vide source-like.

## Actions Bridge

- `knowledge_ai.knowledge.get`
- `knowledge_ai.knowledge.update`
- `knowledge_ai.knowledge.associate`
- `knowledge_ai.knowledge.replace_file`
- `knowledge_ai.knowledge.version.restore`
- `knowledge_ai.viewer.action`
- `knowledge_ai.conversation.context.set`
- `knowledge_ai.automation.run`

## Ecarts restants

- Les viewers specialises `VideoDetailViewer`, `AudioDetailViewer`, `SocialDetailViewer` et `EmailThreadViewer` ne sont pas encore portes.
- Le rendu PDF/image/tableur utilise encore des placeholders tant que le stockage Supabase dedie et les URLs signees Bridge ne sont pas branches.
- Les versions precedentes sont encore un etat vide; le chargement reel devra passer par `knowledge_ai.knowledge.version.list`.
- Les captures source live restent bloquees par l'auth de `connaissanceNEW`; la comparaison s'appuie sur le code source actif et les captures cible.

## Verifications

- `npm run service:connaissance:typecheck`
- `npm run service:connaissance:build`
- Verification DOM via navigateur integre sur `http://localhost:3200/dashboard`.
- Captures Playwright locales via Chrome installe.
