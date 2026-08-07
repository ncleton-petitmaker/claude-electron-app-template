# Connaissance Bridge local-only

## Objectif

`knowledge_ai` est le contrat Bridge du service Connaissance indépendant. Le
module Bridge ne porte pas l'experience produit complete : il configure les
scopes, les actions, les tickets de lancement, le runtime local-only et les
donnees. L'UI produit doit vivre dans un service Connaissance separe, deploye
sur son propre Coolify avec Supabase dedie par defaut.

## Source reprise

- Source locale: `YAKA_CONNAISSANCE_SOURCE_DIR`, par defaut `/Users/nicolascleton/Documents/connaissanceNEW`.
- UI cible: `src/app-v2`.
- Route Bridge principale: `/connaissance` comme launcher.
- Route admin Bridge: `/admin/knowledge-ai`.
- Routes produit reprises cote service: chat, ajout de sources, tableau de bord,
  base de connaissance, groupes, projets, agents et historique.

## Fonctions reprises

- Conversations et historique.
- Ajout de fichiers, URLs, texte, audio, video, images et tableurs.
- Projets avec contexte dedie.
- Agents avec instructions systeme.
- Commandes slash.
- Citations, sections indexables et recherche RAG.
- Statuts d'ingestion, extraction, embeddings locaux et messages d'erreur lisibles.

## Fonctions rejetees dans le nouveau mode

- Providers IA cloud appeles directement depuis le runtime Connaissance.
- Embeddings cloud.
- OCR cloud.
- Summarization cloud.
- Routeurs multi-vendeurs herites quand ils sortent du contrat Bridge.
- Fonctions de debug ou de clonage historique non necessaires a l'integration Bridge.

## Runtime autorise

- `bridge_codex`: job Bridge audite, visible dans les runs.
- `lmstudio_local`: serveur local compatible `/v1` sur `http://127.0.0.1:1234/v1`.
- `dgx_spark_lan`: endpoint reseau local prepare, desactive en v1.

Le mode strict est `KNOWLEDGE_AI_PROVIDER_MODE=local_only`. Le module ne doit pas
lire de cle IA cloud et ne doit pas appeler d'endpoint IA externe.

## Donnees Bridge

Les tables `knowledge_ai_*` portent toutes `organization_id` et RLS:

- `knowledge_ai_projects`
- `knowledge_ai_contents`
- `knowledge_ai_sections`
- `knowledge_ai_conversations`
- `knowledge_ai_messages`
- `knowledge_ai_uploads`
- `knowledge_ai_agents`
- `knowledge_ai_shortcuts`
- `knowledge_ai_runtime_settings`

## Etapes restantes apres le socle

- Creer le service Connaissance separable (`services/connaissance` ou repo
  service prive) avec Dockerfile, healthcheck, callback Bridge et Coolify dedie.
- Copier chaque ecran `src/app-v2` cote service au lieu de recreer l'ergonomie.
- Remplacer les couleurs en dur par les tokens Bridge.
- Porter les fonctions d'ingestion vers actions Bridge.
- Brancher stockage Supabase, jobs Bridge et persistence conversationnelle.
- Ajouter le streaming SSE reel pour `knowledge_ai.chat.stream`.
- Activer embeddings locaux avec le modele valide cote LM Studio ou sidecar Bridge.
- Activer OCR local si un binaire local est disponible.
