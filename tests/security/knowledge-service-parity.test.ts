import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

test("Connaissance service keeps source UI parity guard green", () => {
  execFileSync("node", ["scripts/knowledge-service-parity.mjs"], {
    cwd: process.cwd(),
    stdio: "pipe",
    encoding: "utf8",
  });
  const report = readFileSync("docs/knowledge-ai-service-parity-report.md", "utf8");
  assert.match(report, /\| global-nav \| OK \| - \|/);
  assert.match(report, /\| chat-input \| OK \| - \|/);
  assert.match(report, /\| upload-hub \| OK \| - \|/);
  assert.match(report, /\| knowledge-browser \| OK \| - \|/);
  assert.doesNotMatch(report, /MISSING/);
});
