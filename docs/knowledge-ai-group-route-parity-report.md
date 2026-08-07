# Connaissance Group Route Parity Report

Date: 2026-06-14

## Source inspected

- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/knowledge/GroupDetailModal.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/knowledge/KnowledgeBrowser.tsx`

Source behavior: group cards open an iOS-like modal with a golden folder hero, group description, file count/date chips, a file list, and bottom actions `Interroger` and `Copier le lien`.

## Target changed

- `services/connaissance/app/groups/[id]/page.tsx`
- `services/connaissance/README.md`
- `docs/knowledge-ai-parity-matrix.md`
- `docs/knowledge-ai-knowledge-route-parity-report.md`

## What changed

- `/groups/[id]` no longer redirects to `/dashboard`.
- The route now renders `ConnaissanceNewDashboard` with the group detail viewer opened directly.
- The route reuses the same source-like group surface as the dashboard group card.
- The visible group actions stay mapped to Bridge actions:
  - group link copy: `knowledge_ai.viewer.action`
  - group chat/interrogate: `knowledge_ai.conversation.context.set`
  - file row open: `knowledge_ai.knowledge.get`

## Target screenshots

- `artifacts/knowledge-ai-parity/target-group-route-detail-desktop.png`
- `artifacts/knowledge-ai-parity/target-group-route-detail-mobile.png`

## Verification

- `npm run service:connaissance:typecheck`
- `npm run service:connaissance:build`
- Playwright desktop:
  - `/groups/group-procedures` stays on the route and does not redirect.
  - Source-like viewer panel present.
  - Group title present.
  - 3 file rows present.
  - `Interroger` and `Copier le lien` actions present.
- Playwright mobile:
  - Source-like viewer panel present.
  - 3 file rows present.
  - horizontal overflow: false.

## Remaining gaps

- The route currently uses the demo group collection from the service UI; production loading must call the dedicated Connaissance service API with Bridge launch context.
- Per-file delete from the source `GroupDetailModal` is not yet exposed in the route surface.
- Authenticated source screenshots still need a source session or fixture harness.
- `/projects/[id]` now opens a Connaissance-compatible project workspace; it remains documented as a Bridge extension because no exact source project detail page was found.
