---
name: yaka-bridge-create-module
description: Créer un nouveau module ERP yaka-bridge en produisant à la fois la version template anonymisée et, si demandé, l'implémentation privée d'un client.
version: 1.0.0
---

# yaka-bridge-create-module

Utilise cette skill quand l'utilisateur demande de créer, ajouter, générer,
industrialiser ou extraire un module ERP yaka-bridge (`stock`, `crm`,
`planning`, `quality`, etc.).

Objectif : livrer un module production-ready, agentic-first, compatible Bridge,
auditable humainement, et réutilisable dans le template public sans donnée
client.

## Stop architecture obligatoire

Avant toute ligne de code, lire `docs/service-module-architecture.md` et
classer explicitement le besoin :

- **module embarqué** : petite surface interne au shell Bridge ;
- **service web indépendant** : app produit avec UI quotidienne, runtime propre,
  domaine/Coolify propre, maintenance indépendante ;
- **provider technique** : couche de routage, runtime, inspection ou config, pas
  une expérience produit.

Si le besoin contient chat, agents, fichiers, projets, historique, runtime IA,
OCR, embeddings, ou une UI reprise depuis une app existante/open source, la
réponse par défaut est **service web indépendant**. Dans ce cas, charger et
appliquer aussi `yaka-bridge-create-service-module`. Dans ce cas :

- `modules/<moduleId>/` ne contient que le contrat Bridge : manifest, scopes,
  actions, events, migrations, jobs, admin/health/launch ;
- l'UI produit vit dans `services/<serviceId>/` ou dans un repo service séparé ;
- `app/admin/<moduleId>/` ne contient que la configuration/admin ;
- `app/<service>/` ne contient au plus qu'un launcher/redirect/iframe contrôlée,
  jamais la navigation produit complète ;
- le service doit avoir son propre Coolify, ses URLs, ses redirect URLs OAuth et
  son enregistrement `bridge_services`.

Ne jamais confondre une route admin Bridge avec l'application produit.

## Préflight versioning obligatoire

Avant d'écrire du code pour un module client, utilise d'abord
`yaka-bridge-version-modules`.

Cette étape choisit le bon repo :

- `yaka-bridge` pour un module générique anonymisé ;
- `<clientSlug>-erp` pour activer/configurer une version déjà stable ;
- `<clientSlug>-module-<moduleId>` pour un module client nouveau, spécifique,
  sensible ou développé par un non-développeur.
- `Projets/<CompanyFolder>/<subproject>/` pour le rangement local privé.

Ne code pas directement un nouveau module client dans le repo ERP client si un
repo module séparé est requis.

## Questions obligatoires

Avant d'écrire du code, pose ces questions si elles ne sont pas déjà résolues :

1. Quel est le client cible ?
   - `template-only` si le module doit seulement enrichir yaka-bridge.
   - chemin d'un repo client privé existant si le module doit être installé en
     production pour un client.
   - `new-client` si le client n'existe pas encore.
2. Quel est le dossier entreprise local `Projets/<CompanyFolder>/` ?
3. Quel est l'id technique anglais du module ?
   - Exemples valides : `stock`, `crm`, `quality`, `planning`.
   - Refuser les accents, espaces et noms client.
4. Quels sont les labels UI FR/EN ?
5. Quels workflows humains doivent exister dans l'UI ?
6. Quelles actions doivent être pilotables par agent via MCP et Bridge ?
7. Quelles données doivent rester privées côté client ?
8. Quels services web ou sous-domaines sont nécessaires ?
9. Le module doit-il respecter le design system actif ou existe-t-il une
   contrainte design client à garder privée ?
10. Le préflight `yaka-bridge-version-modules` a-t-il confirmé le repo, les
    droits, la branche et la version cible ?
11. Le besoin est-il `embedded-module`, `external-service` ou
    `technical-provider`, et où vivra l'UI produit ?

Si l'utilisateur demande d'avancer sans réponse complète, choisis la variante
la plus robuste en production et documente l'hypothèse dans le journal de
travail.

## Invariants non négociables

- Le template public ne contient aucun nom, domaine, donnée ou règle privée
  d'un client.
- Toute donnée d'exemple est fictive, stable et anonymisée.
- Les ids techniques restent en anglais ; les labels UI sont bilingues.
- Chaque module possède `modules/<moduleId>/module.config.json` comme contrat
  canonique.
- Un module marqué `deployment.kind = external-service` ne doit pas avoir son UI
  produit copiée dans `app/` ou `app/admin/`; Bridge n'expose qu'un launcher,
  une config admin et les contrats d'action.
- Chaque manifest module possède une version SemVer.
- Chaque module consomme le design system actif via tokens/classes partagés ; il
  ne crée pas sa propre charte locale.
