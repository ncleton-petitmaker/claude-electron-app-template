# Knowledge AI parity matrix

Source de reference: `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2`

Reference commit: `740833652b6b4472fc8b08e3ea04a94ca649d21b`

Regle d'integration: reproduire l'interface, les boutons, les chemins et les
fonctionnalites visibles dans le service Connaissance independant, puis
remplacer les appels IA par Bridge Codex, LM Studio local ou DGX Spark LAN
desactive en v1. L'auth et les connexions tierces doivent passer par Bridge et
ses scopes, jamais par des cles IA cloud dans le runtime `knowledge_ai`.

Bridge ne contient que `/connaissance` comme launcher et `/admin/knowledge-ai`
comme configuration. Les chemins produit ci-dessous sont des chemins du service
Connaissance, pas des routes `app/` du shell Bridge.

## Navigation globale

| Surface source | Boutons / chemins source | Cible Bridge | Etat |
| --- | --- | --- | --- |
| `AuthenticatedApp` dans `App.tsx` | sidebar large, logo, switch Chat/Admin, nav Chat/Ajouter/Connaissances, Historique, profil utilisateur | service `/chat` a ete realigne: sidebar large, switch, nav, historique vide, profil desktop, header source-like | Partiel avance, pixel pass restant |
| `AppLayout` / variante composants | rail icones: Chat, Upload, Dashboard, Recherche, Analytics, Parametres, avatar | service `/chat`, `/upload`, `/dashboard`, `/search`, `/analytics`, `/settings` | Variante non canonique pour le chat principal, a ne plus utiliser comme seule reference |
| `AppLayout` Recherche/Analytics | entrees navigation Recherche et Analytics | service `/search` et `/analytics` rendent maintenant des vues produit dediees avec shell Connaissance et actions Bridge `knowledge_ai.knowledge.search` / `knowledge_ai.analytics.refresh` | Extension Bridge compatible; plus de redirection dashboard |
| `SettingsModal` | Tri automatique, Integrations, Connecteurs, Donnees, Cles API, Compte | service `/settings` rend une surface dediee avec shell Connaissance et actions Bridge `knowledge_ai.settings.*`, `connector.*`, `data.*`, `api_key.*`, `account.*` | Extension Bridge compatible; ancienne modale chat remplacee par route service pour respecter l'architecture |
| `TabNavigation` | Chat, Upload, Dashboard | service `/chat`, `/upload`, `/dashboard` | Partiel, captures cible faites |
| `Sidebar` | Historique, Fermer, Nouvelle conversation, items actifs | service Connaissance | Partiel sur chat, a etendre aux comportements reels |
| `ChatPage` legacy | Historique slide, RAG/LLM, selecteur modele, nouveau chat | service Connaissance | Reference secondaire; le layout source authentifiee `AuthenticatedApp` prime pour `/chat` |

## Chat

| Surface source | Elements attendus | Cible Bridge | Etat |
| --- | --- | --- | --- |
| `AuthenticatedApp` chat principal | sidebar large, switch Chat/Admin, nav Chat/Ajouter/Connaissances, historique vide, profil bas, header Connaissance Pro/Autres modeles | cible alignee sur ces elements; panneau fichiers supprime du chat | Partiel avance |
| `ChatView` / `ChatPanel` | header Connaissance Pro, avatar/logo, mode Connaissance Pro/Autres modeles ou LLM, messages, typing dots, attacher, micro, envoyer | service Connaissance | Partiel avance, pixel spacing/icones a affiner |
| `ChatInput` | input source `Posez une question...`, raccourcis rapides, slash `/`, attacher fichier, options modele, reasoning, pro, micro, send | service Connaissance | Partiel avance: placeholder, raccourcis source et actions visibles presents |
| `ChatMessage` | bulles user/agent, citations, web sources, donnees structurees | service Connaissance | Partiel avance: action locale riche verifiee par capture; streaming reel et persistance restent a brancher |
| `ChatHistory` | section Historique source, etat vide "Pas encore de conversations", nouveau chat | service Connaissance | Partiel avance: etat vide source-like; persistance reelle a brancher |
| `ShortcutsBar` | Traduire, Brainstorm, Post LinkedIn, Fiche de synthese + edition | service Connaissance | Partiel avance: raccourcis source visibles desktop/mobile |
| `ShortcutsManagerModal` | creer, modifier, supprimer, reordonner raccourcis | service Connaissance + `knowledge_ai_shortcuts` | Partiel, persistance a brancher |
| `SlashCommandMenu` | menu slash filtrable | composer service | Partiel |
| `StructuredDataView` | rendu tableaux/listes/objets | service Connaissance | Partiel avance: table `Production par site` capturee apres action locale |

