# Connaissance Knowledge Route Parity Report

Date: 2026-06-14

## Source inspected

- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/pages/dashboard/DashboardPage.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/pages/chat/ChatPage.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/knowledge/KnowledgeBrowser.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/knowledge/GenericDetailViewer.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/knowledge/VideoDetailViewer.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/knowledge/AudioDetailViewer.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/knowledge/SocialDetailViewer.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/email/EmailThreadViewer.tsx`

Source evidence: dashboard and chat open citations/sources with `/knowledge/${id}`; `KnowledgeBrowser` renders detail viewers by type.

## Target changed

- `services/connaissance/app/knowledge/[id]/page.tsx`
- `services/connaissance/components/ConnaissanceNewDashboard.tsx`
- `services/connaissance/README.md`
- `docs/knowledge-ai-parity-matrix.md`
- `docs/knowledge-ai-automation-parity-report.md`

## What changed

- `/knowledge/[id]` no longer redirects to `/dashboard`.
- The route now renders `ConnaissanceNewDashboard` with an initial source-like detail viewer modal.
- The route reuses the dashboard viewer surface instead of maintaining a second divergent detail UI.
- Closing the standalone detail route returns the user to `/dashboard`.
- The route keeps all visible viewer actions wired through `knowledge_ai.viewer.action`, `knowledge_ai.automation.run`, `knowledge_ai.upload.google_sheets`, or the existing Bridge action mapping.

## Target screenshots

- `artifacts/knowledge-ai-parity/target-knowledge-route-pdf-desktop.png`
- `artifacts/knowledge-ai-parity/target-knowledge-route-sheets-automation-desktop.png`
- `artifacts/knowledge-ai-parity/target-knowledge-route-pdf-mobile.png`
- `artifacts/knowledge-ai-parity/target-knowledge-route-sheets-automation-mobile.png`

## Verification

- `npm run service:connaissance:typecheck`
- `npm run service:connaissance:build`
- Playwright desktop:
  - `/knowledge/source-energy-report` stays on the route and does not redirect.
  - PDF tabs present: `Document`, `Résumé`, `Texte OCR`, `Automatisation`.
  - Source-like viewer panel present.
  - `/knowledge/source-data-sheet` stays on the route and does not redirect.
  - Spreadsheet tabs present: `Données`, `Résumé`, `Automatisation`.
  - Automation panel and Google Sheets connect control present.
- Playwright mobile:
  - PDF route source-like viewer present.
  - Spreadsheet automation route present.
  - horizontal overflow: false.

## Remaining gaps

- The route currently uses the demo knowledge collection from the service UI; production loading must call the dedicated Connaissance service API with Bridge launch context.
- `/groups/[id]` now opens the same source-like group viewer surface as the dashboard group modal; production group loading still needs the dedicated service API.
- `/projects/[id]` now opens a Connaissance-compatible project workspace for dedicated context, sources and agents. This is a Bridge extension because no exact project detail page was found in the inspected `app-v2` source.
- Real file/media rendering still needs the dedicated Supabase storage/service adapter.
- Authenticated source screenshots still need a source session or fixture harness.
