# Inventaire Connaissance app-v2 vers service Bridge

Ce rapport est genere par `node scripts/knowledge-app-v2-inventory.mjs`.

## Racines

- Source UI : `/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2`
- Cible service : `/Users/nicolascleton/Documents/Yaka-Bridge/services/connaissance`

## Comptage global

| Surface | Fichiers | Composants | Boutons | Inputs | Textareas | Dialogs/Modal refs | Hints Supabase direct | Hints IA cloud |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Source app-v2 | 85 | 76 | 253 | 21 | 10 | 332 | 31 | 94 |
| Service cible | 54 | 77 | 278 | 31 | 13 | 100 | 0 | 7 |

## Couverture par dossier source

| Dossier source | Fichiers | Liste |
| --- | --- | --- |
| Pages | 11 | `pages/ChatPage.tsx`<br>`pages/DashboardPage.tsx`<br>`pages/UploadPage.tsx`<br>`pages/auth/LoginPage.tsx`<br>`pages/chat/ChatPage.tsx`<br>`pages/chat/index.ts`<br>`pages/dashboard/DashboardPage.tsx`<br>`pages/dashboard/index.ts`<br>`pages/index.ts`<br>`pages/upload/UploadPage.tsx`<br>`pages/upload/index.ts` |
| Chat | 10 | `components/chat/ChatHistory.tsx`<br>`components/chat/ChatInput.tsx`<br>`components/chat/ChatMessage.tsx`<br>`components/chat/ChatPanel.tsx`<br>`components/chat/ChatView.tsx`<br>`components/chat/ShortcutsBar.tsx`<br>`components/chat/ShortcutsManagerModal.tsx`<br>`components/chat/SlashCommandMenu.tsx`<br>`components/chat/StructuredDataView.tsx`<br>`components/chat/index.ts` |
| Upload | 7 | `components/upload/GoogleSheetsPickerModal.tsx`<br>`components/upload/ScannerModal.tsx`<br>`components/upload/ScreenRecordModal.tsx`<br>`components/upload/UploadHub.tsx`<br>`components/upload/UploadProgress.tsx`<br>`components/upload/UploadTile.tsx`<br>`components/upload/index.ts` |
| Knowledge | 15 | `components/knowledge/AssociateKnowledgeModal.tsx`<br>`components/knowledge/AudioDetailViewer.tsx`<br>`components/knowledge/AutomationTab.tsx`<br>`components/knowledge/GenericDetailViewer.tsx`<br>`components/knowledge/GroupDetailModal.tsx`<br>`components/knowledge/KnowledgeBrowser.tsx`<br>`components/knowledge/KnowledgeCard.tsx`<br>`components/knowledge/KnowledgeEditorModal.tsx`<br>`components/knowledge/KnowledgeFilter.tsx`<br>`components/knowledge/ProcessingCard.tsx`<br>`components/knowledge/ReplaceContentModal.tsx`<br>`components/knowledge/SocialDetailViewer.tsx`<br>`components/knowledge/VersionHistoryModal.tsx`<br>`components/knowledge/VideoDetailViewer.tsx`<br>`components/knowledge/index.ts` |
| Email | 3 | `components/email/EmailMessageCard.tsx`<br>`components/email/EmailThreadViewer.tsx`<br>`components/email/index.ts` |
| Layout | 5 | `components/layout/AppLayout.tsx`<br>`components/layout/MainLayout.tsx`<br>`components/layout/Sidebar.tsx`<br>`components/layout/TabNavigation.tsx`<br>`components/layout/index.ts` |
| UI | 7 | `components/ui/Avatar.tsx`<br>`components/ui/Badge.tsx`<br>`components/ui/Button.tsx`<br>`components/ui/Card.tsx`<br>`components/ui/Input.tsx`<br>`components/ui/Modal.tsx`<br>`components/ui/index.ts` |
| Stores | 3 | `stores/authStore.ts`<br>`stores/chatStore.ts`<br>`stores/knowledgeStore.ts` |
| Services | 8 | `services/ChatShortcutService.ts`<br>`services/MuxVideoPollingService.ts`<br>`services/chat/ConversationalAgentService.ts`<br>`services/chat/SpeechRecognitionService.ts`<br>`services/chat/index.ts`<br>`services/knowledge/StructuredDataService.ts`<br>`services/upload/index.ts`<br>`services/upload/uploadService.ts` |
| Types | 5 | `types/auth.types.ts`<br>`types/chat.types.ts`<br>`types/index.ts`<br>`types/knowledge.types.ts`<br>`types/upload.types.ts` |
| Design System | 5 | `design-system/colors.ts`<br>`design-system/effects.ts`<br>`design-system/index.ts`<br>`design-system/spacing.ts`<br>`design-system/typography.ts` |

