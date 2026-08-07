#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const repoRoot = process.cwd();
const sourceRoot = "/Users/nicolascleton/Documents/connaissanceNEW/src/app-v2";
const targetRoot = join(repoRoot, "services/connaissance");
const reportPath = join(repoRoot, "docs/knowledge-ai-app-v2-inventory.md");

const sourceCategories = [
  { label: "Pages", prefix: "pages/" },
  { label: "Chat", prefix: "components/chat/" },
  { label: "Upload", prefix: "components/upload/" },
  { label: "Knowledge", prefix: "components/knowledge/" },
  { label: "Email", prefix: "components/email/" },
  { label: "Layout", prefix: "components/layout/" },
  { label: "UI", prefix: "components/ui/" },
  { label: "Stores", prefix: "stores/" },
  { label: "Services", prefix: "services/" },
  { label: "Types", prefix: "types/" },
  { label: "Design System", prefix: "design-system/" },
];

const targetCategories = [
  { label: "Routes", prefix: "app/" },
  { label: "Components", prefix: "components/" },
  { label: "Lib", prefix: "lib/" },
  { label: "Data", prefix: "data/" },
];

function listCodeFiles(root) {
  const out = [];
  function visit(dir) {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
      const abs = join(dir, entry);
      const stats = statSync(abs);
      if (stats.isDirectory()) {
        visit(abs);
        continue;
      }
      if ([".ts", ".tsx", ".json", ".mjs"].includes(extname(abs))) out.push(abs);
    }
  }
  visit(root);
  return out.sort();
}

function read(abs) {
  return readFileSync(abs, "utf8");
}

function extractNames(text) {
  const names = new Set();
  const patterns = [
    /export\s+(?:const|function)\s+([A-Z][A-Za-z0-9_]*)/g,
    /const\s+([A-Z][A-Za-z0-9_]*(?:Modal|Viewer|Panel|Page|Card|Bar|Menu|Layout|Browser|Hub|Filter|Input|Message|History))\s*[:=]/g,
    /function\s+([A-Z][A-Za-z0-9_]*(?:Modal|Viewer|Panel|Page|Card|Bar|Menu|Layout|Browser|Hub|Filter|Input|Message|History))/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) names.add(match[1]);
  }
  return [...names].sort();
}

