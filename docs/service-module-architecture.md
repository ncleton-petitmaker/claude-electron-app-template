# Architecture modules et services

Ce document est la reference a lire avant de creer un module Yaka-Bridge.

## Regle principale

Un **module Bridge** n'est pas forcement une **application web produit**.

- Le module Bridge decrit le contrat : manifest, scopes, actions, events, RLS,
  jobs Bridge, OAuth/launch tickets, admin et supervision.
- Le service web porte l'experience utilisateur produit quand il doit vivre,
  scaler, etre maintenu ou deploye independamment.
- L'admin Bridge ne doit jamais devenir un clone de l'application produit.

Si un utilisateur final doit utiliser une interface riche au quotidien, cette
interface doit etre un service web autonome, deploye sur son propre Coolify, et
enregistre dans `bridge_services`.

## Trois couches distinctes

| Couche | Dossier | Role | Deploiement |
|---|---|---|---|
| Module Bridge | `modules/<moduleId>/` | Contrat, scopes, actions, migrations, integration Bridge | Inclus dans la plateforme/template |
| Admin Bridge | `app/admin/<moduleId>/` | Configuration, healthcheck, droits, runtime, URL service | Inclus dans Bridge |
| Service web | `services/<serviceId>/` ou repo separe | UI produit complete, workflows, pages utilisateur | Coolify dedie par client/service |

La route Bridge publique comme `/connaissance` peut exister, mais uniquement
comme launcher, redirect controle, iframe controlee ou page d'etat. Elle ne
doit pas contenir la navigation produit complete si le module est marque comme
service externe.

## Decision obligatoire avant code

Avant toute implementation, classer le besoin :

1. **Module embarque** : petit outil interne au shell, faible autonomie, pas de
   deploiement client separe.
2. **Service web independant** : app produit, experience riche, runtime propre,
   domaine propre, Coolify propre.
3. **Provider technique** : composant invisible ou quasi invisible pour router,
   configurer ou superviser une capacite commune.

Par defaut, choisir **service web independant** des qu'il y a :

- chat, historique, agents, projets, fichiers ou workflows quotidiens ;
- runtime lourd ou local, par exemple LM Studio, OCR, embeddings, jobs IA ;
- besoin de mise en ligne par client ;
- besoin de maintenir l'app sans redeployer toute la plateforme Bridge ;
- interface reprise depuis une app open source ou une app existante.

## Invariants service independant

Un service independant doit avoir :

- un `serviceId` stable dans `bridge_services` ;
- `base_url`, `admin_url`, `health_url` et `launch_callback_url` ;
- un domaine ou sous-domaine client dedie ;
- un projet Coolify dedie ;
- un projet Supabase dedie par defaut ;
- des redirect URLs OAuth explicites ;
- un contrat de launch ticket Bridge ;
- des scopes `service:<id>:read/write/admin` minimum ;
- une matrice UI vers actions HTTP/MCP/Bridge ;
- une politique de donnees claire. Supabase partagee est une exception qui doit
  etre justifiee par ecrit avant implementation.

## Interdits

- Copier une app produit complete dans `app/admin/*`.
- Reproduire une navigation produit complete dans le shell Bridge quand le
  module est un service externe.
- Mettre des domaines, secrets ou donnees client dans le template public.
- Cacher une logique metier uniquement dans le front.
- Lancer un runtime lourd depuis une page Bridge sans audit explicite.
- Creer un service produit sans Coolify dedie.
- Creer un service produit sans Supabase dedie, sauf exception ecrite et testee.

## Application a Connaissance

Connaissance est un **service web independant**.

- Bridge garde `knowledge_ai` comme contrat d'integration : scopes, actions,
  migrations, runtime local-only, audit, health et launch ticket.
- L'admin Bridge vit dans `/admin/knowledge-ai`.
- `/connaissance` dans Bridge est un launcher vers le service enregistre.
- La UI complete issue de `connaissanceNEW/src/app-v2` doit vivre dans un
  service Connaissance separable, deployable sur son propre Coolify.
- Les appels IA directs cloud restent interdits dans le nouveau mode ; le
  service appelle Bridge Codex, LM Studio local ou DGX Spark LAN via le contrat
  Bridge.