## Upload

| Surface source | Elements attendus | Cible Bridge | Etat |
| --- | --- | --- | --- |
| `AuthenticatedApp` upload | sidebar large, logo, switch Chat/Admin, nav Chat/Ajouter/Connaissances, profil bas, contenu centre | service `/upload` aligne sur le shell source avec `Ajouter` actif; ancien rail/carte supprimes | Partiel avance, captures desktop/mobile faites |
| `UploadPage` / `UploadHub` source | titre `Ajouter du contenu`, grille PDF, Scanner, Video, Ecran, Audio, URL, Texte, Donnees | service `/upload` | Partiel avance, labels complets verifies |
| `UploadHub` reseaux sociaux | YouTube, LinkedIn, X | service `/upload` | Partiel avance |
| `UploadHub` tiers | Generer un nouveau questionnaire, Partager un questionnaire existant | service `/upload` | Partiel avance |
| `UploadProgress` | status upload/processing/completed/error, annuler, effacer termines | service `/upload` | Partiel avance; race condition upload local corrigee et test Texte termine |
| `ScannerModal` | scanner via app mobile / import PDF | service Connaissance sans appel IA externe | Partiel avance; ouverture modale verifiee |
| `DataSourceModal` / `GoogleSheetsPickerModal` | choix fichier statique ou Google Sheets, selection OAuth tableurs | OAuth Bridge requis | Partiel avance; modale source visible, connexion Google Sheets reste Bridge OAuth |
| `ScreenRecordModal` | enregistrement ecran | service Connaissance local | Partiel, UI portee; permission navigateur et import reel a valider manuellement |

## Bibliotheque et connaissances

| Surface source | Elements attendus | Cible Bridge | Etat |
| --- | --- | --- | --- |
| `DashboardPage` / `DashboardView` actif | header Connaissances, stats, scope Personnel/Entreprise, Vue liste/graph, contenu dashboard | service `/dashboard` aligne sur shell source; captures source/cible desktop-mobile faites | Partiel avance |
| `KnowledgeBrowser` | grille par defaut, liste, groupes, recherche, filtres, tri, selection, detail panel, graph/list view | service `/dashboard`; grille par defaut alignee, `/knowledge/[id]` et `/groups/[id]` ouvrent les viewers source-like | Partiel avance |
| `KnowledgeCard` | actions Interroger/Copier le lien, options voir/modifier/version/remplacer/associer/partager/supprimer | service Connaissance | Partiel avance, pieds de carte et menus presents, actions Bridge testees |
| `KnowledgeFilter` | recherche, type, statut, tri, reset, compte resultats | service Connaissance | Partiel avance |
| `ProcessingCard` | progression ingestion locale | service dashboard/upload | Partiel avance |
| `GroupDetailModal` | ouvrir groupe, interroger, partager, supprimer item | service Connaissance | Partiel avance, hero/liste/actions portes; suppression item a completer |
| `ProjectWorkspace` | contexte dedie par projet, sources, agents, actions projet | service `/projects/[id]` | Extension Bridge compatible; aucun ecran projet exact trouve dans `app-v2`, UI alignee sur shell Connaissance et actions `knowledge_ai.project.*` |
| `AgentsWorkspace` | creation agents, instructions systeme, test, duplication, archivage, runtime local-only | service `/agents` | Extension Bridge compatible; aucun ecran agents autonome trouve dans `app-v2`, route dediee ajoutee pour l'objectif Bridge avec shell Connaissance et actions `knowledge_ai.agent.*` |
| `KnowledgeEditorModal` | infos, tags, prive/public, diff, sauvegarder | service Connaissance | Partiel avance, UI source-like et action update Bridge |
| `AssociateKnowledgeModal` | recherche, selection, confirmation si changement de groupe | service Connaissance | Partiel avance, UI source-like et action associate Bridge |
| `ReplaceContentModal` | remplacer fichier | service Connaissance | Partiel avance, dropzone/raison/action Bridge; upload reel a brancher |
| `VersionHistoryModal` | version actuelle, historique, restaurer | service Connaissance | Partiel, version actuelle et etat vide portes; versions precedentes a brancher |

