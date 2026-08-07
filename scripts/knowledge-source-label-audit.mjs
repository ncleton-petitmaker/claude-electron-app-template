#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const sourceRoot = process.env.YAKA_CONNAISSANCE_SOURCE_DIR ?? "/Users/nicolascleton/Documents/connaissanceNEW";
const appV2 = join(sourceRoot, "src/app-v2");
const serviceRoot = join(root, "services/connaissance");

const groups = [
  "components/chat",
  "components/email",
  "components/knowledge",
  "components/upload",
  "components/layout",
  "pages",
];

const ignoredFragments = [
  "0)) && (",
  "0) && (",
  "0 && (",
  "Créez avec l\\",
  "Impossible de charger l\\",
  "Tapez un nom de fichier et cliquez sur \\\"Chercher\\\"",
  "Cliquez sur \\\"Arrêter le partage\\\" dans votre navigateur ou sur le bouton ci-dessous.",
];

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    if ([".next", "node_modules", "dist", "build"].includes(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx|ts)$/.test(full)) out.push(full);
  }
  return out;
}

function clean(value) {
  return value.replace(/\{[^}]*\}/g, " ").replace(/\s+/g, " ").trim();
}

function keep(value) {
  if (!value || value.length < 3 || value.length > 120) return false;
  if (ignoredFragments.includes(value)) return false;
  if (/[<>={}]/.test(value)) return false;
  if (/^\d+\s*&&|^\)|^\(|^&&|\) :|\.length|c\.isArchived/.test(value)) return false;
  if (/^[A-Za-z0-9_./:[\]-]+$/.test(value) && !/[À-ÿ ]/.test(value)) return false;
  if (/^(M\d|m\d|http|https|import |export |const |let |var |return |if |else |await |console\.|\[|\]|&&|\|\|)/.test(value)) return false;
  if (/(px-|py-|bg-|text-|flex|grid|rounded|border|shadow|hover:|focus:|duration-|transition|items-|justify-|gap-|w-|h-|p-|m-|absolute|relative|fixed|inset|opacity|z-)/.test(value)) return false;
  if (/^[#0-9A-Fa-f(),.%\s-]+$/.test(value)) return false;
  return true;
}

function labelsFromFile(file) {
  const text = readFileSync(file, "utf8");
  const labels = [];
  const patterns = [
    /\b(placeholder|aria-label|title|alt|label|description|name)\s*=\s*['"`]([^'"`]+)['"`]/g,
    />\s*([^<>{}\n][^<>{}\n]{1,100})\s*</g,
    /\b(label|title|name|description|text|message|prompt)\s*:\s*['"`]([^'"`]+)['"`]/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) {
      const value = clean(match[2] ?? match[1]);
      if (keep(value)) labels.push(value);
    }
  }
  return [...new Set(labels)];
}

const sourceFiles = walk(appV2);
const serviceText = walk(serviceRoot).map((file) => readFileSync(file, "utf8").toLowerCase()).join("\n");
const report = [];
let failed = false;

for (const group of groups) {
  const files = sourceFiles.filter((file) => relative(appV2, file).startsWith(group));
  const sourceLabels = [...new Set(files.flatMap(labelsFromFile))].sort((a, b) => a.localeCompare(b, "fr"));
  const missing = sourceLabels.filter((label) => !serviceText.includes(label.toLowerCase()));
  if (missing.length > 0) failed = true;
  report.push({ group, sourceLabelCount: sourceLabels.length, missing });
}

const markdown = [
  "# Knowledge source label audit",
  "",
  `Source: \`${appV2}\``,
  `Service: \`${serviceRoot}\``,
  "",
  "| Group | Source labels | Missing labels |",
  "|---|---:|---|",
  ...report.map((entry) => `| ${entry.group} | ${entry.sourceLabelCount} | ${entry.missing.length ? entry.missing.join("<br>") : "-"} |`),
  "",
].join("\n");

const outputPath = join(root, "docs/knowledge-ai-source-label-audit.md");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, markdown);

if (failed) {
  console.error(markdown);
  process.exit(1);
}

console.log(markdown);
