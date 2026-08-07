#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const sourceRoot = process.env.YAKA_CONNAISSANCE_SOURCE_DIR ?? "/Users/nicolascleton/Documents/connaissanceNEW";
const appV2 = join(sourceRoot, "src/app-v2");
const serviceRoot = join(root, "services/connaissance");

const patterns = [
  /<button[^>]*>([\s\S]*?)<\/button>/g,
  /<a[^>]*>([\s\S]*?)<\/a>/g,
  /<Link[^>]*>([\s\S]*?)<\/Link>/g,
  /<option[^>]*>([\s\S]*?)<\/option>/g,
  /\bplaceholder=["'`]([^"'`]+)["'`]/g,
  /\baria-label=["'`]([^"'`]+)["'`]/g,
];

const sourceLabels = extractInteractiveLabels(appV2);
const serviceText = walk(serviceRoot).map((file) => readFileSync(file, "utf8").toLowerCase()).join("\n");
const missing = sourceLabels.filter((entry) => !serviceText.includes(entry.label.toLowerCase()));
const uniqueMissing = dedupe(missing, (entry) => `${entry.file}:${entry.label}`);

const markdown = [
  "# Knowledge interactive parity report",
  "",
  `Source: \`${appV2}\``,
  `Service: \`${serviceRoot}\``,
  "",
  `Source interactive labels: ${sourceLabels.length}`,
  `Missing labels: ${uniqueMissing.length}`,
  "",
  "| Source file | Missing label |",
  "|---|---|",
  ...(uniqueMissing.length
    ? uniqueMissing.map((entry) => `| ${entry.file} | ${escapePipes(entry.label)} |`)
    : ["| - | - |"]),
  "",
].join("\n");

const outputPath = join(root, "docs/knowledge-ai-interactive-parity-report.md");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, markdown);

if (uniqueMissing.length > 0) {
  console.error(markdown);
  process.exit(1);
}

console.log(markdown);

function extractInteractiveLabels(dir) {
  const out = [];
  for (const file of walk(dir)) {
    const raw = readFileSync(file, "utf8");
    const rel = file.slice(dir.length + 1);
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(raw))) {
        const label = clean(match[1]);
        if (keep(label)) out.push({ file: rel, label });
      }
    }
  }
  return dedupe(out, (entry) => `${entry.file}:${entry.label}`);
}

function clean(value) {
  return value
    .replace(/\{[^}]*\}/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keep(value) {
  if (!value || value.length < 2 || value.length > 160) return false;
  if (/[{};]/.test(value)) return false;
  if (/^[#0-9A-Fa-f(),.%\s-]+$/.test(value)) return false;
  if (/^(className|onClick|return |const |let |import |export )/.test(value)) return false;
  return true;
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    if ([".next", "node_modules", "dist", "build"].includes(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

function dedupe(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function escapePipes(value) {
  return value.replaceAll("|", "\\|");
}
