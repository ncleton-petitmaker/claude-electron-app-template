# Knowledge AI upload source parity report

Source de reference: `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2`

Service cible: `/Users/nicolascleton/Documents/Yaka-Bridge/services/connaissance`

## Portee verifiee

- Page source inspectee: `pages/upload/UploadPage.tsx`.
- Composants source inspectes: `components/upload/UploadHub.tsx`, `components/upload/UploadTile.tsx`.
- Page cible corrigee: `components/ConnaissanceNewUpload.tsx`.
- Style cible corrige: `services/connaissance/app/globals.css`.

## Captures

| Etat | Desktop | Mobile |
| --- | --- | --- |
| Source authentifiee | `artifacts/knowledge-ai-parity/source-upload-authenticated-desktop.png` | `artifacts/knowledge-ai-parity/source-upload-authenticated-mobile.png` |
| Cible avant alignement | `artifacts/knowledge-ai-parity/target-upload-before-alignment-desktop.png` | `artifacts/knowledge-ai-parity/target-upload-before-alignment-mobile.png` |
| Cible apres alignement | `artifacts/knowledge-ai-parity/target-upload-source-aligned-desktop.png` | `artifacts/knowledge-ai-parity/target-upload-source-aligned-mobile.png` |

## Corrections apportees

- Remplacement de l'ancien shell `knowledge-v2-app` avec rail icones par le shell source `knowledge-source-app`.
- Navigation cible alignee sur la source: switch `Chat` / `Admin`, liens `Chat`, `Ajouter`, `Connaissances`.
- Etat actif `Ajouter` sur la page `/upload`.
- Profil utilisateur replace en bas de la sidebar desktop, comme la source.
- Suppression de l'ancien conteneur carte `knowledge-v2-main-card` autour du produit.
- Ajout du style `knowledge-source-upload-main` pour garder l'app produit dans le layout source tout en utilisant les tokens Bridge.
- Correction d'un race condition: l'etat intermediaire `processing` ne peut plus ecraser un upload deja `complete` quand l'action Bridge locale repond vite.

## Boutons et comportements testes

- `Scanner`: ouvre la modale `Scanner`.
- `Donnees`: ouvre la modale `Importer des donnees` avec `Fichier statique` et `Google Sheets`.
- `Generer un nouveau questionnaire`: ouvre la modale `Creer un questionnaire`.
- `Texte`: ouvre la modale `Texte`, soumet une note locale, ferme la modale et affiche l'upload `Termine`.
- Verification DOM: aucun label upload attendu ne manque sur `/upload`.
- Verification DOM: l'ancien rail `.knowledge-v2-rail` et l'ancienne carte `.knowledge-v2-main-card` ne sont plus presents sur `/upload`.
- Verification DOM: pas de debordement horizontal sur la cible desktop.

## Ecarts restants

- La source affiche un asset logo casse dans les captures; la cible utilise le logo tokenise `C` du design system Bridge pour rester propre en integration.
- Les icones ne viennent pas encore du meme pack exact que `connaissanceNEW`; elles reproduisent la fonction et la couleur, mais un passage iconographique final reste a faire si on veut une stricte equivalence bitmap.
- Google Sheets doit rester connecte via OAuth/launch ticket Bridge; aucune connexion Supabase client directe ne doit etre restauree.
- Les imports fichier reels, OCR local, extraction locale et ingestion RAG locale restent a brancher derriere les actions Bridge/service.
- Le mode mobile cible est volontairement utilisable; la source mobile capturee coupe fortement le contenu horizontalement. Cet ecart est une adaptation Bridge acceptee, pas un redesign produit.

## Validations executees

- `npm run service:connaissance:typecheck`
- `npm run service:connaissance:build`
- `curl -X POST /api/bridge/actions/knowledge_ai.upload.text`
- Tests navigateur integre sur les modales et l'upload texte.
- Captures Playwright desktop/mobile de la cible apres alignement.