## Viewers

| Surface source | Elements attendus | Cible Bridge | Etat |
| --- | --- | --- | --- |
| `GenericDetailViewer` | onglets resume/contenu/fichier/meta, PDF zoom, copier, ouvrir source, table preview | viewer modal depuis dashboard et route `/knowledge/[id]` avec le meme viewer source-like | Partiel avance, onglets et actions source-like portes; rendu fichier reel a brancher |
| `VideoDetailViewer` | lecteur video, controls, summary, steps, expertise, resources, timeline, automation | modale dashboard service avec item video dedie | Partiel avance, UI/onglets/actions portes; vraie video Mux/local et donnees parsees a brancher |
| `AudioDetailViewer` | player audio, summary, needs, tasks, transcription, automation | modale dashboard service avec item audio dedie | Partiel avance, UI/onglets/actions portes; vrai audio et donnees multi-agents a brancher |
| `SocialDetailViewer` | content, automation, stats, images, source externe | modale dashboard service avec item LinkedIn dedie | Partiel avance, header/post/auteur/stats/tags portes; images carousel et metadata reelles a brancher |
| `EmailThreadViewer` | fil email, messages, resume IA, pieces jointes | modale dashboard service avec item email dedie | Partiel avance, conversation/resume/actions portes; parsing thread reel et attachments a brancher |

## Automatisation et OAuth Bridge

| Surface source | Elements attendus | Cible Bridge | Etat |
| --- | --- | --- | --- |
| `AutomationTab` | token webhook, connecter Google Sheets, chercher fichier, sync, disconnect, script Apps Script, workflows | Bridge OAuth/scopes, pas de cle IA cloud | Partiel avance; UI source-like portee dans la modale dashboard, actions `knowledge_ai.automation.run` / `knowledge_ai.upload.google_sheets`, captures cible desktop/mobile |
| `GoogleSheetsPickerModal` | OAuth tableurs, selection fichier | Bridge OAuth | Partiel avance; modale upload + flux automation utilisent Bridge OAuth demo, vrai provider service a brancher |
| `ChatShortcutService` | CRUD raccourcis | actions `knowledge_ai.shortcuts.*` | A creer |
| `ConversationalAgentService` | chat stream + citations + web sources | actions `knowledge_ai.chat.*`, local-only | Partiel |
| `uploadService` | upload texte/fichier/url/social/tableur | actions `knowledge_ai.upload.*`, local extraction | Partiel |

## Runtime interdit dans `knowledge_ai`

- Aucune lecture de cle IA cloud.
- Aucun SDK IA cloud.
- Aucun endpoint IA cloud.
- Aucun routeur provider cloud issu de `llm-router`.
- DGX uniquement si `KNOWLEDGE_AI_DGX_ENABLED=1`, jamais automatique.

Le test `tests/security/knowledge-ai-local-only.test.ts` et `npm run
security:grep` couvrent ces interdictions pour les chemins du module.
