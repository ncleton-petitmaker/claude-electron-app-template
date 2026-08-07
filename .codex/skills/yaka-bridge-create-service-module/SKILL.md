---
name: yaka-bridge-create-service-module
description: Créer un module Yaka-Bridge qui est aussi un service web indépendant avec repo/service dédié, sous-domaine, Coolify, Supabase dédié, Bridge service registration, OAuth/launch ticket, scopes, entitlements, migrations et CI. Utiliser quand un nouveau module expose une vraie app produit, un chat, des fichiers, agents, projets, runtime local/IA, ou doit être déployé séparément par client.
---

# Yaka Bridge Create Service Module

Utilise cette skill quand un module n'est pas une petite surface embarquée,
mais un vrai service client : app web, domaine, runtime, fichiers, chat,
agents, workflows quotidiens ou besoin de déploiement indépendant.

## Skills a charger

Avant d'agir, lire et appliquer :

- `yaka-bridge-sync-guardian`
- `yaka-bridge-version-modules`
- `yaka-bridge-create-module`
- `yaka-bridge-deploy-coolify`
- `docs/service-module-architecture.md`
- `docs/bridge-multiservices.md`
- `docs/agentic-first.md`

## Decision de topologie

Classer et annoncer la topologie avant tout code :

```text
Client: <clientSlug>
Module id: <moduleId>
Service id: <serviceId>
Repo service: <clientSlug>-service-<serviceId> ou <clientSlug>-module-<moduleId>
ERP repo: <clientSlug>-erp
Local folder: Projets/<CompanyFolder>/<serviceRepo>
Domain: <service>.<client-domain>
Coolify: application dediee
Supabase: projet dedie par defaut
Bridge: service enregistre dans bridge_services
```

Si une information manque, choisir la variante la plus restrictive :
repo privé séparé, Supabase dédié, Coolify dédié, domaine dédié, PR obligatoire.

## Invariants

- Chaque service produit a son propre Coolify.
- Chaque service produit a son propre sous-domaine.
- Chaque service produit a son propre Supabase par défaut.
- Supabase partagé est interdit sauf décision écrite dans le plan et migration
  RLS validée.
- Le template public ne contient aucun domaine, secret ou donnée client.
- `modules/<moduleId>/` contient le contrat Bridge, pas l'app produit complète.
- `app/admin/<moduleId>/` contient admin, health, providers, droits et URLs.
- `app/<service>/` contient seulement launcher, redirect ou iframe contrôlée.
- L'UI produit vit dans `services/<serviceId>/` ou dans le repo service privé.
- Tout bouton produit doit avoir une action HTTP/MCP/Bridge équivalente.

## Workflow

1. Lancer `node scripts/yaka-sync-guardian.mjs doctor --strict`.
2. Vérifier la topologie GitHub avec `yaka-bridge-version-modules`.
3. Créer ou vérifier le repo privé du service.
4. Créer le squelette service dans `services/<serviceId>/` ou dans le repo
   service privé :
   - `package.json`
   - `Dockerfile`
   - `coolify.json` ou notes équivalentes
   - `.env.example` sans secrets
   - routes produit
   - healthcheck `/healthz`
   - callback Bridge `/bridge/launch`
5. Créer le module Bridge dans `modules/<moduleId>/module.config.json` avec :
   - `deployment.kind = "external-service"`
   - `deployment.serviceSlug`
   - `deployment.defaultDomainPattern`
   - `deployment.coolify.required = true`
   - `deployment.supabase.strategy = "dedicated"`
   - routes Bridge limitées à launcher/admin
   - scopes `service:<serviceId>:read/write/admin`
   - actions, events, tables, migrations et jobs.
6. Ajouter la page admin Bridge :
   - URL service
   - URL admin service
   - healthcheck
   - provider/runtime
   - entitlements/scopes
   - statut Supabase/Coolify sans afficher les secrets.
7. Ajouter le launcher Bridge :
   - lit `bridge_services`
   - crée un launch ticket
   - ouvre `launch_callback_url` ou `base_url`
   - affiche une erreur claire si le service n'est pas configuré.
8. Provisionner ou documenter le DNS :
   - `<service>.<client-domain>`
   - CORS strict
   - OAuth redirect URLs
   - TLS via Coolify/proxy.
9. Provisionner ou documenter Coolify :
   - app dédiée
   - repo/branche
   - build pack ou Dockerfile
   - variables d'environnement
   - healthcheck
   - auto-deploy GitHub vérifié.
10. Provisionner ou documenter Supabase dédié :
   - projet dédié
   - migrations
   - RLS
   - service role côté serveur uniquement
   - redirect URLs auth
   - sauvegardes et région.
11. Mettre à jour le repo ERP client :
   - `modules.lock.json`
   - entitlements
   - `bridge_services`
   - variables publiques non sensibles
   - docs opérateur client.
12. Lancer validations :
   - `node scripts/yaka-sync-guardian.mjs doctor --strict`
   - `npm run typecheck`
   - `npm test`
   - `npm run build`
   - `npm run security:grep`
   - build du service
   - healthcheck local
   - vérification Coolify ou plan de secrets manquants.

## Manifest minimum

```json
{
  "id": "knowledge_ai",
  "version": "0.1.0",
  "deployment": {
    "kind": "external-service",
    "serviceSlug": "connaissance",
    "defaultDomainPattern": "connaissance.<client-domain>",
    "coolify": { "required": true, "resource": "application" },
    "supabase": { "strategy": "dedicated", "sharedAllowed": false }
  },
  "routes": [
    { "path": "/connaissance", "kind": "launcher" },
    { "path": "/admin/knowledge-ai", "kind": "admin" }
  ],
  "bridgeService": {
    "serviceId": "knowledge_ai",
    "basePath": "/connaissance",
    "requiredScopes": ["service:knowledge_ai:read"]
  }
}
```

## Refus obligatoires

Arrêter et corriger si :

- une UI produit complète est créée dans `app/admin/*` ;
- un service externe déclare des routes produit complètes dans `app/<service>/`;
- aucun Coolify dédié n'est prévu ;
- aucun Supabase dédié n'est prévu ou l'exception n'est pas écrite ;
- les secrets sont demandés dans le code ou imprimés en sortie ;
- l'agent ne peut pas expliquer où vivent UI produit, admin, runtime et données.
