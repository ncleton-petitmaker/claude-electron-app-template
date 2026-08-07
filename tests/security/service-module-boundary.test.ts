import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readJson(path: string): Record<string, any> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, any>;
}

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(path));
    else files.push(path);
  }
  return files;
}

test("external-service modules only expose Bridge launcher routes in app shell", () => {
  const manifest = readJson("modules/knowledge_ai/module.config.json");
  assert.equal(manifest.deployment?.kind, "external-service");
  assert.equal(manifest.deployment?.coolify?.required, true);
  assert.equal(manifest.deployment?.coolify?.dockerfile, "services/connaissance/Dockerfile");
  assert.equal(manifest.deployment?.supabase?.strategy, "dedicated");
  assert.equal(manifest.deployment?.supabase?.sharedAllowed, false);

  const serviceSlug = manifest.deployment.serviceSlug;
  const appFiles = listFiles(join("app", serviceSlug)).sort();
  assert.deepEqual(appFiles, [
    join("app", serviceSlug, "[...path]", "page.tsx"),
    join("app", serviceSlug, "page.tsx"),
  ]);

  const routePaths = manifest.routes.map((route: { path: string }) => route.path);
  assert.deepEqual(routePaths, ["/connaissance", "/admin/knowledge-ai"]);

  assert.equal(existsSync("services/connaissance/package.json"), true);
  assert.equal(existsSync("services/connaissance/Dockerfile"), true);
  assert.equal(existsSync("services/connaissance/coolify.json"), true);
  assert.equal(existsSync("services/connaissance/app/healthz/route.ts"), true);
  assert.equal(existsSync("services/connaissance/app/bridge/launch/route.ts"), true);
  assert.equal(existsSync("services/connaissance/app/chat/page.tsx"), true);
  assert.equal(existsSync("services/connaissance/app/upload/page.tsx"), true);
  assert.equal(existsSync("services/connaissance/app/dashboard/page.tsx"), true);
});
