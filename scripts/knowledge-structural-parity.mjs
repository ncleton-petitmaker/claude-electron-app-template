#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const sourceRoot = process.env.YAKA_CONNAISSANCE_SOURCE_DIR ?? "/Users/nicolascleton/Documents/connaissanceNEW";
const appV2 = join(sourceRoot, "src/app-v2");
const serviceRoot = join(root, "services/connaissance");

const coverageRules = [
  {
    match: (file) => file === "App.tsx" || file === "main.tsx",
    service: ["app/layout.tsx", "app/page.tsx", "components/ConnaissanceShell.tsx", "components/ChatComposer.tsx", "components/UploadHub.tsx", "components/KnowledgeBrowser.tsx"],
  },
  {
    match: (file) => file.startsWith("components/chat/"),
    service: ["components/ChatComposer.tsx", "components/ShortcutManagerModal.tsx", "components/StructuredDataPanel.tsx", "components/ConnaissanceShell.tsx"],
  },
  {
    match: (file) => file.startsWith("components/email/"),
    service: ["components/DetailViewers.tsx"],
  },
  {
    match: (file) => file.startsWith("components/knowledge/"),
    service: ["components/KnowledgeBrowser.tsx", "components/KnowledgeManagementModals.tsx", "components/DetailViewers.tsx", "components/AutomationPanel.tsx", "components/GroupWorkspace.tsx"],
  },
  {
    match: (file) => file.startsWith("components/layout/"),
    service: ["components/ConnaissanceShell.tsx", "data/surfaces.ts", "app/globals.css"],
  },
  {
    match: (file) => file.startsWith("components/ui/"),
    service: ["app/globals.css", "components/ServiceIcon.tsx", "components/ProductSurface.tsx"],
  },
  {
    match: (file) => file.startsWith("components/upload/"),
    service: ["components/UploadHub.tsx"],
  },
  {
    match: (file) => file === "pages/auth/LoginPage.tsx",
    service: ["app/login/page.tsx", "components/BridgeLoginPanel.tsx"],
  },
  {
    match: (file) => file === "pages/ChatPage.tsx" || file === "pages/chat/ChatPage.tsx",
    service: ["app/chat/page.tsx", "components/ChatComposer.tsx"],
  },
  {
    match: (file) => file === "pages/DashboardPage.tsx" || file === "pages/dashboard/DashboardPage.tsx",
    service: ["app/dashboard/page.tsx", "components/KnowledgeBrowser.tsx"],
  },
  {
    match: (file) => file === "pages/UploadPage.tsx" || file === "pages/upload/UploadPage.tsx",
    service: ["app/upload/page.tsx", "components/UploadHub.tsx"],
  },
];

const sourceFiles = walk(appV2).filter((file) => file.endsWith(".tsx")).map((file) => file.slice(appV2.length + 1).replaceAll("\\", "/")).sort();
const rows = sourceFiles.map((file) => {
  const rule = coverageRules.find((entry) => entry.match(file));
  const service = rule?.service ?? [];
  const missingService = service.filter((target) => !existsSync(join(serviceRoot, target)));
  return {
    file,
    service,
    ok: Boolean(rule) && missingService.length === 0,
    missingService,
  };
});

const failed = rows.some((row) => !row.ok);

const markdown = [
  "# Knowledge structural parity report",
  "",
  `Source: \`${appV2}\``,
  `Service: \`${serviceRoot}\``,
  "",
  `Source TSX files: ${sourceFiles.length}`,
  `Covered files: ${rows.filter((row) => row.ok).length}`,
  "",
  "| Source file | Service evidence | Status |",
  "|---|---|---|",
  ...rows.map((row) => `| ${row.file} | ${row.service.map((entry) => `\`${entry}\``).join("<br>") || "-"} | ${row.ok ? "OK" : `MISSING ${row.missingService.join(", ") || "rule"}`} |`),
  "",
].join("\n");

const outputPath = join(root, "docs/knowledge-ai-structural-parity-report.md");
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
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (stat.isFile()) out.push(full);
  }
  return out;
}
