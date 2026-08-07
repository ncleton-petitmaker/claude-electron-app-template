#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const sourceRoot = process.env.YAKA_CONNAISSANCE_SOURCE_DIR ?? "/Users/nicolascleton/Documents/connaissanceNEW";
const appV2 = join(sourceRoot, "src/app-v2");
const serviceRoot = join(root, "services/connaissance");
const actionsFile = join(root, "server/actions.ts");
const manifestFile = join(root, "modules/knowledge_ai/module.config.json");

const sourceBehaviorFiles = [
  "stores/authStore.ts",
  "stores/chatStore.ts",
  "stores/knowledgeStore.ts",
  "services/ChatShortcutService.ts",
  "services/chat/ConversationalAgentService.ts",
  "services/chat/SpeechRecognitionService.ts",
  "services/knowledge/StructuredDataService.ts",
  "services/upload/uploadService.ts",
  "services/MuxVideoPollingService.ts",
  "hooks/useSpeechRecognition.ts",
];

const requiredActions = [
  ["auth.otp.send", "knowledge_ai.auth.otp.send"],
  ["auth.otp.verify", "knowledge_ai.auth.otp.verify"],
  ["auth.session.refresh", "knowledge_ai.auth.session.refresh"],
  ["auth.user.get", "knowledge_ai.auth.user.get"],
  ["auth.company.get", "knowledge_ai.auth.company.get"],
  ["conversation.send", "knowledge_ai.chat.send"],
  ["conversation.stream", "knowledge_ai.chat.stream"],
  ["citation.open", "knowledge_ai.citation.open"],
  ["web_source.open", "knowledge_ai.web_source.open"],
  ["conversation.list", "knowledge_ai.conversation.list"],
  ["conversation.load", "knowledge_ai.conversation.load"],
  ["conversation.archive", "knowledge_ai.conversation.archive"],
  ["conversation.delete", "knowledge_ai.conversation.delete"],
  ["conversation.clear", "knowledge_ai.conversation.clear"],
  ["conversation.context.set", "knowledge_ai.conversation.context.set"],
  ["conversation.options.set", "knowledge_ai.conversation.options.set"],
  ["shortcut.list", "knowledge_ai.shortcut.list"],
  ["shortcut.create", "knowledge_ai.shortcut.create"],
  ["shortcut.update", "knowledge_ai.shortcut.update"],
  ["shortcut.delete", "knowledge_ai.shortcut.delete"],
  ["shortcut.reorder", "knowledge_ai.shortcut.reorder"],
  ["shortcut.track_usage", "knowledge_ai.shortcut.track_usage"],
  ["shortcut.create_defaults", "knowledge_ai.shortcut.create_defaults"],
  ["knowledge.list", "knowledge_ai.knowledge.list"],
  ["knowledge.get", "knowledge_ai.knowledge.get"],
  ["knowledge.update", "knowledge_ai.knowledge.update"],
  ["knowledge.delete", "knowledge_ai.knowledge.delete"],
  ["knowledge.associate", "knowledge_ai.knowledge.associate"],
  ["knowledge.replace_file", "knowledge_ai.knowledge.replace_file"],
  ["knowledge.version.list", "knowledge_ai.knowledge.version.list"],
  ["knowledge.version.restore", "knowledge_ai.knowledge.version.restore"],
  ["knowledge.group.list", "knowledge_ai.knowledge.group.list"],
  ["knowledge.group.create", "knowledge_ai.knowledge.group.create"],
  ["knowledge.group.update", "knowledge_ai.knowledge.group.update"],
  ["knowledge.group.delete", "knowledge_ai.knowledge.group.delete"],
  ["knowledge.filter.set", "knowledge_ai.knowledge.filter.set"],
  ["knowledge.scope.set", "knowledge_ai.knowledge.scope.set"],
  ["knowledge.processing.add", "knowledge_ai.knowledge.processing.add"],
  ["knowledge.processing.remove", "knowledge_ai.knowledge.processing.remove"],
  ["upload.text", "knowledge_ai.upload.text"],
  ["upload.file", "knowledge_ai.upload.file"],
  ["upload.url", "knowledge_ai.upload.url"],
  ["upload.youtube", "knowledge_ai.upload.youtube"],
  ["upload.linkedin", "knowledge_ai.upload.linkedin"],
  ["upload.twitter", "knowledge_ai.upload.twitter"],
  ["upload.spreadsheet", "knowledge_ai.upload.spreadsheet"],
  ["upload.google_sheets", "knowledge_ai.upload.google_sheets"],
  ["questionnaire.generate", "knowledge_ai.questionnaire.generate"],
  ["questionnaire.share", "knowledge_ai.questionnaire.share"],
  ["structured.schema.get", "knowledge_ai.structured.schema.get"],
  ["structured.data.get", "knowledge_ai.structured.data.get"],
  ["structured.fetch", "knowledge_ai.structured.fetch"],
  ["structured.format", "knowledge_ai.structured.format"],
  ["agent.create", "knowledge_ai.agent.create"],
  ["agent.test", "knowledge_ai.agent.test"],
  ["agent.update", "knowledge_ai.agent.update"],
  ["agent.duplicate", "knowledge_ai.agent.duplicate"],
  ["agent.archive", "knowledge_ai.agent.archive"],
  ["project.create", "knowledge_ai.project.create"],
  ["project.update_context", "knowledge_ai.project.update_context"],
  ["project.launch_agent", "knowledge_ai.project.launch_agent"],
  ["automation.run", "knowledge_ai.automation.run"],
  ["viewer.action", "knowledge_ai.viewer.action"],
  ["speech.start", "knowledge_ai.speech.start"],
  ["speech.stop", "knowledge_ai.speech.stop"],
  ["speech.toggle", "knowledge_ai.speech.toggle"],
  ["speech.reset", "knowledge_ai.speech.reset"],
  ["video.poll.start", "knowledge_ai.video.poll.start"],
  ["video.poll.status", "knowledge_ai.video.poll.status"],
  ["video.poll.stop", "knowledge_ai.video.poll.stop"],
  ["video.poll.clear", "knowledge_ai.video.poll.clear"],
];

