# Parite upload Connaissance

Date : 2026-06-14

## Source inspectee

- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/App.tsx`
  - `CONTENT_UPLOAD_TYPES`
  - `SOCIAL_UPLOAD_TYPES`
  - `QUESTIONNAIRE_TYPES`
  - `UploadView`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/upload/UploadHub.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/upload/UploadTile.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/upload/UploadProgress.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/upload/GoogleSheetsPickerModal.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/upload/ScannerModal.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/upload/ScreenRecordModal.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/pages/upload/UploadPage.tsx`

## Cible portee

- `services/connaissance/components/ConnaissanceNewUpload.tsx`
- `services/connaissance/components/UploadTypes.ts`
- `services/connaissance/components/UploadTile.tsx`
- `services/connaissance/components/UploadProgress.tsx`
- `services/connaissance/components/GoogleSheetsPickerModal.tsx`
- Styles : `services/connaissance/app/globals.css`

## Fonctionnalites visibles portees

- Titre compact `Ajouter du contenu`.
- Rail lateral Connaissance avec etat actif sur Upload.
- Grille principale source active : PDF, Scanner, Video, Ecran, Audio, URL, Texte, Donnees.
- Section `Reseaux sociaux` : YouTube, LinkedIn, X.
- Section `Demander la connaissance a des tiers` : Generer un nouveau questionnaire, Partager un questionnaire existant.
- Modal intermediaire `Importer des donnees` avec `Fichier statique` et `Google Sheets`.
- Composant nominal `UploadTile` conserve dans le service, mais la vue produit active suit maintenant `UploadView` de `App.tsx`.
- Composant nominal `UploadProgress` et panneau d'uploads avec progression, annulation et nettoyage des termines/erreurs.
- Modal texte/URL generique raccorde aux actions Bridge.
- Modal scanner avec actions `Importer un PDF` et `Telecharger sur l'App Store`.
- Modal enregistrement ecran avec demande `getDisplayMedia`, etat recording, preview video et import.
- Modal Google Sheets avec etats `initial`, `authenticating`, `authenticated/selecting`, `error`.
- Modal questionnaire avec erreur Bridge visible en absence de Bridge URL.

## Adaptation Bridge stricte

- Aucune auth Google directe cote client pour Google Sheets.
- Le bouton Google Sheets appelle `knowledge_ai.upload.google_sheets` via Bridge/service.
- En absence de Bridge URL locale, l'erreur reste visible dans le modal (`bridge-url-missing`) au lieu de simuler une connexion reussie.
- Les uploads visibles passent par les actions `knowledge_ai.upload.*`.
- La suppression d'un upload en cours appelle `knowledge_ai.knowledge.processing.remove`.

## Actions Bridge raccordees

- Texte : `knowledge_ai.upload.text`.
- Fichier generique/PDF/image/audio/video/screen recording : `knowledge_ai.upload.file`.
- URL/Web Scrape/Unsplash/Questionnaire : `knowledge_ai.upload.url`.
- YouTube : `knowledge_ai.upload.youtube`.
- LinkedIn : `knowledge_ai.upload.linkedin`.
- X : `knowledge_ai.upload.twitter`.
- Tableur statique : `knowledge_ai.upload.spreadsheet`.
- Google Sheets : `knowledge_ai.upload.google_sheets`.
- Annuler upload : `knowledge_ai.knowledge.processing.remove`.
- Generer questionnaire : `knowledge_ai.questionnaire.generate`.
- Partager questionnaire : `knowledge_ai.questionnaire.share`.

## Verification cible

- `npm run service:connaissance:typecheck` : OK.
- `npm run service:connaissance:build` : OK.
- `node scripts/knowledge-app-v2-inventory.mjs` : OK.
- `node scripts/knowledge-behavior-parity.mjs` : OK.
- `npm run security:grep` : OK.
- Verification navigateur `http://localhost:3200/upload` :
  - `.knowledge-v2-upload-hub` present;
  - titre `Ajouter du contenu`;
  - `.knowledge-v2-source-upload` present;
  - 13 boutons visibles;
  - sections `Reseaux sociaux` et `Demander la connaissance a des tiers`;
  - modal `Importer des donnees` ouvert depuis `Donnees`;
  - modal Google Sheets ouvert depuis le choix `Google Sheets`;
  - modal questionnaire ouvert depuis `Generer un nouveau questionnaire`;
  - erreur Bridge visible apres tentative questionnaire sans Bridge URL;
  - etat erreur Bridge visible apres tentative de connexion sans Bridge URL.
- Captures cible :
  - `artifacts/knowledge-ai-parity/target-upload-compact-source-aligned-desktop.png`
  - `artifacts/knowledge-ai-parity/target-upload-data-source-modal-desktop.png`
  - `artifacts/knowledge-ai-parity/target-upload-google-sheets-modal-desktop.png`
  - `artifacts/knowledge-ai-parity/target-upload-google-sheets-error-desktop.png`
  - `artifacts/knowledge-ai-parity/target-upload-questionnaire-modal-desktop.png`
  - `artifacts/knowledge-ai-parity/target-upload-questionnaire-error-desktop.png`

## Ecart restant

La capture source live de l'ecran upload n'est pas encore disponible : `connaissanceNEW` demarre sur `LoginPage` sans session Supabase locale et aucun bypass demo app-v2 n'a ete trouve. Le serveur source a ete relance temporairement sur `5174`, puis arrete et `index.html` a ete restaure depuis `index.html.bak`.

Important : la source app-v2 contient plusieurs surfaces upload. La vue produit active dans `AuthenticatedApp` est `UploadView` dans `App.tsx`; la cible a ete recalee sur cette vue compacte, pas sur la variante exportee `components/upload/UploadHub`.

La comparaison finale pixel-perfect devra donc passer par l'une de ces preuves source :

- session Supabase locale valide pour ouvrir l'app source;
- harness fixture local-only qui monte les composants source `UploadHub`/modals sans auth;
- captures source existantes et datees si elles sont fournies.

Ce rapport ne marque pas la parite globale comme terminee.
