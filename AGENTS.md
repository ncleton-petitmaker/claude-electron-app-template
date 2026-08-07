# Yaka-Bridge Agent Guide

Ce repo doit etre utilisable par n'importe quel operateur qui le clone depuis
GitHub, l'ouvre dans Codex, puis demande de creer un ERP client, un serveur, un
module ou un service. Les instructions ci-dessous sont prioritaires pour tout
agent Codex travaillant dans ce repo.

## Convention fichier

La source canonique des instructions agent est `AGENTS.md`, a la racine du repo.
Ne pas creer de fichier concurrent `agent.md` ou `agents.md`. Si un outil ou un
humain cherche l'ancien nom `agent.md`, il doit etre redirige vers `AGENTS.md`.

## Demarrage obligatoire

1. Lire ce fichier.
2. Lancer le preflight :

   ```bash
   node scripts/yaka-sync-guardian.mjs doctor --strict
   ```

3. Lire les docs de cadrage utiles avant de coder :
   - `docs/service-module-architecture.md`
   - `docs/bridge-multiservices.md`
   - `docs/module-catalog.md`
   - `docs/agentic-first.md`
   - `docs/cloud-security.md`
4. Utiliser les skills embarques dans `.codex/skills/`. Ils font partie du
   repo et doivent fonctionner apres clone, sans dependance a un environnement
   personnel Codex.

## Skills repo a utiliser

- `.codex/skills/yaka-bridge-onboard/SKILL.md` : demarrage d'un operateur ou
  cadrage initial.
- `.codex/skills/yaka-bridge-new-client-vps/SKILL.md` : nouveau client, VPS,
  DNS, Supabase, services, Bridge et production.
- `.codex/skills/yaka-bridge-version-modules/SKILL.md` : topologie GitHub,
  repos prives, protections, SemVer et promotion module/client/template.
- `.codex/skills/yaka-bridge-create-module/SKILL.md` : module Bridge embarque
  ou contrat module generique.
- `.codex/skills/yaka-bridge-create-service-module/SKILL.md` : module qui est
  aussi un service web independant avec sous-domaine, Coolify dedie, Supabase
  dedie par defaut, Bridge service registration, OAuth/launch ticket et CI.
- `.codex/skills/yaka-bridge-deploy-coolify/SKILL.md` : mise en ligne ou
  redeploiement Coolify/VPS.
- `.codex/skills/yaka-bridge-refactor-design-system/SKILL.md` : creation,
  import ou refonte du design system.
- `.codex/skills/yaka-bridge-sync-guardian/SKILL.md` : anti-derive
  plateforme/client/template avant modification, build, commit ou push.

Si le mecanisme de skills Codex ne charge pas automatiquement un skill local,
ouvrir manuellement le `SKILL.md` correspondant et appliquer son workflow.

## Architecture non negociable

Toujours distinguer trois choses :

- **Module Bridge** : manifest, scopes, actions, events, migrations, jobs,
  entitlements, admin et lancement.
- **Service web independant** : UI produit, runtime propre, domaine, Coolify,
  Supabase, healthcheck et callback Bridge.
- **Vue admin Bridge** : configuration, supervision, securite, URLs, providers,
  droits. Ce n'est pas l'application produit.

Par defaut, un module devient **service web independant** s'il contient chat,
fichiers, agents, projets, historique, runtime IA/local, OCR, embeddings,
workflows quotidiens ou UI reprise d'une app existante/open source.

Dans ce cas :

- creer ou verifier un repo service prive ;
- prevoir un sous-domaine dedie ;
- prevoir une application Coolify dediee ;
- prevoir un Supabase dedie par defaut ;
- enregistrer le service dans `bridge_services` ;
- exposer depuis Bridge seulement un launcher, l'admin, les scopes et les
  actions de controle ;
- ne jamais copier la UI produit complete dans `app/admin/*` ou dans le shell
  Bridge.

## Workflow nouveau client / nouveau serveur

Utiliser `yaka-bridge-new-client-vps` puis `yaka-bridge-version-modules`.

Livrables attendus :

- repo client ERP prive ;
- repos modules/services prives si necessaire ;
- domaine et DNS ;
- Coolify/VPS ;
- Supabase ;
- services web ;
- Bridge configure ;
- entitlements ;
- sauvegardes ;
- tests production.

## Workflow nouveau module

1. Decider : `embedded-module`, `external-service` ou `technical-provider`.
2. Si `external-service`, utiliser obligatoirement
   `yaka-bridge-create-service-module`.
3. Sinon utiliser `yaka-bridge-create-module`.
4. Toujours garder le template public anonymise.
5. Toute action UI doit avoir une action serveur HTTP/MCP/Bridge equivalente.
6. Toute table metier doit avoir `organization_id`, RLS et scopes explicites.

## Design system

Chaque module ou service doit consommer le design system actif ou des tokens
exportes depuis le design system. Ne pas inventer une charte locale dans un
module. Les logos, marques et contraintes client restent dans le repo client ou
service prive, jamais dans le template public.

## Secrets et donnees client

Interdits dans ce repo :

- secrets ;
- tokens ;
- domaines clients reels sauf docs privees explicitement ignorees ;
- donnees client ;
- prompts ou documents sensibles ;
- dumps Supabase/Postgres.

## Validation minimale

Avant d'annoncer un travail termine dans `yaka-bridge` :

```bash
node scripts/yaka-sync-guardian.mjs doctor --strict
npm run typecheck
npm test
npm run build
npm run security:grep
```

Ajouter les checks Coolify/VPS/Supabase pour tout service ou client deploye.