- Toute mutation visible dans l'UI possède une action serveur typée exposée en
  HTTP et en MCP.
- Les actions métier reçoivent un contexte serveur (`ActionContext`) ; le
  client ne fournit jamais librement `organizationId`.
- Les tables métier sont préfixées par module et protégées par RLS via
  `organization_id`.
- Les accès UI, API et Bridge sont pilotés par `bridge_entitlements` et par des
  scopes explicites.
- Le Bridge ne reçoit des jobs que pour les services et scopes autorisés.
- Aucun secret, token, domaine privé ou dump client ne doit être commité.

## Méthode template

1. Lire d'abord :
   - `README.md`
   - `docs/service-module-architecture.md`
   - `docs/module-catalog.md`
   - `docs/agentic-first.md`
   - `docs/cloud-security.md`
   - `docs/bridge-multiservices.md`
   - `modules/purchasing/module.config.json`
2. Créer `modules/<moduleId>/module.config.json` avec :
   - `id`
   - `version`
   - `labels`
   - `routes`
   - `dashboard`
   - `scopes`
   - `actions`
   - `events`
   - `tables`
   - `migrations`
   - `seeds`
   - `bridgeService`
3. Ajouter la migration Supabase du module :
   - tables `<moduleId>_*`
   - `organization_id uuid not null`
   - index sur `organization_id`
   - RLS activée
   - policies basées sur `bridge_has_scope`
   - seeds demo anonymisés
4. Ajouter les actions serveur :
   - Zod input/output
   - scopes par action
   - audit
   - events publiés si l'action change l'état métier
5. Ajouter la parité agentic-first :
   - route HTTP
   - exposition MCP
   - documentation des tools utiles dans la skill de module si nécessaire
6. Ajouter l'UI :
   - pour un module embarqué : dashboard de module et pages de travail dans le
     shell Bridge ;
   - pour un service indépendant : UI produit dans `services/<serviceId>/` ou
     repo service, plus launcher/config seulement côté Bridge ;
   - design system partagé ou tokens exportés vers le service ;
   - aucun composant isolé avec style divergent.
7. Ajouter Bridge :
   - service id
   - scopes `service:<moduleId>:read/write/admin`
   - jobs nécessaires
   - règles d'entitlement demo
   - si service indépendant : `base_url`, `admin_url`, `health_url`,
     `launch_callback_url` et tickets de lancement.
8. Ajouter tests :
   - authZ par organisation
   - scopes read/write/admin
   - refus sans bearer/token
   - retrait entitlement masque le module et bloque les jobs
   - migrations sur base fraîche

## Méthode client privé

Si un client est associé au module :

1. Vérifier la décision `yaka-bridge-version-modules`.
2. Si le module est nouveau, spécifique ou développé par un non-développeur,
   travailler dans `<clientSlug>-module-<moduleId>`.
3. Si le module catalogue est déjà stable, l'activer dans `<clientSlug>-erp`
   en mettant à jour `modules.lock.json`.
4. Vérifier que le repo client privé existe et n'a pas de remote public non
   prévu.
5. Importer le module générique depuis yaka-bridge sans copier de secrets dans
   le template.
6. Ajouter uniquement dans le repo client :
   - domaines réels
   - variables d'environnement réelles
   - données privées
   - libellés ou règles strictement client
   - overrides de configuration
7. Appliquer les migrations sur l'environnement client contrôlé.
8. Configurer les entitlements et services Bridge du client.
9. Tester les URLs client :
   - admin
   - module/service
   - API Supabase
   - Bridge polling
10. Reporter dans yaka-bridge toute correction structurelle générique découverte
   côté client.

## Sous-domaines et DNS

Pour chaque module exposé comme service web, prévoir une zone DNS explicite :

```text
<service>.<client-domain>     A ou CNAME     <vps-or-proxy-target>
admin.<client-domain>         A ou CNAME     <vps-or-proxy-target>
api.<client-domain>           A ou CNAME     <vps-or-proxy-target>
```

Ajouter les URLs au routage proxy, aux CORS autorisés, et aux redirect URLs
Supabase Auth. Ne jamais accepter `*` en production.

## Commandes de validation

Dans yaka-bridge :

```bash
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
npm run security:grep
npm run factory:check
```

Dans le repo client, exécuter l'équivalent local plus les tests de déploiement.
Ne jamais annoncer le module terminé si une de ces étapes échoue.

## Livrables attendus

- Manifest module complet.
- Migration Supabase avec RLS.
- Seeds demo anonymisés.
- Actions typées et tests authZ.
- UI dashboard/module.
- Parité HTTP/MCP/Bridge.
- Docs courtes d'usage et de maintenance.
- Notes d'implémentation client privé si un client est associé.
- Version SemVer et, côté client, mise à jour de `modules.lock.json`.
