# Connaissance Automation Parity Report

Date: 2026-06-14

## Source inspected

- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/knowledge/AutomationTab.tsx`
- `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2/components/upload/GoogleSheetsPickerModal.tsx`

The source browser at `http://127.0.0.1:5174/index-app-v2.html` currently opens the login screen in this session, so source visual capture for the authenticated automation tab remains pending. The source code was inspected directly for the expected visible sections and forbidden technical calls.

## Target changed

- `services/connaissance/components/ConnaissanceNewDashboard.tsx`
- `services/connaissance/app/globals.css`

## Source behavior preserved visually

- `Modification externe (API)` section.
- Empty token state with `Activer la modification externe`.
- Active token state with copy, regenerate and revoke controls.
- `Google Sheets` section for spreadsheet knowledge.
- Bridge OAuth connection state.
- Spreadsheet search and selection list.
- Replacement warning modal when a knowledge already has content.
- Connected sheet state with sync, disconnect and Apps Script controls.
- `Contenu à envoyer` with selectable content blocks.
- Manual workflows list with loading/success/error visible states.

## Bridge adaptations

- No direct `supabase.from(...)` or source `createCompanyClientSync(...)` calls were ported into the service UI.
- No direct Supabase Edge Function call was ported.
- Google Sheets actions go through `knowledge_ai.upload.google_sheets`.
- Token/workflow actions go through `knowledge_ai.automation.run`.
- Apps Script now targets a Bridge/service webhook placeholder instead of a Supabase function URL.
- The spreadsheet demo item is completed so the spreadsheet automation flow is reachable from the dashboard.

## Target screenshots

- `artifacts/knowledge-ai-parity/target-dashboard-automation-sheets-desktop.png`
- `artifacts/knowledge-ai-parity/target-dashboard-automation-sheets-connected-desktop.png`
- `artifacts/knowledge-ai-parity/target-dashboard-automation-sheets-mobile.png`

## Verification

- `npm run service:connaissance:typecheck`
- `npm run service:connaissance:build`
- Playwright desktop check:
  - `.knowledge-v2-automation-source`: present.
  - `.knowledge-v2-automation-preview`: absent.
  - token, Google Sheets, content selection and workflows: present.
  - Bridge OAuth state: account, search, 3 spreadsheets and cancel: present.
- Playwright mobile check:
  - replacement warning: present.
  - connected sync state: present.
  - Apps Script modal: present.
  - horizontal overflow: false.

## Remaining gaps

- Authenticated source screenshot for the original `AutomationTab` still needs a valid source session or fixture harness.
- Workflow list currently uses representative Bridge-demo workflows; real workflows must be loaded from the dedicated Connaissance service API.
- Token generation currently returns a UI demo token after the Bridge action accepts; production token must be created server-side.
- Google Sheets list uses Bridge-demo spreadsheet entries; production search/select/sync must call the service-side Bridge OAuth adapter.
- The standalone `/knowledge/[id]` route now opens the same source-like viewer surface as the dashboard modal; production data loading still needs the dedicated service API.
