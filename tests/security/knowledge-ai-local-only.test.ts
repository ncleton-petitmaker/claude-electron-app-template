import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const scannedRoots = [
  "modules/knowledge_ai",
  "app/connaissance",
  "app/admin/knowledge-ai",
  "server/knowledge-ai-runtime.ts",
];

const forbiddenRuntimePatterns = [
  /OPENAI_API_KEY/,
  /ANTHROPIC_API_KEY/,
  /MISTRAL_API_KEY/,
  /GOOGLE_API_KEY/,
  /PERPLEXITY_API_KEY/,
  /api\.openai\.com/i,
  /api\.anthropic\.com/i,
  /api\.mistral\.ai/i,
  /generativelanguage\.googleapis\.com/i,
  /api\.perplexity\.ai/i,
  /from\s+["']openai["']/i,
  /from\s+["']@anthropic-ai\/sdk["']/i,
  /from\s+["']@mistralai\/mistralai["']/i,
  /from\s+["']@langchain\//i,
  /langchain\.com/i,
];

test("knowledge ai runtime stays local-only", () => {
  const failures: string[] = [];
  for (const file of scanFiles(scannedRoots)) {
    const raw = readFileSync(file, "utf8");
    for (const pattern of forbiddenRuntimePatterns) {
      if (pattern.test(raw)) failures.push(`${file} matched ${pattern}`);
    }
  }
  assert.deepEqual(failures, []);
});

function scanFiles(paths: string[]): string[] {
  const files: string[] = [];
  for (const current of paths) {
    const stat = statSync(current);
    if (stat.isFile()) {
      files.push(current);
      continue;
    }
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      const entryStat = statSync(full);
      if (entryStat.isDirectory()) files.push(...scanFiles([full]));
      else if ([".ts", ".tsx", ".json"].includes(extname(entry))) files.push(full);
    }
  }
  return files;
}
