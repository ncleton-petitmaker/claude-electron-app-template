# ERP module catalog

The template uses a small module catalog to compose ERP projects.

Before creating code, classify the feature with
[service-module-architecture.md](service-module-architecture.md):

- embedded module;
- independent web service;
- technical provider.

Large product experiences, copied UIs, chat/RAG surfaces, local runtimes,
uploads, agents and project workspaces should default to independent web
services registered in `bridge_services`, not to full product pages inside the
Bridge admin shell.

When creating a new module, start with
`skills-template/_global/yaka-bridge-version-modules.skill.md`, then use
`skills-template/_global/yaka-bridge-create-module.skill.md`. The versioning
skill chooses the correct repo and release path before implementation starts.

## Module shape

A module lives in `modules/<moduleId>/` and must include:

- `module.config.json`: canonical manifest used by the factory and docs.
- `version`: SemVer module contract version inside the manifest.
- UI components/routes that use the shared design system.
- Server actions exposed through `server/actions.ts` and MCP parity.
- Supabase migrations with `organization_id` and RLS.
- Demo seeds with anonymized data only.

For `deployment.kind = "external-service"`, the module manifest is only the
Bridge integration contract. The product UI lives in `services/<serviceId>/` or
in a separate service repo deployed on its own Coolify. Bridge routes may expose
an admin page and a launcher, but not the complete service navigation.

Technical ids are English (`purchasing`, `stock`, `crm`). UI labels can be
localized in the manifest.

Customer-specific modules should be developed in private
`<clientSlug>-module-<moduleId>` repositories and promoted into customer ERP
repos through `modules.lock.json`. Only anonymized reusable structure belongs in
this public catalog. See [repository-governance.md](repository-governance.md).

## Security model

Business tables are prefixed by module, for example
`purchasing_suppliers` and `purchasing_quotes`.

Every table must:

- include `organization_id`;
- enable RLS;
- allow reads only through `bridge_has_scope(..., service:<module>:read)`,
  write scope or module admin scope;
- allow writes only through write/admin scope and server-controlled actions.

Bridge jobs are filtered by service id and scopes. Sensitive agentic execution
must keep `codex:run` separate from ordinary module read/write scopes.

## Current catalog

- `knowledge_ai`: Bridge integration contract for the independent Connaissance
  service. Bridge owns admin/config, scopes, launch tickets, local-only runtime
  actions and `knowledge_ai_*` data contracts. The full Connaissance UI must
  live in its own service/Coolify; `/connaissance` in Bridge is a launcher.

`local_ai` remains a technical/provider reference for Jan and local model source
inspection. It keeps upstream clones and Bridge adaptation worktrees outside the
public template; upstream source is not vendored into `yaka-bridge`.

`purchasing` remains only as a legacy fixture/example for module contracts and
tests. It is not part of the active shell catalog.