## Couverture par dossier cible

| Dossier cible | Fichiers | Liste |
| --- | --- | --- |
| Routes | 17 | `app/agents/page.tsx`<br>`app/analytics/page.tsx`<br>`app/api/bridge/actions/[id]/route.ts`<br>`app/api/healthz/route.ts`<br>`app/bridge/launch/route.ts`<br>`app/chat/page.tsx`<br>`app/dashboard/page.tsx`<br>`app/groups/[id]/page.tsx`<br>`app/healthz/route.ts`<br>`app/knowledge/[id]/page.tsx`<br>`app/layout.tsx`<br>`app/login/page.tsx`<br>`app/page.tsx`<br>`app/projects/[id]/page.tsx`<br>`app/search/page.tsx`<br>`app/settings/page.tsx`<br>`app/upload/page.tsx` |
| Components | 28 | `components/AgentsWorkspace.tsx`<br>`components/AnalyticsWorkspace.tsx`<br>`components/AutomationPanel.tsx`<br>`components/BridgeLoginPanel.tsx`<br>`components/ChatComposer.tsx`<br>`components/ChatHistory.tsx`<br>`components/ChatMessage.tsx`<br>`components/ConnaissanceChatMessage.tsx`<br>`components/ConnaissanceNewChat.tsx`<br>`components/ConnaissanceNewDashboard.tsx`<br>`components/ConnaissanceNewUpload.tsx`<br>`components/ConnaissanceShortcuts.tsx`<br>`components/DetailViewers.tsx`<br>`components/GoogleSheetsPickerModal.tsx`<br>`components/GroupWorkspace.tsx`<br>`components/KnowledgeBrowser.tsx`<br>`components/KnowledgeManagementModals.tsx`<br>`components/ProjectWorkspace.tsx`<br>`components/SearchWorkspace.tsx`<br>`components/ServiceIcon.tsx`<br>`components/SettingsWorkspace.tsx`<br>`components/ShortcutManagerModal.tsx`<br>`components/StructuredDataPanel.tsx`<br>`components/StructuredDataView.tsx`<br>`components/UploadHub.tsx`<br>`components/UploadProgress.tsx`<br>`components/UploadTile.tsx`<br>`components/UploadTypes.ts` |
| Lib | 2 | `lib/bridge-actions.ts`<br>`lib/bridge-launch.ts` |
| Data | 2 | `data/feature-catalog.ts`<br>`data/surfaces.ts` |

## Composants source deja presents par nom

- `AudioDetailViewer`
- `ChatHistory`
- `ChatInput`
- `ChatMessage`
- `ChatPage`
- `ChatPanel`
- `DashboardPage`
- `EmailThreadViewer`
- `GenericDetailViewer`
- `GoogleSheetsPickerModal`
- `KnowledgeBrowser`
- `KnowledgeCard`
- `LoginPage`
- `ProcessingCard`
- `ScannerModal`
- `ScreenRecordModal`
- `ShortcutsBar`
- `ShortcutsManagerModal`
- `SlashCommandMenu`
- `SocialDetailViewer`
- `SourceCard`
- `StructuredDataView`
- `SystemMessage`
- `UploadHub`
- `UploadModal`
- `UploadPage`
- `UploadProgress`
- `UploadProgressPanel`
- `UploadTile`
- `VideoDetailViewer`

