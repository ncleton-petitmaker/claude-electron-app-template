#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const sourceRoot = process.env.YAKA_CONNAISSANCE_SOURCE_DIR ?? "/Users/nicolascleton/Documents/connaissanceNEW";
const appV2 = join(sourceRoot, "src/app-v2");
const serviceRoot = join(root, "services/connaissance");

const requirements = [
  {
    id: "global-nav",
    source: ["components/layout/AppLayout.tsx", "components/layout/TabNavigation.tsx"],
    service: ["components/ConnaissanceNewChat.tsx", "components/ConnaissanceNewUpload.tsx", "components/ConnaissanceNewDashboard.tsx", "data/surfaces.ts"],
    tokens: ["Chat", "Upload", "Dashboard", "Recherche", "Analytics", "Paramètres"],
  },
  {
    id: "conversation-sidebar",
    source: ["components/layout/AppLayout.tsx", "components/layout/Sidebar.tsx"],
    service: ["components/ConnaissanceNewChat.tsx", "data/feature-catalog.ts"],
    tokens: ["Conversations", "Nouvelle conversation", "Search", "Conversations récentes", "disponible"],
  },
  {
    id: "chat-input",
    source: ["components/chat/ChatInput.tsx", "components/chat/ShortcutsBar.tsx", "components/chat/SlashCommandMenu.tsx", "components/chat/ShortcutsManagerModal.tsx"],
    service: ["components/ChatComposer.tsx", "components/ShortcutManagerModal.tsx", "data/feature-catalog.ts"],
    tokens: ["Connaissance Pro", "LLM Direct", "Raccourcis", "Attacher", "Reasoning", "Pro", "Micro", "Envoyer", "Créer un raccourci", "Modifier les raccourcis", "Titre du raccourci", "Texte du prompt", "Modèle à utiliser", "Autre modèle", "Aperçu"],
  },
  {
    id: "chat-structured-data",
    source: ["components/chat/StructuredDataView.tsx"],
    service: ["components/StructuredDataPanel.tsx", "data/feature-catalog.ts"],
    tokens: ["Données structurées", "Barres", "Barres horiz.", "Barres empilées", "Courbe", "Camembert", "Anneau", "Nuage pts", "Radar", "Voir la requête SQL", "Utilisez le chat GenBI pour interroger toutes les données"],
  },
  {
    id: "upload-hub",
    source: ["components/upload/UploadHub.tsx", "components/upload/UploadTile.tsx"],
    service: ["components/ConnaissanceNewUpload.tsx", "components/UploadHub.tsx", "data/feature-catalog.ts"],
    tokens: ["Fichiers", "Donnees", "Contenu", "Reseaux sociaux", "Avance", "PDF", "Scanner", "Video", "Audio", "Image", "Google Sheets", "YouTube", "LinkedIn", "X", "Unsplash", "Questionnaire"],
  },
  {
    id: "knowledge-browser",
    source: ["components/knowledge/KnowledgeBrowser.tsx", "components/knowledge/KnowledgeCard.tsx"],
    service: ["components/ConnaissanceNewDashboard.tsx", "components/KnowledgeBrowser.tsx", "components/KnowledgeManagementModals.tsx", "data/feature-catalog.ts"],
    tokens: ["Mes connaissances", "Explorez et gérez votre base de connaissances", "Rechercher dans vos connaissances", "Grille", "Liste", "Chat", "Voir", "Modifier", "Associer à une autre connaissance", "Remplacer le fichier", "Historique des versions", "Partager", "Copier le lien", "Supprimer", "Effacer les filtres", "Filtres actifs", "2-3 min"],
  },
  {
    id: "detail-viewers",
    source: [
      "components/knowledge/GenericDetailViewer.tsx",
      "components/knowledge/AudioDetailViewer.tsx",
      "components/knowledge/VideoDetailViewer.tsx",
      "components/knowledge/SocialDetailViewer.tsx",
      "components/knowledge/AutomationTab.tsx",
    ],
    service: ["components/DetailViewers.tsx", "components/AutomationPanel.tsx", "data/feature-catalog.ts"],
    tokens: ["Document", "Resume", "Texte OCR", "Apercu", "Donnees", "Besoins", "Taches", "Transcription", "Etapes", "Expertise", "Ressources", "Timeline", "Resume IA", "Automatisation", "Copier le texte", "Ouvrir la source", "Telecharger"],
  },
  {
    id: "knowledge-modals",
    source: [
      "components/knowledge/KnowledgeEditorModal.tsx",
      "components/knowledge/AssociateKnowledgeModal.tsx",
      "components/knowledge/ReplaceContentModal.tsx",
      "components/knowledge/VersionHistoryModal.tsx",
    ],
    service: ["components/KnowledgeManagementModals.tsx", "data/feature-catalog.ts"],
    tokens: ["Modifier la connaissance", "Informations générales", "Tags", "Associer à...", "Remplacer le fichier", "Historique des versions", "Restaurer cette version ?", "Restaurer"],
  },
  {
    id: "upload-advanced",
    source: [
      "components/upload/ScannerModal.tsx",
      "components/upload/GoogleSheetsPickerModal.tsx",
      "components/upload/ScreenRecordModal.tsx",
      "components/upload/UploadProgress.tsx",
    ],
    service: ["components/UploadHub.tsx", "data/feature-catalog.ts"],
    tokens: ["Scanner un document", "Disponible sur iPhone", "Télécharger sur l'App Store", "Importer depuis Google Sheets", "Connecter Google Sheets", "Se connecter avec Google", "Actualiser la liste", "Enregistrer votre écran", "Démarrer l'enregistrement", "Arrêter l'enregistrement", "Prévisualisation", "Recommencer", "Annuler"],
  },
  {
    id: "email-thread",
    source: ["components/email/EmailThreadViewer.tsx", "components/email/EmailMessageCard.tsx"],
    service: ["components/DetailViewers.tsx", "data/feature-catalog.ts"],
    tokens: ["Conversation", "Résumé IA", "Messages dans le thread", "Résumé de la conversation", "Réduire tout", "Tout développer", "Afficher le texte cité", "Masquer le texte cité", "Pièces jointes"],
  },
  {
    id: "auth-bridge-login",
    source: ["pages/auth/LoginPage.tsx"],
    service: ["app/login/page.tsx", "components/BridgeLoginPanel.tsx", "data/feature-catalog.ts"],
    tokens: ["Connectez-vous pour accéder à vos connaissances", "Connexion par email", "Recevez un code de connexion sécurisé", "Adresse email", "Entrez le code", "Un code à 6 chiffres a été envoyé à", "Renvoyer le code", "Utiliser une autre adresse", "Connaissance.pro - Votre base de connaissances intelligente"],
  },
  {
    id: "agents-projects-settings",
    source: ["App.tsx", "types/chat.types.ts", "types/knowledge.types.ts"],
    service: [
      "components/AgentsWorkspace.tsx",
      "components/ProjectWorkspace.tsx",
      "components/GroupWorkspace.tsx",
      "components/SettingsWorkspace.tsx",
      "data/feature-catalog.ts",
      "data/surfaces.ts",
    ],
    tokens: ["Creer un agent", "instructions systeme", "Contexte projet", "Sources associees", "Agents du projet", "Coolify", "Supabase", "OAuth Bridge", "dgx_spark_lan"],
  },
  {
    id: "search-analytics-routes",
    source: ["components/layout/AppLayout.tsx", "types/knowledge.types.ts"],
    service: [
      "app/search/page.tsx",
      "app/analytics/page.tsx",
      "components/SearchWorkspace.tsx",
      "components/AnalyticsWorkspace.tsx",
      "../../modules/knowledge_ai/module.config.json",
      "../../server/actions.ts",
    ],
    tokens: ["Recherche Connaissance", "Analytics Connaissance", "knowledge_ai.knowledge.search", "knowledge_ai.analytics.refresh", "Rechercher dans vos connaissances", "Actualiser analytics"],
  },
  {
    id: "settings-modal-bridge",
    source: [
      "../components/Settings/SettingsModal.tsx",
      "../components/Settings/sections/SettingsAutomation.tsx",
      "../components/Settings/sections/SettingsWorkflows.tsx",
      "../components/Settings/sections/SettingsConnectors.tsx",
      "../components/Settings/sections/SettingsData.tsx",
      "../components/Settings/sections/SettingsApiKeys.tsx",
      "../components/Settings/sections/SettingsAccount.tsx",
    ],
    service: [
      "app/settings/page.tsx",
      "components/SettingsWorkspace.tsx",
      "components/SearchWorkspace.tsx",
      "../../modules/knowledge_ai/module.config.json",
      "../../server/actions.ts",
    ],
    tokens: ["Tri automatique", "Integrations", "Connecteurs", "Donnees", "Cles API", "Compte", "knowledge_ai.settings.update", "knowledge_ai.connector.connect", "knowledge_ai.api_key.create", "knowledge_ai.account.logout"],
  },
  {
    id: "service-architecture",
    source: ["App.tsx"],
    service: ["app/bridge/launch/route.ts", "app/healthz/route.ts", "app/api/bridge/actions/[id]/route.ts", "../../server/actions.ts"],
    tokens: ["consumeBridgeLaunchTicket", "knowledge_ai", "local_only", "BRIDGE_CONTROL_PLANE_URL", "knowledge_ai.viewer.action"],
  },
];

