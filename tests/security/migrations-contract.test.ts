import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const bridgeSql = readFileSync("supabase/migrations/20260606120000_bridge_control_plane.sql", "utf8");
const purchasingSql = readFileSync("supabase/migrations/20260611120000_purchasing_module.sql", "utf8");
const localAiSql = readFileSync("supabase/migrations/20260614120000_local_ai_module.sql", "utf8");
const knowledgeAiSql = readFileSync("supabase/migrations/20260614143000_knowledge_ai_module.sql", "utf8");

test("bridge control-plane migration defines revocable tokens and atomic job leasing", () => {
  assert.match(bridgeSql, /create table if not exists public\.bridge_device_tokens/i);
  assert.match(bridgeSql, /token_hash text not null unique/i);
  assert.match(bridgeSql, /revoked_at timestamptz/i);
  assert.match(bridgeSql, /create or replace function public\.bridge_poll_jobs/i);
  assert.match(bridgeSql, /for update skip locked/i);
  assert.match(bridgeSql, /create or replace function public\.bridge_consume_launch_ticket/i);
  assert.match(bridgeSql, /grant execute on function public\.bridge_poll_jobs/i);
});

test("module migrations use scope-based RLS for purchasing data", () => {
  assert.match(bridgeSql, /create or replace function public\.bridge_has_scope/i);
  assert.match(purchasingSql, /alter table public\.purchasing_suppliers enable row level security/i);
  assert.match(purchasingSql, /alter table public\.purchasing_quotes enable row level security/i);
  assert.match(purchasingSql, /service:purchasing:read/i);
  assert.match(purchasingSql, /service:purchasing:write/i);
  assert.match(purchasingSql, /service:purchasing:admin/i);
});

test("local ai module migration registers local AI source references", () => {
  assert.match(localAiSql, /'local_ai'/i);
  assert.match(localAiSql, /service:local_ai:read/i);
  assert.match(localAiSql, /local_ai\.jan\.status/i);
  assert.match(localAiSql, /local_ai\.jan\.instructions/i);
  assert.match(localAiSql, /https:\/\/github\.com\/Mintplex-Labs\/anything-llm\.git/i);
  assert.match(localAiSql, /anythingllm-yaka-bridge/i);
  assert.match(localAiSql, /https:\/\/github\.com\/janhq\/jan\.git/i);
});

test("knowledge ai migration registers local-only Connaissance data contracts", () => {
  assert.match(knowledgeAiSql, /'knowledge_ai'/i);
  assert.match(knowledgeAiSql, /create table if not exists public\.knowledge_ai_projects/i);
  assert.match(knowledgeAiSql, /create table if not exists public\.knowledge_ai_contents/i);
  assert.match(knowledgeAiSql, /create table if not exists public\.knowledge_ai_sections/i);
  assert.match(knowledgeAiSql, /create table if not exists public\.knowledge_ai_conversations/i);
  assert.match(knowledgeAiSql, /create table if not exists public\.knowledge_ai_messages/i);
  assert.match(knowledgeAiSql, /organization_id uuid not null references public\.bridge_organizations/i);
  assert.match(knowledgeAiSql, /provider_mode text not null default 'local_only'/i);
  assert.match(knowledgeAiSql, /alter table public\.knowledge_ai_messages enable row level security/i);
  assert.match(knowledgeAiSql, /public\.bridge_has_scope\(organization_id, 'knowledge_ai', 'service:knowledge_ai:chat'\)/i);
  assert.match(knowledgeAiSql, /public\.bridge_has_scope\(organization_id, 'knowledge_ai', 'service:knowledge_ai:ingest'\)/i);
  assert.match(knowledgeAiSql, /public\.bridge_has_scope\(organization_id, 'knowledge_ai', 'service:knowledge_ai:agents'\)/i);
  assert.match(knowledgeAiSql, /knowledge_ai\.chat\.stream/i);
  assert.match(knowledgeAiSql, /lmstudio_local/i);
  assert.match(knowledgeAiSql, /dgx_spark_lan/i);
});