## Composants source manquants par nom

- `App`
- `AppLayout`
- `AppsScriptModal`
- `AssociateKnowledgeModal`
- `AutomationTab`
- `Avatar`
- `AvatarGroup`
- `Badge`
- `Button`
- `Card`
- `CardContent`
- `CardDescription`
- `CardFooter`
- `CardHeader`
- `CardTitle`
- `ChatShortcutService`
- `ChatView`
- `ConfirmModal`
- `CurrentVersionCard`
- `EmailMessageCard`
- `GroupDetailModal`
- `GroupGridCard`
- `Input`
- `KnowledgeCardCompact`
- `KnowledgeEditorModal`
- `KnowledgeFilter`
- `MainLayout`
- `Modal`
- `ModalFooter`
- `MuxVideoPollingService`
- `NewConversationButton`
- `ProcessingBadge`
- `QuestionnaireCard`
- `QuestionnaireModal`
- `ReplaceContentModal`
- `ShareQuestionnaireModal`
- `Sidebar`
- `SidebarItem`
- `SidebarSection`
- `StructuredDataService`
- `TabNavigation`
- `TagBadge`
- `UploadInputModal`
- `UploadMethodCard`
- `VersionCard`
- `VersionHistoryModal`

## Fichiers source sans equivalent nominal cible

- `App`
- `AppLayout`
- `AssociateKnowledgeModal`
- `AudioDetailViewer`
- `AutomationTab`
- `Avatar`
- `Badge`
- `Button`
- `Card`
- `ChatInput`
- `ChatPage`
- `ChatPanel`
- `ChatShortcutService`
- `ChatView`
- `ConversationalAgentService`
- `DashboardPage`
- `EmailMessageCard`
- `EmailThreadViewer`
- `GenericDetailViewer`
- `GroupDetailModal`
- `Input`
- `KnowledgeCard`
- `KnowledgeEditorModal`
- `KnowledgeFilter`
- `LoginPage`
- `MainLayout`
- `Modal`
- `MuxVideoPollingService`
- `ProcessingCard`
- `ReplaceContentModal`
- `ScannerModal`
- `ScreenRecordModal`
- `ShortcutsBar`
- `ShortcutsManagerModal`
- `Sidebar`
- `SlashCommandMenu`
- `SocialDetailViewer`
- `SpeechRecognitionService`
- `StructuredDataService`
- `TabNavigation`
- `UploadPage`
- `VersionHistoryModal`
- `VideoDetailViewer`
- `auth.types`
- `authStore`
- `chat.types`
- `chatStore`
- `colors`
- `effects`
- `index`
- `knowledge.types`
- `knowledgeStore`
- `main`
- `spacing`
- `supabase`
- `tailwind.config`
- `typography`
- `upload.types`
- `uploadService`
- `useSpeechRecognition`
- `utils`

## Priorite de port constatee

- Chat : remplacer progressivement le chat simplifie par les composants source `ChatPanel`, `ChatInput`, `ChatMessage`, `ChatHistory`, `ShortcutsBar`, `SlashCommandMenu`, `ShortcutsManagerModal`.
- Upload : garder la structure source `UploadHub`, `UploadProgress`, `ScannerModal`, `ScreenRecordModal`, `GoogleSheetsPickerModal` et connecter chaque mutation a `knowledge_ai.*`.
- Dashboard/Knowledge : porter `KnowledgeBrowser`, `KnowledgeCard`, `KnowledgeFilter`, `GroupDetailModal`, `KnowledgeEditorModal`, `AssociateKnowledgeModal`, `ReplaceContentModal`, `VersionHistoryModal` et les viewers specialises.
- Runtime : remplacer les stores/services source qui appellent Supabase/Edge Functions par des adapters Bridge/OAuth/local-only, sans changer les composants visuels.