const report = [];
let failed = false;

for (const requirement of requirements) {
  const sourceFiles = requirement.source.map((file) => join(appV2, file));
  const serviceFiles = requirement.service.map((file) => join(serviceRoot, file));
  const missingSource = sourceFiles.filter((file) => !existsSync(file));
  const missingService = serviceFiles.filter((file) => !existsSync(file));
  const serviceText = serviceFiles.filter(existsSync).map((file) => readFileSync(file, "utf8")).join("\n");
  const missingTokens = requirement.tokens.filter((token) => !serviceText.toLowerCase().includes(token.toLowerCase()));
  const ok = missingSource.length === 0 && missingService.length === 0 && missingTokens.length === 0;
  if (!ok) failed = true;
  report.push({
    id: requirement.id,
    ok,
    sourceFiles: requirement.source,
    serviceFiles: requirement.service,
    missingSource: missingSource.map((file) => file.replace(`${appV2}/`, "")),
    missingService: missingService.map((file) => file.replace(`${serviceRoot}/`, "")),
    missingTokens,
  });
}

const markdown = [
  "# Knowledge service parity report",
  "",
  `Source: \`${appV2}\``,
  `Service: \`${serviceRoot}\``,
  "",
  "| Requirement | Status | Missing |",
  "|---|---|---|",
  ...report.map((item) => {
    const missing = [
      ...item.missingSource.map((entry) => `source:${entry}`),
      ...item.missingService.map((entry) => `service:${entry}`),
      ...item.missingTokens.map((entry) => `token:${entry}`),
    ];
    return `| ${item.id} | ${item.ok ? "OK" : "MISSING"} | ${missing.join(", ") || "-"} |`;
  }),
  "",
].join("\n");

writeFileSync(join(root, "docs/knowledge-ai-service-parity-report.md"), markdown);

if (failed) {
  console.error(markdown);
  process.exit(1);
}

console.log(markdown);
