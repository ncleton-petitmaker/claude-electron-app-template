# Knowledge AI specialized viewers parity report

Date: 2026-06-14

Source reference: `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2`

Target service: `/Users/nicolascleton/Documents/Yaka-Bridge/services/connaissance`

## Scope

This tranche ports the visible specialized detail viewers from Connaissance v2
into the independent Bridge service dashboard modal:

- `components/knowledge/VideoDetailViewer.tsx`
- `components/knowledge/AudioDetailViewer.tsx`
- `components/knowledge/SocialDetailViewer.tsx`
- `components/email/EmailThreadViewer.tsx`

The product UI remains inside `services/connaissance`. Bridge-facing actions are
still called through `knowledge_ai.*`; when the Bridge control plane is not
configured, the service route returns a local `standalone-local` acknowledgement
so buttons can be tested without showing `bridge-url-missing`.

## Implemented target behavior

| Source viewer | Target coverage | Remaining gap |
| --- | --- | --- |
| `VideoDetailViewer` | Local video player placeholder, slider, `-10s`/play/`+10s`, tabs `Résumé`, `Étapes`, `Expertise`, `Ressources`, `Timeline`, `Automatisation`; timeline seek actions use `knowledge_ai.viewer.action`. | Real Mux/local video element and parsed timeline data from Supabase/storage. |
| `AudioDetailViewer` | Audio header, player slider, speed controls, tabs `Résumé`, `Besoins`, `Tâches`, `Transcription`, `Automatisation`; tasks trigger Bridge automation. | Real audio file playback, parsed meeting notes/client needs/task list from local pipeline. |
| `SocialDetailViewer` | Platform header, source button, AI summary, author card, publication content, engagement stats, tags, automation tab. | Real post images carousel/fullscreen and scraped metadata from storage. |
| `EmailThreadViewer` | Email thread header, conversation tab, expand/copy buttons, message cards, attachments, summary tab, automation tab. | Real thread parsing, per-message attachments and nested quoted content. |

## Captures

Target captures generated under `artifacts/knowledge-ai-parity/`:

- `target-dashboard-viewer-video-summary-desktop.png`
- `target-dashboard-viewer-video-timeline-desktop.png`
- `target-dashboard-viewer-video-summary-mobile.png`
- `target-dashboard-viewer-video-timeline-mobile.png`
- `target-dashboard-viewer-audio-summary-desktop.png`
- `target-dashboard-viewer-audio-transcription-desktop.png`
- `target-dashboard-viewer-social-content-desktop.png`
- `target-dashboard-viewer-email-conversation-desktop.png`
- `target-dashboard-viewer-email-summary-desktop.png`

## Validation status

- `npm run service:connaissance:typecheck`: OK
- `npm run service:connaissance:build`: OK
- `node scripts/knowledge-behavior-parity.mjs`: OK before this tranche; rerun in final validation batch.

This is not full module completion. The service still needs real data binding,
Bridge OAuth launch context, Supabase-backed storage and the remaining
Connaissance screens before the global goal can be marked complete.
