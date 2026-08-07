# Connaissance Project Route Parity Report

Date: 2026-06-14

## Source inspected

- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/pages/DashboardPage.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/App.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/knowledge/KnowledgeBrowser.tsx`

No exact project detail page or project workspace component was found in the inspected `app-v2` source. The only explicit project-related source evidence found is the dashboard category `Projets clients` and project context references inside specialized viewers.

## Target changed

- `services/connaissance/app/projects/[id]/page.tsx`
- `services/connaissance/components/ProjectWorkspace.tsx`
- `services/connaissance/app/globals.css`
- `services/connaissance/README.md`
- `docs/knowledge-ai-parity-matrix.md`
- `docs/knowledge-ai-knowledge-route-parity-report.md`
- `docs/knowledge-ai-group-route-parity-report.md`

## What changed

- `/projects/[id]` no longer redirects to `/dashboard`.
- The route now opens a Connaissance-compatible project workspace inside the product service.
- The UI uses the same source-like shell as chat/upload/dashboard:
  - Connaissance sidebar.
  - Chat/Admin switch.
  - Chat/Ajouter/Connaissances navigation.
  - bottom profile block.
  - iOS-like light background and compact panels.
- The route exposes dedicated project context, project sources, project agents and local-only policy badges.

## Bridge adaptations

- `Mettre a jour` and context textarea blur call `knowledge_ai.project.update_context`.
- `Interroger` calls `knowledge_ai.conversation.context.set`.
- `Ajouter` source calls `knowledge_ai.knowledge.associate`.
- Agent launch buttons call `knowledge_ai.project.launch_agent`.
- Source links route to `/knowledge/[id]` or `/groups/[id]`, which are now product service routes.

## Target screenshots

- `artifacts/knowledge-ai-parity/target-project-route-detail-desktop.png`
- `artifacts/knowledge-ai-parity/target-project-route-detail-mobile.png`

## Verification

- `npm run service:connaissance:typecheck`
- `npm run service:connaissance:build`
- Playwright desktop:
  - `/projects/client-energy-demo` stays on the route and does not redirect.
  - Connaissance source shell present.
  - Project title present.
  - 6 source rows present.
  - 3 project agent buttons present.
  - `Mettre a jour`, `Interroger` and `Ajouter` actions present.
- Playwright mobile:
  - Connaissance source shell present.
  - 6 source rows present.
  - 3 project agent buttons present.
  - horizontal overflow: false.

## Remaining gaps

- This is documented as a Bridge-compatible extension, not pixel-perfect source parity, because no exact source project route was found.
- Production project loading must call the dedicated Connaissance service API with Bridge launch context.
- Project create/edit/delete flows still need source-compatible modals.
- Authenticated source screenshots remain pending because the source app currently opens the login screen in this session.