const requiredServiceCalls = [
  "knowledge_ai.auth.otp.send",
  "knowledge_ai.auth.otp.verify",
  "knowledge_ai.chat.stream",
  "knowledge_ai.citation.open",
  "knowledge_ai.web_source.open",
  "knowledge_ai.conversation.context.set",
  "knowledge_ai.conversation.options.set",
  "knowledge_ai.shortcut.create",
  "knowledge_ai.shortcut.update",
  "knowledge_ai.shortcut.delete",
  "knowledge_ai.shortcut.reorder",
  "knowledge_ai.shortcut.track_usage",
  "knowledge_ai.knowledge.update",
  "knowledge_ai.knowledge.delete",
  "knowledge_ai.knowledge.associate",
  "knowledge_ai.knowledge.replace_file",
  "knowledge_ai.knowledge.version.restore",
  "knowledge_ai.knowledge.group.update",
  "knowledge_ai.knowledge.group.delete",
  "knowledge_ai.upload.text",
  "knowledge_ai.upload.file",
  "knowledge_ai.upload.url",
  "knowledge_ai.upload.youtube",
  "knowledge_ai.upload.linkedin",
  "knowledge_ai.upload.twitter",
  "knowledge_ai.upload.spreadsheet",
  "knowledge_ai.upload.google_sheets",
  "knowledge_ai.questionnaire.generate",
  "knowledge_ai.questionnaire.share",
  "knowledge_ai.structured.fetch",
  "knowledge_ai.agent.create",
  "knowledge_ai.agent.test",
  "knowledge_ai.agent.update",
  "knowledge_ai.agent.duplicate",
  "knowledge_ai.agent.archive",
  "knowledge_ai.project.update_context",
  "knowledge_ai.project.launch_agent",
  "knowledge_ai.automation.run",
  "knowledge_ai.viewer.action",
  "knowledge_ai.speech.toggle",
  "knowledge_ai.video.poll.start",
];

const forbiddenServiceCalls = [
  "knowledge_ai.ui.action",
  "knowledge_ai.source.inventory",
  "knowledge_ai.upload.prepare",
];

const actionsText = readFileSync(actionsFile, "utf8");
const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
const serviceText = walk(serviceRoot).map((file) => readFileSync(file, "utf8")).join("\n");

let failed = false;

const missingSourceFiles = sourceBehaviorFiles.filter((file) => !existsSync(join(appV2, file)));
const missingActions = requiredActions.filter(([, actionId]) => !actionsText.includes(`"${actionId}"`));
const manifestActionIds = new Set((manifest.actions ?? []).map((entry) => entry.id));
const missingManifestActions = requiredActions.filter(([, actionId]) => !manifestActionIds.has(actionId));
const missingServiceCalls = requiredServiceCalls.filter((actionId) => !serviceText.includes(`"${actionId}"`));
const forbiddenCalls = forbiddenServiceCalls.filter((actionId) => serviceText.includes(`"${actionId}"`));

if (missingSourceFiles.length || missingActions.length || missingManifestActions.length || missingServiceCalls.length || forbiddenCalls.length) failed = true;

const markdown = [
  "# Knowledge behavior parity report",
  "",
  `Source: \`${appV2}\``,
  `Service: \`${serviceRoot}\``,
  "",
  "## Source behavior files",
  "",
  missingSourceFiles.length ? missingSourceFiles.map((file) => `- MISSING ${file}`).join("\n") : "- OK",
  "",
  "## Bridge actions",
  "",
  "| Behavior | Action | Status |",
  "|---|---|---|",
  ...requiredActions.map(([behavior, actionId]) => `| ${behavior} | \`${actionId}\` | ${actionsText.includes(`"${actionId}"`) ? "OK" : "MISSING"} |`),
  "",
  "## Manifest actions",
  "",
  "| Behavior | Action | Status |",
  "|---|---|---|",
  ...requiredActions.map(([behavior, actionId]) => `| ${behavior} | \`${actionId}\` | ${manifestActionIds.has(actionId) ? "OK" : "MISSING"} |`),
  "",
  "## Service calls",
  "",
  "| Action | Status |",
  "|---|---|",
  ...requiredServiceCalls.map((actionId) => `| \`${actionId}\` | ${serviceText.includes(`"${actionId}"`) ? "OK" : "MISSING"} |`),
  "",
  "## Forbidden product calls",
  "",
  forbiddenCalls.length ? forbiddenCalls.map((actionId) => `- FORBIDDEN ${actionId}`).join("\n") : "- OK",
  "",
].join("\n");

const outputPath = join(root, "docs/knowledge-ai-behavior-parity-report.md");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, markdown);

if (failed) {
  console.error(markdown);
  process.exit(1);
}

console.log(markdown);

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    if ([".next", "node_modules", "dist", "build"].includes(entry)) continue;
    const full = join(dir, entry);
    const rel = relative(root, full).replace(/\\/g, "/");
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx|ts|mjs|js|json|md)$/.test(rel)) out.push(full);
  }
  return out;
}