function extractUiSignals(text) {
  return {
    buttons: [...text.matchAll(/<button\b/g)].length,
    inputs: [...text.matchAll(/<input\b/g)].length,
    textareas: [...text.matchAll(/<textarea\b/g)].length,
    selects: [...text.matchAll(/<select\b/g)].length,
    dialogs: [...text.matchAll(/role=["']dialog["']|Modal/g)].length,
    apiCloudHints: [...text.matchAll(/openai|anthropic|mistral|perplexity|gemini|GOOGLE_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|MISTRAL_API_KEY|PERPLEXITY_API_KEY/gi)].length,
    directSupabaseHints: [...text.matchAll(/@supabase\/supabase-js|createClient\(|supabase\./g)].length,
  };
}

function groupByCategory(files, root, categories) {
  return categories.map((category) => {
    const matches = files
      .map((abs) => relative(root, abs))
      .filter((file) => file.startsWith(category.prefix));
    return { ...category, files: matches };
  });
}

function summarizeFiles(files, root) {
  return files.map((abs) => {
    const text = read(abs);
    return {
      file: relative(root, abs),
      names: extractNames(text),
      signals: extractUiSignals(text),
    };
  });
}

function markdownTable(rows, columns) {
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const sep = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => column.render(row)).join(" | ")} |`);
  return [header, sep, ...body].join("\n");
}

function countSignals(summaries) {
  return summaries.reduce(
    (total, item) => {
      for (const [key, value] of Object.entries(item.signals)) total[key] = (total[key] ?? 0) + value;
      return total;
    },
    {},
  );
}

function basenameNoExt(file) {
  return file.split("/").at(-1)?.replace(/\.(tsx?|json|mjs)$/, "") ?? file;
}

const sourceFiles = listCodeFiles(sourceRoot);
const targetFiles = listCodeFiles(targetRoot);
const sourceSummaries = summarizeFiles(sourceFiles, sourceRoot);
const targetSummaries = summarizeFiles(targetFiles, targetRoot);
const sourceComponentNames = new Set(sourceSummaries.flatMap((item) => item.names));
const targetComponentNames = new Set(targetSummaries.flatMap((item) => item.names));
const missingComponents = [...sourceComponentNames].filter((name) => !targetComponentNames.has(name)).sort();
const presentComponents = [...sourceComponentNames].filter((name) => targetComponentNames.has(name)).sort();
const sourceFileKeys = new Set(sourceSummaries.map((item) => basenameNoExt(item.file)));
const targetFileKeys = new Set(targetSummaries.map((item) => basenameNoExt(item.file)));
const missingFileKeys = [...sourceFileKeys].filter((key) => !targetFileKeys.has(key)).sort();
const sourceGroups = groupByCategory(sourceFiles, sourceRoot, sourceCategories);
const targetGroups = groupByCategory(targetFiles, targetRoot, targetCategories);
const sourceSignals = countSignals(sourceSummaries);
const targetSignals = countSignals(targetSummaries);

const lines = [];
lines.push("# Inventaire Connaissance app-v2 vers service Bridge");
lines.push("");
lines.push("Ce rapport est genere par `node scripts/knowledge-app-v2-inventory.mjs`.");
lines.push("");
lines.push("## Racines");
lines.push("");
lines.push(`- Source UI : \`${sourceRoot}\``);
lines.push(`- Cible service : \`${targetRoot}\``);
lines.push("");
lines.push("## Comptage global");
lines.push("");
lines.push(markdownTable([
  { surface: "Source app-v2", files: sourceFiles.length, components: sourceComponentNames.size, ...sourceSignals },
  { surface: "Service cible", files: targetFiles.length, components: targetComponentNames.size, ...targetSignals },
], [
  { label: "Surface", render: (row) => row.surface },
  { label: "Fichiers", render: (row) => String(row.files) },
  { label: "Composants", render: (row) => String(row.components) },
  { label: "Boutons", render: (row) => String(row.buttons ?? 0) },
  { label: "Inputs", render: (row) => String(row.inputs ?? 0) },
  { label: "Textareas", render: (row) => String(row.textareas ?? 0) },
  { label: "Dialogs/Modal refs", render: (row) => String(row.dialogs ?? 0) },
  { label: "Hints Supabase direct", render: (row) => String(row.directSupabaseHints ?? 0) },
  { label: "Hints IA cloud", render: (row) => String(row.apiCloudHints ?? 0) },
]));
lines.push("");
lines.push("## Couverture par dossier source");
lines.push("");
lines.push(markdownTable(sourceGroups, [
  { label: "Dossier source", render: (row) => row.label },
  { label: "Fichiers", render: (row) => String(row.files.length) },
  { label: "Liste", render: (row) => row.files.map((file) => `\`${file}\``).join("<br>") || "-" },
]));
lines.push("");
lines.push("## Couverture par dossier cible");
lines.push("");
lines.push(markdownTable(targetGroups, [
  { label: "Dossier cible", render: (row) => row.label },
  { label: "Fichiers", render: (row) => String(row.files.length) },
  { label: "Liste", render: (row) => row.files.map((file) => `\`${file}\``).join("<br>") || "-" },
]));
lines.push("");
lines.push("## Composants source deja presents par nom");
lines.push("");
lines.push(presentComponents.length ? presentComponents.map((name) => `- \`${name}\``).join("\n") : "- Aucun");
lines.push("");
lines.push("## Composants source manquants par nom");
lines.push("");
lines.push(missingComponents.length ? missingComponents.map((name) => `- \`${name}\``).join("\n") : "- Aucun");
lines.push("");
lines.push("## Fichiers source sans equivalent nominal cible");
lines.push("");
lines.push(missingFileKeys.length ? missingFileKeys.map((name) => `- \`${name}\``).join("\n") : "- Aucun");
lines.push("");
lines.push("## Priorite de port constatee");
lines.push("");
lines.push("- Chat : remplacer progressivement le chat simplifie par les composants source `ChatPanel`, `ChatInput`, `ChatMessage`, `ChatHistory`, `ShortcutsBar`, `SlashCommandMenu`, `ShortcutsManagerModal`.");
lines.push("- Upload : garder la structure source `UploadHub`, `UploadProgress`, `ScannerModal`, `ScreenRecordModal`, `GoogleSheetsPickerModal` et connecter chaque mutation a `knowledge_ai.*`.");
lines.push("- Dashboard/Knowledge : porter `KnowledgeBrowser`, `KnowledgeCard`, `KnowledgeFilter`, `GroupDetailModal`, `KnowledgeEditorModal`, `AssociateKnowledgeModal`, `ReplaceContentModal`, `VersionHistoryModal` et les viewers specialises.");
lines.push("- Runtime : remplacer les stores/services source qui appellent Supabase/Edge Functions par des adapters Bridge/OAuth/local-only, sans changer les composants visuels.");
lines.push("");

writeFileSync(reportPath, `${lines.join("\n")}\n`);
console.log(reportPath);
