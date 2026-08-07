# Service Connaissance

Connaissance est un service web independant pour Yaka-Bridge.

- UI produit : `services/connaissance/app/*`
- Contrat Bridge : `modules/knowledge_ai/module.config.json`
- Admin Bridge : `/admin/knowledge-ai`
- Launcher Bridge : `/connaissance`
- Coolify : application dediee
- Domaine cible : `connaissance.<client-domain>`
- Supabase : projet dedie par defaut
- IA : Bridge Codex, LM Studio local, DGX Spark LAN desactive en v1

## Routes service

- `/chat` : surface chat source-like.
- `/upload` : surface upload source-like.
- `/dashboard` : surface dashboard/source browser source-like.
- `/settings` : surface Parametres source-like adaptee au Bridge, avec Tri automatique, Integrations, Connecteurs, Donnees, Cles API et Compte.
- `/search` : surface Recherche Connaissance compatible Bridge.
- `/analytics` : surface Analytics Connaissance compatible Bridge.
- `/agents` : surface Agents Connaissance compatible Bridge.
- `/knowledge/[id]` : ouvre le viewer source-like du dashboard directement depuis la route produit.
- `/groups/[id]` : ouvre la surface groupe source-like du dashboard directement depuis la route produit.
- `/projects/[id]` : ouvre une surface projet Connaissance compatible Bridge pour contexte dedie, sources et agents.
- `/bridge/launch`
- `/healthz`

## Portage depuis connaissanceNEW

La source de reference est :

```text
/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2
```

Porter l'UI ecran par ecran dans ce service. Ne pas copier les routeurs IA
legacy, les SDK IA externes, ni les providers cloud. Les operations IA doivent
passer par les actions Bridge `knowledge_ai.*`.

## Commandes

Depuis la racine :

```bash
npm run service:connaissance:dev
npm run service:connaissance:typecheck
npm run service:connaissance:build
```

Depuis ce dossier :

```bash
npm run dev
npm run typecheck
npm run build
```
