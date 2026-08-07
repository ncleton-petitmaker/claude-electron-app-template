import { z } from "zod";
import { existsSync } from "node:fs";
import { findClaudeBin } from "./agents.js";
import { assertAgentProviderReady, getAgentStatus } from "./agents-status.js";
import {
  AVAILABLE_MODELS,
  codexRunModelOptions,
  loadAppConfig,
  saveAppConfig,
  type AgentProvider,
  type AppConfig,
} from "./app-config.js";
import {
  appendAuditEvent,
  computeAuditStats,
  readAuditEvents,
  verifyAuditLogIntegrity,
  type AuditEventInput,
} from "./audit-log.js";
import { getPricingMetadata } from "./pricing.js";
import { allowedRunRoots, assertInsideRoots } from "./path-guard.js";
import {
  attachListener,
  cancelRun,
  getRun,
  getRunUsage,
  listRuns,
  startRun,
} from "./runs.js";
import {
  listGlobalSkills,
  listPersoSkills,
  writeGlobalSkill,
} from "./skills.js";
import { getSupabasePublicConfig, getSupabaseServerClient } from "./supabase.js";
import { localAiJanInstructions, localAiJanStatus } from "./local-ai-jan.js";
import {
  knowledgeAiChatSend,
  knowledgeAiChatStream,
  knowledgeAiBridgeOperation,
  knowledgeAiCreateAgent,
  knowledgeAiCreateProject,
  knowledgeAiPrepareUpload,
  knowledgeAiRuntimeStatus,
  knowledgeAiSourceInventory,
  knowledgeAiUiAction,
} from "./knowledge-ai-runtime.js";
import type { BridgeEntitlement, BridgeRole } from "./authz.js";

export interface ActionContext {
  dataDir: string;
  actorId?: string;
  actorRole?: string;
  userId?: string;
  organizationId?: string;
  membershipRole?: BridgeRole;
  entitlements?: BridgeEntitlement[];
  clientIp?: string;
  appVersion?: string;
  signal?: AbortSignal;
}

export interface ActionAuditSpec {
  action: string;
  resourceType: string;
  dangerous?: boolean;
  adminOnly?: boolean;
}

export interface AppAction<I = unknown, O = unknown> {
  id: string;
  description: string;
  inputSchema: z.ZodType<I>;
  inputJsonSchema: Record<string, unknown>;
  requiredServiceScopes?: Array<{ serviceId: string; scopes: string[] }>;
  requiredAnyScopes?: string[];
  audit?: ActionAuditSpec;
  handler(ctx: ActionContext, input: I): Promise<O> | O;
}

function objectSchema(properties: Record<string, unknown>, required: string[] = []): Record<string, unknown> {
  return { type: "object", properties, required, additionalProperties: false };
}

function actor(ctx: ActionContext): { actor_id: string; actor_role: string } {
  return {
    actor_id: ctx.actorId ?? "local-agent",
    actor_role: ctx.actorRole ?? "agent",
  };
}

function audit(ctx: ActionContext, spec: ActionAuditSpec, result: "success" | "failure", metadata?: Record<string, unknown>, resourceId?: string): void {
  try {
    const cfg = loadAppConfig(ctx.dataDir);
    const a = actor(ctx);
    const input: AuditEventInput = {
      actor_id: a.actor_id,
      actor_role: a.actor_role,
      action: spec.action,
      resource_type: spec.resourceType,
      resource_id: resourceId,
      result,
      app_version: ctx.appVersion ?? process.env["{{APP_NAME_KEBAB_UPPER}}_APP_VERSION"] ?? "0.0.1",
      client_ip: ctx.clientIp ?? "mcp/local",
      metadata,
    };
    appendAuditEvent(ctx.dataDir, input, cfg.auditLogDir);
  } catch (err) {
    console.warn("[actions:audit] failed:", err);
  }
}

const EmptySchema = z.object({}).strict();
const IdSchema = z.object({ id: z.string().min(1) }).strict();

const StartRunSchema = z.object({
  prompt: z.string().min(1),
  tag: z.string().optional(),
  model: z.string().optional(),
  agentProvider: z.enum(["codex-cloud", "codex-lmstudio"]).optional(),
  localModel: z.string().optional(),
  addDirs: z.array(z.string()).optional(),
  allowedTools: z.array(z.string()).optional(),
  maxTurns: z.number().int().min(1).max(100).optional(),
  cwd: z.string().optional(),
}).strict();

type StartRunInput = z.infer<typeof StartRunSchema>;

const UpdateAppConfigSchema = z.object({
  agentProvider: z.enum(["codex-cloud", "codex-lmstudio"]).optional(),
  model: z.string().optional(),
  localModel: z.string().optional(),
  databaseProvider: z.literal("supabase").optional(),
  supabaseUrl: z.string().url().or(z.literal("")).optional(),
  supabaseAnonKey: z.string().optional(),
  inputDir: z.string().optional(),
  outputDir: z.string().optional(),
  auditLogDir: z.string().optional(),
  maxConcurrentRuns: z.number().int().min(1).max(50).optional(),
  automations: z.object({
    gmailSupplierInvoices: z.object({
      enabled: z.boolean().optional(),
      periodStart: z.string().optional(),
      periodEnd: z.string().optional(),
      supplierTypes: z.array(z.string()).optional(),
      excludedSupplierTypes: z.array(z.string()).optional(),
      gmailQuery: z.string().optional(),
      pennylaneMcpServer: z.string().optional(),
      schedule: z.enum(["manual", "daily", "weekly", "monthly"]).optional(),
    }).strict().optional(),
  }).strict().optional(),
}).strict();

const ListSkillsSchema = z.object({ user: z.string().optional() }).strict();
const WriteSkillSchema = z.object({ slug: z.string().min(1), raw: z.string().min(1) }).strict();
const AuditReadSchema = z.object({ since: z.string().optional(), user: z.string().optional(), limit: z.number().int().min(1).max(5000).optional() }).strict();
const AuditStatsSchema = z.object({ windowDays: z.number().int().min(1).max(365).optional() }).strict();
const PurchasingQuoteImportSchema = z.object({
  supplierName: z.string().min(1),
  supplierExternalRef: z.string().min(1).optional(),
  title: z.string().min(1),
  amount: z.number().nonnegative().optional(),
  currency: z.string().min(3).max(3).optional(),
  riskLevel: z.enum(["unknown", "low", "medium", "high"]).optional(),
}).strict();
const PurchasingQuoteAnalyzeSchema = z.object({
  quoteIds: z.array(z.string().uuid()).optional(),
}).strict();
const LocalAiJanPathsSchema = z.object({
  sourceDir: z.string().min(1).optional(),
  worktreeDir: z.string().min(1).optional(),
}).strict();
const KnowledgeAiProviderSchema = z.enum(["bridge_codex", "lmstudio_local", "dgx_spark_lan"]);
const KnowledgeAiRuntimeStatusSchema = z.object({
  settingsAction: z.string().min(1).optional(),
}).strict();
const KnowledgeAiSourceInventorySchema = z.object({
  sourceDir: z.string().min(1).optional(),
  sourceId: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
  agentId: z.string().min(1).optional(),
  viewerAction: z.string().min(1).optional(),
  modalAction: z.string().min(1).optional(),
  groupAction: z.string().min(1).optional(),
  projectAction: z.string().min(1).optional(),
  agentAction: z.string().min(1).optional(),
  automationAction: z.string().min(1).optional(),
  versionId: z.string().min(1).optional(),
}).strict();
const KnowledgeAiChatSchema = z.object({
  message: z.string().min(1),
  provider: KnowledgeAiProviderSchema.optional(),
  projectId: z.string().min(1).optional(),
  agentId: z.string().min(1).optional(),
  conversationId: z.string().min(1).optional(),
  contextIds: z.array(z.string().min(1)).optional(),
  options: z.object({
    model: z.string().min(1).optional(),
    useReasoning: z.boolean().optional(),
    usePro: z.boolean().optional(),
  }).strict().optional(),
}).strict();
const KnowledgeAiUploadPrepareSchema = z.object({
  fileName: z.string().min(1).optional(),
  contentType: z.string().min(1).optional(),
  sourceType: z.string().min(1).optional(),
  method: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  advancedAction: z.string().min(1).optional(),
}).strict();
const KnowledgeAiProjectCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
}).strict();
const KnowledgeAiAgentCreateSchema = z.object({
  name: z.string().min(1),
  systemInstructions: z.string().min(1),
  provider: KnowledgeAiProviderSchema.optional(),
}).strict();
const KnowledgeAiUiActionSchema = z.object({
  surface: z.string().min(1),
  action: z.string().min(1),
  resourceId: z.string().min(1).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
}).strict();
const KnowledgeAiOperationSchema = z.object({
  resourceId: z.string().min(1).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
}).strict();

type PurchasingQuoteImportInput = z.infer<typeof PurchasingQuoteImportSchema>;
type PurchasingQuoteAnalyzeInput = z.infer<typeof PurchasingQuoteAnalyzeSchema>;
type LocalAiJanPathsInput = z.infer<typeof LocalAiJanPathsSchema>;
type KnowledgeAiRuntimeStatusInput = z.infer<typeof KnowledgeAiRuntimeStatusSchema>;
type KnowledgeAiSourceInventoryInput = z.infer<typeof KnowledgeAiSourceInventorySchema>;
type KnowledgeAiChatInput = z.infer<typeof KnowledgeAiChatSchema>;
type KnowledgeAiUploadPrepareInput = z.infer<typeof KnowledgeAiUploadPrepareSchema>;
type KnowledgeAiProjectCreateInput = z.infer<typeof KnowledgeAiProjectCreateSchema>;
type KnowledgeAiAgentCreateInput = z.infer<typeof KnowledgeAiAgentCreateSchema>;
type KnowledgeAiUiActionInput = z.infer<typeof KnowledgeAiUiActionSchema>;
type KnowledgeAiOperationInput = z.infer<typeof KnowledgeAiOperationSchema>;

function knowledgeAiOperationAction(
  id: string,
  description: string,
  operation: string,
  scopes: string[],
  resourceType: string,
): AppAction<KnowledgeAiOperationInput> {
  return {
    id,
    description,
    inputSchema: KnowledgeAiOperationSchema,
    inputJsonSchema: objectSchema({
      resourceId: { type: "string" },
      payload: { type: "object" },
    }),
    requiredAnyScopes: scopes,
    audit: { action: id.replaceAll("_", "-").replaceAll(".", "-"), resourceType },
    handler: (_ctx: ActionContext, input: KnowledgeAiOperationInput) => knowledgeAiBridgeOperation({
      operation,
      resourceId: input.resourceId,
      payload: input.payload,
    }),
  };
}

export const appActions = {
  "health.get": {
    id: "health.get",
    description: "Get daemon health, version, data directory and Claude binary status.",
    inputSchema: EmptySchema,
    inputJsonSchema: objectSchema({}),
    handler: (ctx: ActionContext) => ({
      ok: true,
      ts: new Date().toISOString(),
      version: ctx.appVersion ?? process.env["{{APP_NAME_KEBAB_UPPER}}_APP_VERSION"] ?? "0.0.1",
      claude: findClaudeBin(),
      dataDir: ctx.dataDir,
      dataDirExists: existsSync(ctx.dataDir),
      database: getSupabasePublicConfig(ctx.dataDir),
      pricing: getPricingMetadata(),
    }),
  },
  "agents.status": {
    id: "agents.status",
    description: "Return ChatGPT Codex and LM Studio status.",
    inputSchema: EmptySchema,
    inputJsonSchema: objectSchema({}),
    handler: async (ctx: ActionContext) => ({ agents: [await getAgentStatus(loadAppConfig(ctx.dataDir))] }),
  },
  "appConfig.get": {
    id: "appConfig.get",
    description: "Read app configuration and available models.",
    inputSchema: EmptySchema,
    inputJsonSchema: objectSchema({}),
    handler: (ctx: ActionContext) => ({
      config: loadAppConfig(ctx.dataDir),
      availableModels: AVAILABLE_MODELS,
      database: getSupabasePublicConfig(ctx.dataDir),
    }),
  },
  "appConfig.update": {
    id: "appConfig.update",
    description: "Update app configuration. Same operation as the settings UI.",
    inputSchema: UpdateAppConfigSchema,
    inputJsonSchema: objectSchema({
      agentProvider: { type: "string", enum: ["codex-cloud", "codex-lmstudio"] },
      model: { type: "string" },
      localModel: { type: "string" },
      databaseProvider: { type: "string", enum: ["supabase"] },
      supabaseUrl: { type: "string" },
      supabaseAnonKey: { type: "string" },
      inputDir: { type: "string" },
      outputDir: { type: "string" },
      auditLogDir: { type: "string" },
      maxConcurrentRuns: { type: "number" },
      automations: {
        type: "object",
        properties: {
          gmailSupplierInvoices: {
            type: "object",
            properties: {
              enabled: { type: "boolean" },
              periodStart: { type: "string" },
              periodEnd: { type: "string" },
              supplierTypes: { type: "array", items: { type: "string" } },
              excludedSupplierTypes: { type: "array", items: { type: "string" } },
              gmailQuery: { type: "string" },
              pennylaneMcpServer: { type: "string" },
              schedule: { type: "string", enum: ["manual", "daily", "weekly", "monthly"] },
            },
          },
        },
      },
    }),
    audit: { action: "app-config.update", resourceType: "app-config", adminOnly: true },
    handler: (ctx: ActionContext, input: Partial<AppConfig>) => {
      const config = saveAppConfig(ctx.dataDir, input);
      return { config };
    },
  },
  "runs.start": {
    id: "runs.start",
    description: "Start a Claude Code run. Long-running progress is available via runs.get/list and SSE in the UI.",
    inputSchema: StartRunSchema,
    inputJsonSchema: objectSchema({
      prompt: { type: "string" },
      tag: { type: "string" },
      model: { type: "string" },
      agentProvider: { type: "string", enum: ["codex-cloud", "codex-lmstudio"] },
      localModel: { type: "string" },
      addDirs: { type: "array", items: { type: "string" } },
      allowedTools: { type: "array", items: { type: "string" } },
      maxTurns: { type: "number" },
      cwd: { type: "string" },
    }, ["prompt"]),
    requiredAnyScopes: ["codex:run"],
    audit: { action: "run.start", resourceType: "run" },
    handler: async (ctx: ActionContext, input: StartRunInput) => {
      const cfg = loadAppConfig(ctx.dataDir);
      const roots = allowedRunRoots(ctx.dataDir, cfg);
      const cwd = input.cwd ? assertInsideRoots(input.cwd, roots, input.cwd) : ctx.dataDir;
      const addDirs = input.addDirs?.map((dir) => assertInsideRoots(dir, roots, dir));
      const modelOptions = codexRunModelOptions(cfg, {
        agentProvider: input.agentProvider as AgentProvider | undefined,
        model: input.model,
        localModel: input.localModel,
      });
      await assertAgentProviderReady({
        agentProvider: modelOptions.agentProvider,
        localModel: modelOptions.localModel ?? cfg.localModel,
      });
      const run = startRun({
        prompt: input.prompt,
        cwd,
        tag: input.tag,
        agentProvider: modelOptions.agentProvider,
        model: modelOptions.model,
        localModel: modelOptions.localModel,
        addDirs,
        allowedTools: input.allowedTools,
        maxTurns: input.maxTurns,
      });
      return { run };
    },
  },
  "runs.list": {
    id: "runs.list",
    description: "List in-memory runs and their statuses.",
    inputSchema: EmptySchema,
    inputJsonSchema: objectSchema({}),
    handler: () => ({ runs: listRuns() }),
  },
  "runs.get": {
    id: "runs.get",
    description: "Get one run by id.",
    inputSchema: IdSchema,
    inputJsonSchema: objectSchema({ id: { type: "string" } }, ["id"]),
    handler: (_ctx: ActionContext, input: { id: string }) => ({ run: getRun(input.id) }),
  },
  "runs.usage": {
    id: "runs.usage",
    description: "Get token/cost usage for one run.",
    inputSchema: IdSchema,
    inputJsonSchema: objectSchema({ id: { type: "string" } }, ["id"]),
    handler: (_ctx: ActionContext, input: { id: string }) => ({ usage: getRunUsage(input.id) }),
  },
  "runs.cancel": {
    id: "runs.cancel",
    description: "Cancel a running Claude Code run by id. Same action as the UI stop button.",
    inputSchema: IdSchema,
    inputJsonSchema: objectSchema({ id: { type: "string" } }, ["id"]),
    audit: { action: "run.cancel", resourceType: "run", dangerous: true },
    handler: (_ctx: ActionContext, input: { id: string }) => {
      cancelRun(input.id);
      return { ok: true, id: input.id };
    },
  },
  "local_ai.jan.status": {
    id: "local_ai.jan.status",
    description: "Inspect the local Jan upstream clone and Bridge adaptation worktree without starting Jan.",
    inputSchema: LocalAiJanPathsSchema,
    inputJsonSchema: objectSchema({
      sourceDir: { type: "string" },
      worktreeDir: { type: "string" },
    }),
    requiredAnyScopes: ["service:local_ai:read"],
    handler: (_ctx: ActionContext, input: LocalAiJanPathsInput) => localAiJanStatus(input),
  },
  "local_ai.jan.instructions": {
    id: "local_ai.jan.instructions",
    description: "Return the local Jan clone, worktree and development commands used by the Bridge inspection module.",
    inputSchema: LocalAiJanPathsSchema,
    inputJsonSchema: objectSchema({
      sourceDir: { type: "string" },
      worktreeDir: { type: "string" },
    }),
    requiredAnyScopes: ["service:local_ai:read"],
    handler: (_ctx: ActionContext, input: LocalAiJanPathsInput) => localAiJanInstructions(input),
  },
  "knowledge_ai.runtime.status": {
    id: "knowledge_ai.runtime.status",
    description: "Return Connaissance provider status in strict local-only mode.",
    inputSchema: KnowledgeAiRuntimeStatusSchema,
    inputJsonSchema: objectSchema({
      settingsAction: { type: "string" },
    }),
    requiredAnyScopes: ["service:knowledge_ai:read"],
    handler: (_ctx: ActionContext, _input: KnowledgeAiRuntimeStatusInput) => knowledgeAiRuntimeStatus(),
  },
  "knowledge_ai.source.inventory": {
    id: "knowledge_ai.source.inventory",
    description: "Inspect the local Connaissance source tree used for the Bridge integration.",
    inputSchema: KnowledgeAiSourceInventorySchema,
    inputJsonSchema: objectSchema({
      sourceDir: { type: "string" },
      sourceId: { type: "string" },
      groupId: { type: "string" },
      projectId: { type: "string" },
      agentId: { type: "string" },
      viewerAction: { type: "string" },
      modalAction: { type: "string" },
      groupAction: { type: "string" },
      projectAction: { type: "string" },
      agentAction: { type: "string" },
      automationAction: { type: "string" },
      versionId: { type: "string" },
    }),
    requiredAnyScopes: ["service:knowledge_ai:read"],
    handler: (_ctx: ActionContext, input: KnowledgeAiSourceInventoryInput) => knowledgeAiSourceInventory(input),
  },
  "knowledge_ai.chat.send": {
    id: "knowledge_ai.chat.send",
    description: "Send a Connaissance chat message through Bridge Codex, LM Studio local or DGX LAN.",
    inputSchema: KnowledgeAiChatSchema,
    inputJsonSchema: objectSchema({
      message: { type: "string" },
      provider: { type: "string", enum: ["bridge_codex", "lmstudio_local", "dgx_spark_lan"] },
      projectId: { type: "string" },
      agentId: { type: "string" },
      conversationId: { type: "string" },
      contextIds: { type: "array", items: { type: "string" } },
      options: { type: "object" },
    }, ["message"]),
    requiredAnyScopes: ["service:knowledge_ai:chat"],
    audit: { action: "knowledge-ai.chat-send", resourceType: "knowledge_ai_conversation" },
    handler: (ctx: ActionContext, input: KnowledgeAiChatInput) => knowledgeAiChatSend(ctx, input),
  },
  "knowledge_ai.chat.stream": {
    id: "knowledge_ai.chat.stream",
    description: "Start a Connaissance chat stream through the same local-only runtime contract.",
    inputSchema: KnowledgeAiChatSchema,
    inputJsonSchema: objectSchema({
      message: { type: "string" },
      provider: { type: "string", enum: ["bridge_codex", "lmstudio_local", "dgx_spark_lan"] },
      projectId: { type: "string" },
      agentId: { type: "string" },
      conversationId: { type: "string" },
      contextIds: { type: "array", items: { type: "string" } },
      options: { type: "object" },
    }, ["message"]),
    requiredAnyScopes: ["service:knowledge_ai:chat"],
    audit: { action: "knowledge-ai.chat-stream", resourceType: "knowledge_ai_conversation" },
    handler: (ctx: ActionContext, input: KnowledgeAiChatInput) => knowledgeAiChatStream(ctx, input),
  },
  "knowledge_ai.upload.prepare": {
    id: "knowledge_ai.upload.prepare",
    description: "Prepare a local Connaissance upload without invoking any external AI provider.",
    inputSchema: KnowledgeAiUploadPrepareSchema,
    inputJsonSchema: objectSchema({
      fileName: { type: "string" },
      contentType: { type: "string" },
      sourceType: { type: "string" },
      method: { type: "string" },
      title: { type: "string" },
      advancedAction: { type: "string" },
    }),
    requiredAnyScopes: ["service:knowledge_ai:ingest"],
    audit: { action: "knowledge-ai.upload-prepare", resourceType: "knowledge_ai_upload" },
    handler: (_ctx: ActionContext, input: KnowledgeAiUploadPrepareInput) => knowledgeAiPrepareUpload(input),
  },
  "knowledge_ai.project.create": {
    id: "knowledge_ai.project.create",
    description: "Create a Connaissance project shell with dedicated local context.",
    inputSchema: KnowledgeAiProjectCreateSchema,
    inputJsonSchema: objectSchema({
      name: { type: "string" },
      description: { type: "string" },
    }, ["name"]),
    requiredAnyScopes: ["service:knowledge_ai:write"],
    audit: { action: "knowledge-ai.project-create", resourceType: "knowledge_ai_project" },
    handler: (_ctx: ActionContext, input: KnowledgeAiProjectCreateInput) => knowledgeAiCreateProject(input),
  },
  "knowledge_ai.agent.create": {
    id: "knowledge_ai.agent.create",
    description: "Create a Connaissance agent with local-only provider instructions.",
    inputSchema: KnowledgeAiAgentCreateSchema,
    inputJsonSchema: objectSchema({
      name: { type: "string" },
      systemInstructions: { type: "string" },
      provider: { type: "string", enum: ["bridge_codex", "lmstudio_local", "dgx_spark_lan"] },
    }, ["name", "systemInstructions"]),
    requiredAnyScopes: ["service:knowledge_ai:agents"],
    audit: { action: "knowledge-ai.agent-create", resourceType: "knowledge_ai_agent" },
    handler: (_ctx: ActionContext, input: KnowledgeAiAgentCreateInput) => knowledgeAiCreateAgent(input),
  },
  "knowledge_ai.ui.action": {
    id: "knowledge_ai.ui.action",
    description: "Run a Connaissance UI action through the Bridge local-only contract.",
    inputSchema: KnowledgeAiUiActionSchema,
    inputJsonSchema: objectSchema({
      surface: { type: "string" },
      action: { type: "string" },
      resourceId: { type: "string" },
      payload: { type: "object" },
    }, ["surface", "action"]),
    requiredAnyScopes: ["service:knowledge_ai:write"],
    audit: { action: "knowledge-ai.ui-action", resourceType: "knowledge_ai_ui_action" },
    handler: (_ctx: ActionContext, input: KnowledgeAiUiActionInput) => knowledgeAiUiAction(input),
  },
  "knowledge_ai.auth.otp.send": knowledgeAiOperationAction(
    "knowledge_ai.auth.otp.send",
    "Send a Bridge-managed login code for the Connaissance service.",
    "auth.otp.send",
    ["service:knowledge_ai:read"],
    "knowledge_ai_auth",
  ),
  "knowledge_ai.auth.otp.verify": knowledgeAiOperationAction(
    "knowledge_ai.auth.otp.verify",
    "Verify a Bridge-managed login code for the Connaissance service.",
    "auth.otp.verify",
    ["service:knowledge_ai:read"],
    "knowledge_ai_auth",
  ),
  "knowledge_ai.auth.session.refresh": knowledgeAiOperationAction(
    "knowledge_ai.auth.session.refresh",
    "Refresh the Bridge service session without direct client Supabase auth.",
    "auth.session.refresh",
    ["service:knowledge_ai:read"],
    "knowledge_ai_auth",
  ),
  "knowledge_ai.auth.user.get": knowledgeAiOperationAction(
    "knowledge_ai.auth.user.get",
    "Read the Bridge-authenticated Connaissance user context.",
    "auth.user.get",
    ["service:knowledge_ai:read"],
    "knowledge_ai_auth",
  ),
  "knowledge_ai.auth.company.get": knowledgeAiOperationAction(
    "knowledge_ai.auth.company.get",
    "Read the Bridge organization context for Connaissance.",
    "auth.company.get",
    ["service:knowledge_ai:read"],
    "knowledge_ai_auth",
  ),
  "knowledge_ai.citation.open": knowledgeAiOperationAction(
    "knowledge_ai.citation.open",
    "Open or inspect a Connaissance answer citation through the Bridge action contract.",
    "citation.open",
    ["service:knowledge_ai:read"],
    "knowledge_ai_citation",
  ),
  "knowledge_ai.web_source.open": knowledgeAiOperationAction(
    "knowledge_ai.web_source.open",
    "Open or inspect a Connaissance answer web source through the Bridge action contract.",
    "web_source.open",
    ["service:knowledge_ai:read"],
    "knowledge_ai_web_source",
  ),
  "knowledge_ai.conversation.list": knowledgeAiOperationAction(
    "knowledge_ai.conversation.list",
    "List Connaissance conversations for the current Bridge organization.",
    "conversation.list",
    ["service:knowledge_ai:read"],
    "knowledge_ai_conversation",
  ),
  "knowledge_ai.conversation.load": knowledgeAiOperationAction(
    "knowledge_ai.conversation.load",
    "Load a Connaissance conversation with messages and citations.",
    "conversation.load",
    ["service:knowledge_ai:read"],
    "knowledge_ai_conversation",
  ),
  "knowledge_ai.conversation.archive": knowledgeAiOperationAction(
    "knowledge_ai.conversation.archive",
    "Archive a Connaissance conversation.",
    "conversation.archive",
    ["service:knowledge_ai:write"],
    "knowledge_ai_conversation",
  ),
  "knowledge_ai.conversation.delete": knowledgeAiOperationAction(
    "knowledge_ai.conversation.delete",
    "Delete a Connaissance conversation through audited Bridge permissions.",
    "conversation.delete",
    ["service:knowledge_ai:write"],
    "knowledge_ai_conversation",
  ),
  "knowledge_ai.conversation.clear": knowledgeAiOperationAction(
    "knowledge_ai.conversation.clear",
    "Clear the current Connaissance conversation state.",
    "conversation.clear",
    ["service:knowledge_ai:write"],
    "knowledge_ai_conversation",
  ),
  "knowledge_ai.conversation.context.set": knowledgeAiOperationAction(
    "knowledge_ai.conversation.context.set",
    "Attach or remove a project, knowledge or group context from chat.",
    "conversation.context.set",
    ["service:knowledge_ai:write"],
    "knowledge_ai_conversation",
  ),
  "knowledge_ai.conversation.options.set": knowledgeAiOperationAction(
    "knowledge_ai.conversation.options.set",
    "Update local chat options such as model, reasoning and direct LLM mode.",
    "conversation.options.set",
    ["service:knowledge_ai:write"],
    "knowledge_ai_conversation",
  ),
  "knowledge_ai.shortcut.list": knowledgeAiOperationAction(
    "knowledge_ai.shortcut.list",
    "List Connaissance chat shortcuts.",
    "shortcut.list",
    ["service:knowledge_ai:read"],
    "knowledge_ai_shortcut",
  ),
  "knowledge_ai.shortcut.create": knowledgeAiOperationAction(
    "knowledge_ai.shortcut.create",
    "Create a Connaissance chat shortcut.",
    "shortcut.create",
    ["service:knowledge_ai:write"],
    "knowledge_ai_shortcut",
  ),
  "knowledge_ai.shortcut.update": knowledgeAiOperationAction(
    "knowledge_ai.shortcut.update",
    "Update a Connaissance chat shortcut.",
    "shortcut.update",
    ["service:knowledge_ai:write"],
    "knowledge_ai_shortcut",
  ),
  "knowledge_ai.shortcut.delete": knowledgeAiOperationAction(
    "knowledge_ai.shortcut.delete",
    "Delete a Connaissance chat shortcut.",
    "shortcut.delete",
    ["service:knowledge_ai:write"],
    "knowledge_ai_shortcut",
  ),
  "knowledge_ai.shortcut.reorder": knowledgeAiOperationAction(
    "knowledge_ai.shortcut.reorder",
    "Reorder Connaissance chat shortcuts.",
    "shortcut.reorder",
    ["service:knowledge_ai:write"],
    "knowledge_ai_shortcut",
  ),
  "knowledge_ai.shortcut.track_usage": knowledgeAiOperationAction(
    "knowledge_ai.shortcut.track_usage",
    "Track Connaissance shortcut usage through Bridge audit.",
    "shortcut.track_usage",
    ["service:knowledge_ai:write"],
    "knowledge_ai_shortcut",
  ),
  "knowledge_ai.shortcut.create_defaults": knowledgeAiOperationAction(
    "knowledge_ai.shortcut.create_defaults",
    "Create default Connaissance shortcuts for a new organization.",
    "shortcut.create_defaults",
    ["service:knowledge_ai:admin"],
    "knowledge_ai_shortcut",
  ),
  "knowledge_ai.knowledge.list": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.list",
    "List Connaissance knowledge items for the service workspace.",
    "knowledge.list",
    ["service:knowledge_ai:read"],
    "knowledge_ai_source",
  ),
  "knowledge_ai.knowledge.get": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.get",
    "Read a Connaissance knowledge item and viewer metadata.",
    "knowledge.get",
    ["service:knowledge_ai:read"],
    "knowledge_ai_source",
  ),
  "knowledge_ai.knowledge.update": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.update",
    "Update a Connaissance knowledge item.",
    "knowledge.update",
    ["service:knowledge_ai:write"],
    "knowledge_ai_source",
  ),
  "knowledge_ai.knowledge.delete": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.delete",
    "Delete a Connaissance knowledge item.",
    "knowledge.delete",
    ["service:knowledge_ai:write"],
    "knowledge_ai_source",
  ),
  "knowledge_ai.knowledge.associate": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.associate",
    "Associate a Connaissance knowledge item with another source, group or project.",
    "knowledge.associate",
    ["service:knowledge_ai:write"],
    "knowledge_ai_source",
  ),
  "knowledge_ai.knowledge.replace_file": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.replace_file",
    "Replace a Connaissance knowledge file through the local ingestion pipeline.",
    "knowledge.replace_file",
    ["service:knowledge_ai:ingest"],
    "knowledge_ai_source",
  ),
  "knowledge_ai.knowledge.version.list": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.version.list",
    "List Connaissance knowledge versions.",
    "knowledge.version.list",
    ["service:knowledge_ai:read"],
    "knowledge_ai_source_version",
  ),
  "knowledge_ai.knowledge.version.restore": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.version.restore",
    "Restore a Connaissance knowledge version.",
    "knowledge.version.restore",
    ["service:knowledge_ai:write"],
    "knowledge_ai_source_version",
  ),
  "knowledge_ai.knowledge.group.list": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.group.list",
    "List Connaissance knowledge groups.",
    "knowledge.group.list",
    ["service:knowledge_ai:read"],
    "knowledge_ai_group",
  ),
  "knowledge_ai.knowledge.group.create": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.group.create",
    "Create a Connaissance knowledge group.",
    "knowledge.group.create",
    ["service:knowledge_ai:write"],
    "knowledge_ai_group",
  ),
  "knowledge_ai.knowledge.group.update": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.group.update",
    "Update a Connaissance knowledge group.",
    "knowledge.group.update",
    ["service:knowledge_ai:write"],
    "knowledge_ai_group",
  ),
  "knowledge_ai.knowledge.group.delete": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.group.delete",
    "Delete a Connaissance knowledge group.",
    "knowledge.group.delete",
    ["service:knowledge_ai:write"],
    "knowledge_ai_group",
  ),
  "knowledge_ai.knowledge.search": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.search",
    "Search Connaissance knowledge through the local Bridge service index.",
    "knowledge.search",
    ["service:knowledge_ai:read"],
    "knowledge_ai_search",
  ),
  "knowledge_ai.knowledge.filter.set": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.filter.set",
    "Apply Connaissance knowledge filters.",
    "knowledge.filter.set",
    ["service:knowledge_ai:read"],
    "knowledge_ai_filter",
  ),
  "knowledge_ai.knowledge.scope.set": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.scope.set",
    "Set the Connaissance scope mode for the current session.",
    "knowledge.scope.set",
    ["service:knowledge_ai:read"],
    "knowledge_ai_scope",
  ),
  "knowledge_ai.knowledge.processing.add": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.processing.add",
    "Register a Connaissance source as processing.",
    "knowledge.processing.add",
    ["service:knowledge_ai:ingest"],
    "knowledge_ai_processing",
  ),
  "knowledge_ai.knowledge.processing.remove": knowledgeAiOperationAction(
    "knowledge_ai.knowledge.processing.remove",
    "Mark a Connaissance source processing job as complete.",
    "knowledge.processing.remove",
    ["service:knowledge_ai:ingest"],
    "knowledge_ai_processing",
  ),
  "knowledge_ai.upload.text": knowledgeAiOperationAction(
    "knowledge_ai.upload.text",
    "Ingest Connaissance text through the local pipeline.",
    "upload.text",
    ["service:knowledge_ai:ingest"],
    "knowledge_ai_upload",
  ),
  "knowledge_ai.upload.file": knowledgeAiOperationAction(
    "knowledge_ai.upload.file",
    "Ingest Connaissance files through the local pipeline.",
    "upload.file",
    ["service:knowledge_ai:ingest"],
    "knowledge_ai_upload",
  ),
  "knowledge_ai.upload.url": knowledgeAiOperationAction(
    "knowledge_ai.upload.url",
    "Ingest a URL into Connaissance through Bridge.",
    "upload.url",
    ["service:knowledge_ai:ingest"],
    "knowledge_ai_upload",
  ),
  "knowledge_ai.upload.youtube": knowledgeAiOperationAction(
    "knowledge_ai.upload.youtube",
    "Ingest a YouTube source into Connaissance through Bridge.",
    "upload.youtube",
    ["service:knowledge_ai:ingest"],
    "knowledge_ai_upload",
  ),
  "knowledge_ai.upload.linkedin": knowledgeAiOperationAction(
    "knowledge_ai.upload.linkedin",
    "Ingest a LinkedIn source into Connaissance through Bridge.",
    "upload.linkedin",
    ["service:knowledge_ai:ingest"],
    "knowledge_ai_upload",
  ),
  "knowledge_ai.upload.twitter": knowledgeAiOperationAction(
    "knowledge_ai.upload.twitter",
    "Ingest an X source into Connaissance through Bridge.",
    "upload.twitter",
    ["service:knowledge_ai:ingest"],
    "knowledge_ai_upload",
  ),
  "knowledge_ai.upload.spreadsheet": knowledgeAiOperationAction(
    "knowledge_ai.upload.spreadsheet",
    "Ingest spreadsheet data into Connaissance through Bridge.",
    "upload.spreadsheet",
    ["service:knowledge_ai:ingest"],
    "knowledge_ai_upload",
  ),
  "knowledge_ai.upload.google_sheets": knowledgeAiOperationAction(
    "knowledge_ai.upload.google_sheets",
    "Connect Google Sheets through Bridge OAuth and local Connaissance ingestion.",
    "upload.google_sheets",
    ["service:knowledge_ai:ingest"],
    "knowledge_ai_upload",
  ),
  "knowledge_ai.questionnaire.generate": knowledgeAiOperationAction(
    "knowledge_ai.questionnaire.generate",
    "Create a Connaissance questionnaire draft through Bridge.",
    "questionnaire.generate",
    ["service:knowledge_ai:write"],
    "knowledge_ai_questionnaire",
  ),
  "knowledge_ai.questionnaire.share": knowledgeAiOperationAction(
    "knowledge_ai.questionnaire.share",
    "Share a Connaissance questionnaire through Bridge.",
    "questionnaire.share",
    ["service:knowledge_ai:write"],
    "knowledge_ai_questionnaire",
  ),
  "knowledge_ai.structured.schema.get": knowledgeAiOperationAction(
    "knowledge_ai.structured.schema.get",
    "Read the local structured-data schema for a Connaissance source.",
    "structured.schema.get",
    ["service:knowledge_ai:read"],
    "knowledge_ai_structured_data",
  ),
  "knowledge_ai.structured.data.get": knowledgeAiOperationAction(
    "knowledge_ai.structured.data.get",
    "Read local structured data for a Connaissance source.",
    "structured.data.get",
    ["service:knowledge_ai:read"],
    "knowledge_ai_structured_data",
  ),
  "knowledge_ai.structured.fetch": knowledgeAiOperationAction(
    "knowledge_ai.structured.fetch",
    "Fetch local structured data for GenBI panels.",
    "structured.fetch",
    ["service:knowledge_ai:read"],
    "knowledge_ai_structured_data",
  ),
  "knowledge_ai.structured.format": knowledgeAiOperationAction(
    "knowledge_ai.structured.format",
    "Format local structured data for chart and table renderers.",
    "structured.format",
    ["service:knowledge_ai:read"],
    "knowledge_ai_structured_data",
  ),
  "knowledge_ai.agent.test": knowledgeAiOperationAction(
    "knowledge_ai.agent.test",
    "Test a Connaissance agent against the local-only runtime.",
    "agent.test",
    ["service:knowledge_ai:agents"],
    "knowledge_ai_agent",
  ),
  "knowledge_ai.agent.update": knowledgeAiOperationAction(
    "knowledge_ai.agent.update",
    "Update a Connaissance agent system instruction.",
    "agent.update",
    ["service:knowledge_ai:agents"],
    "knowledge_ai_agent",
  ),
  "knowledge_ai.agent.duplicate": knowledgeAiOperationAction(
    "knowledge_ai.agent.duplicate",
    "Duplicate a Connaissance agent.",
    "agent.duplicate",
    ["service:knowledge_ai:agents"],
    "knowledge_ai_agent",
  ),
  "knowledge_ai.agent.archive": knowledgeAiOperationAction(
    "knowledge_ai.agent.archive",
    "Archive a Connaissance agent.",
    "agent.archive",
    ["service:knowledge_ai:agents"],
    "knowledge_ai_agent",
  ),
  "knowledge_ai.project.update_context": knowledgeAiOperationAction(
    "knowledge_ai.project.update_context",
    "Update the dedicated Connaissance context for a project.",
    "project.update_context",
    ["service:knowledge_ai:write"],
    "knowledge_ai_project",
  ),
  "knowledge_ai.project.launch_agent": knowledgeAiOperationAction(
    "knowledge_ai.project.launch_agent",
    "Launch a Connaissance project agent through Bridge.",
    "project.launch_agent",
    ["service:knowledge_ai:agents"],
    "knowledge_ai_project",
  ),
  "knowledge_ai.analytics.refresh": knowledgeAiOperationAction(
    "knowledge_ai.analytics.refresh",
    "Refresh Connaissance analytics from the local service store.",
    "analytics.refresh",
    ["service:knowledge_ai:read"],
    "knowledge_ai_analytics",
  ),
  "knowledge_ai.settings.update": knowledgeAiOperationAction(
    "knowledge_ai.settings.update",
    "Update Connaissance service settings through Bridge.",
    "settings.update",
    ["service:knowledge_ai:admin"],
    "knowledge_ai_settings",
  ),
  "knowledge_ai.settings.automation.save": knowledgeAiOperationAction(
    "knowledge_ai.settings.automation.save",
    "Save a Connaissance automatic sorting rule through Bridge.",
    "settings.automation.save",
    ["service:knowledge_ai:admin"],
    "knowledge_ai_settings_automation",
  ),
  "knowledge_ai.settings.workflow.save": knowledgeAiOperationAction(
    "knowledge_ai.settings.workflow.save",
    "Save a Connaissance workflow integration through Bridge.",
    "settings.workflow.save",
    ["service:knowledge_ai:admin"],
    "knowledge_ai_settings_workflow",
  ),
  "knowledge_ai.connector.connect": knowledgeAiOperationAction(
    "knowledge_ai.connector.connect",
    "Connect a Connaissance connector via Bridge OAuth.",
    "connector.connect",
    ["service:knowledge_ai:admin"],
    "knowledge_ai_connector",
  ),
  "knowledge_ai.connector.disconnect": knowledgeAiOperationAction(
    "knowledge_ai.connector.disconnect",
    "Disconnect a Connaissance connector through Bridge.",
    "connector.disconnect",
    ["service:knowledge_ai:admin"],
    "knowledge_ai_connector",
  ),
  "knowledge_ai.data.export": knowledgeAiOperationAction(
    "knowledge_ai.data.export",
    "Export Connaissance data through the Bridge service contract.",
    "data.export",
    ["service:knowledge_ai:admin"],
    "knowledge_ai_data",
  ),
  "knowledge_ai.data.retention.update": knowledgeAiOperationAction(
    "knowledge_ai.data.retention.update",
    "Update Connaissance data retention settings.",
    "data.retention.update",
    ["service:knowledge_ai:admin"],
    "knowledge_ai_data",
  ),
  "knowledge_ai.api_key.create": knowledgeAiOperationAction(
    "knowledge_ai.api_key.create",
    "Create a Bridge-scoped Connaissance API key.",
    "api_key.create",
    ["service:knowledge_ai:admin"],
    "knowledge_ai_api_key",
  ),
  "knowledge_ai.api_key.revoke": knowledgeAiOperationAction(
    "knowledge_ai.api_key.revoke",
    "Revoke a Bridge-scoped Connaissance API key.",
    "api_key.revoke",
    ["service:knowledge_ai:admin"],
    "knowledge_ai_api_key",
  ),
  "knowledge_ai.account.update": knowledgeAiOperationAction(
    "knowledge_ai.account.update",
    "Update the Connaissance account profile through Bridge.",
    "account.update",
    ["service:knowledge_ai:write"],
    "knowledge_ai_account",
  ),
  "knowledge_ai.account.logout": knowledgeAiOperationAction(
    "knowledge_ai.account.logout",
    "End a Connaissance Bridge launch session.",
    "account.logout",
    ["service:knowledge_ai:read"],
    "knowledge_ai_account",
  ),
  "knowledge_ai.automation.run": knowledgeAiOperationAction(
    "knowledge_ai.automation.run",
    "Run a Connaissance source automation through Bridge jobs.",
    "automation.run",
    ["service:knowledge_ai:write"],
    "knowledge_ai_automation",
  ),
  "knowledge_ai.viewer.action": knowledgeAiOperationAction(
    "knowledge_ai.viewer.action",
    "Run a Connaissance viewer action such as copy, source open, zoom or download.",
    "viewer.action",
    ["service:knowledge_ai:read"],
    "knowledge_ai_viewer",
  ),
  "knowledge_ai.speech.start": knowledgeAiOperationAction(
    "knowledge_ai.speech.start",
    "Start local browser speech capture for the Connaissance composer.",
    "speech.start",
    ["service:knowledge_ai:chat"],
    "knowledge_ai_speech",
  ),
  "knowledge_ai.speech.stop": knowledgeAiOperationAction(
    "knowledge_ai.speech.stop",
    "Stop local browser speech capture for the Connaissance composer.",
    "speech.stop",
    ["service:knowledge_ai:chat"],
    "knowledge_ai_speech",
  ),
  "knowledge_ai.speech.toggle": knowledgeAiOperationAction(
    "knowledge_ai.speech.toggle",
    "Toggle local browser speech capture for the Connaissance composer.",
    "speech.toggle",
    ["service:knowledge_ai:chat"],
    "knowledge_ai_speech",
  ),
  "knowledge_ai.speech.reset": knowledgeAiOperationAction(
    "knowledge_ai.speech.reset",
    "Reset local browser speech capture for the Connaissance composer.",
    "speech.reset",
    ["service:knowledge_ai:chat"],
    "knowledge_ai_speech",
  ),
  "knowledge_ai.video.poll.start": knowledgeAiOperationAction(
    "knowledge_ai.video.poll.start",
    "Start polling local video processing status.",
    "video.poll.start",
    ["service:knowledge_ai:ingest"],
    "knowledge_ai_video",
  ),
  "knowledge_ai.video.poll.status": knowledgeAiOperationAction(
    "knowledge_ai.video.poll.status",
    "Read local video processing status.",
    "video.poll.status",
    ["service:knowledge_ai:read"],
    "knowledge_ai_video",
  ),
  "knowledge_ai.video.poll.stop": knowledgeAiOperationAction(
    "knowledge_ai.video.poll.stop",
    "Stop polling local video processing status.",
    "video.poll.stop",
    ["service:knowledge_ai:ingest"],
    "knowledge_ai_video",
  ),
  "knowledge_ai.video.poll.clear": knowledgeAiOperationAction(
    "knowledge_ai.video.poll.clear",
    "Clear local video polling state.",
    "video.poll.clear",
    ["service:knowledge_ai:ingest"],
    "knowledge_ai_video",
  ),
  "purchasing.quote.import": {
    id: "purchasing.quote.import",
    description: "Import or update a supplier quote in the generic purchasing module.",
    inputSchema: PurchasingQuoteImportSchema,
    inputJsonSchema: objectSchema({
      supplierName: { type: "string" },
      supplierExternalRef: { type: "string" },
      title: { type: "string" },
      amount: { type: "number" },
      currency: { type: "string" },
      riskLevel: { type: "string", enum: ["unknown", "low", "medium", "high"] },
    }, ["supplierName", "title"]),
    requiredServiceScopes: [{ serviceId: "purchasing", scopes: ["service:purchasing:write"] }],
    audit: { action: "purchasing.quote.import", resourceType: "purchasing_quote" },
    handler: async (ctx: ActionContext, input: PurchasingQuoteImportInput) => {
      const organizationId = requireActionOrganization(ctx);
      const supabase = getSupabaseServerClient(ctx.dataDir);
      const supplierRef = input.supplierExternalRef ?? `supplier:${input.supplierName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const { data: supplier, error: supplierError } = await supabase
        .from("purchasing_suppliers")
        .upsert({
          organization_id: organizationId,
          external_ref: supplierRef,
          name: input.supplierName,
          created_by: ctx.userId ?? null,
          updated_by: ctx.userId ?? null,
        }, { onConflict: "organization_id,external_ref" })
        .select("id")
        .single();
      if (supplierError) throw supplierError;
      const quoteRef = `quote:${supplierRef}:${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const { data: quote, error: quoteError } = await supabase
        .from("purchasing_quotes")
        .upsert({
          organization_id: organizationId,
          supplier_id: supplier.id,
          external_ref: quoteRef,
          title: input.title,
          amount: input.amount,
          currency: input.currency ?? "EUR",
          status: "under_review",
          risk_level: input.riskLevel ?? "unknown",
          created_by: ctx.userId ?? null,
          updated_by: ctx.userId ?? null,
        }, { onConflict: "organization_id,external_ref" })
        .select("*")
        .single();
      if (quoteError) throw quoteError;
      return { quote };
    },
  },
  "purchasing.quote.analyze": {
    id: "purchasing.quote.analyze",
    description: "Return a concise purchasing analysis from supplier quotes.",
    inputSchema: PurchasingQuoteAnalyzeSchema,
    inputJsonSchema: objectSchema({
      quoteIds: { type: "array", items: { type: "string", format: "uuid" } },
    }),
    requiredServiceScopes: [{ serviceId: "purchasing", scopes: ["service:purchasing:read"] }],
    audit: { action: "purchasing.quote.analyze", resourceType: "purchasing_quote" },
    handler: async (ctx: ActionContext, input: PurchasingQuoteAnalyzeInput) => {
      const organizationId = requireActionOrganization(ctx);
      const supabase = getSupabaseServerClient(ctx.dataDir);
      let query = supabase
        .from("purchasing_quotes")
        .select("id,title,amount,currency,status,risk_level,purchasing_suppliers(name)")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (input.quoteIds?.length) query = query.in("id", input.quoteIds);
      const { data, error } = await query;
      if (error) throw error;
      const quotes = data ?? [];
      const comparable = quotes.filter((quote: any) => typeof quote.amount === "number");
      const cheapest = comparable.slice().sort((a: any, b: any) => Number(a.amount) - Number(b.amount))[0];
      return {
        quoteCount: quotes.length,
        cheapestQuote: cheapest ?? null,
        highRiskCount: quotes.filter((quote: any) => quote.risk_level === "high").length,
        recommendation: cheapest
          ? `Prioriser ${cheapest.title} pour revue detaillee, puis verifier les clauses et donnees manquantes avant validation.`
          : "Completer les montants et conditions avant de recommander un fournisseur.",
        quotes,
      };
    },
  },
  "skills.list": {
    id: "skills.list",
    description: "List global and personal skills loaded by the app.",
    inputSchema: ListSkillsSchema,
    inputJsonSchema: objectSchema({ user: { type: "string" } }),
    handler: (ctx: ActionContext, input: { user?: string }) => {
      const user = input.user ?? "default";
      return { global: listGlobalSkills(ctx.dataDir), perso: listPersoSkills(ctx.dataDir, user) };
    },
  },
  "skills.writeGlobal": {
    id: "skills.writeGlobal",
    description: "Write or replace a global skill markdown file.",
    inputSchema: WriteSkillSchema,
    inputJsonSchema: objectSchema({ slug: { type: "string" }, raw: { type: "string" } }, ["slug", "raw"]),
    audit: { action: "skill.write-global", resourceType: "skill", adminOnly: true },
    handler: (ctx: ActionContext, input: { slug: string; raw: string }) => ({ skill: writeGlobalSkill(ctx.dataDir, input.slug, input.raw) }),
  },
  "audit.read": {
    id: "audit.read",
    description: "Read audit log events.",
    inputSchema: AuditReadSchema,
    inputJsonSchema: objectSchema({ since: { type: "string" }, user: { type: "string" }, limit: { type: "number" } }),
    handler: (ctx: ActionContext, input: { since?: string; user?: string; limit?: number }) => ({
      events: readAuditEvents(ctx.dataDir, {
        from: input.since,
        actor_id: input.user,
        limit: input.limit,
      }),
    }),
  },
  "audit.stats": {
    id: "audit.stats",
    description: "Compute audit statistics over a rolling window.",
    inputSchema: AuditStatsSchema,
    inputJsonSchema: objectSchema({ windowDays: { type: "number" } }),
    handler: (ctx: ActionContext, input: { windowDays?: number }) => ({ stats: computeAuditStats(ctx.dataDir, input.windowDays ?? 7) }),
  },
  "audit.verify": {
    id: "audit.verify",
    description: "Verify chained SHA-256 audit log integrity.",
    inputSchema: z.object({ user: z.string().optional(), date: z.string().optional() }).strict(),
    inputJsonSchema: objectSchema({ user: { type: "string" }, date: { type: "string" } }),
    handler: (ctx: ActionContext) => ({ integrity: verifyAuditLogIntegrity(ctx.dataDir) }),
  },
} satisfies Record<string, AppAction<any, any>>;

export type AppActionId = keyof typeof appActions;

export function listActions(): AppAction[] {
  return Object.values(appActions) as AppAction[];
}

export async function callAction(id: string, ctx: ActionContext, rawInput: unknown): Promise<unknown> {
  const action = appActions[id as AppActionId] as AppAction | undefined;
  if (!action) throw new Error(`Unknown action: ${id}`);
  const input = action.inputSchema.parse(rawInput ?? {});
  try {
    ensureActionAuthorized(ctx, action);
    const result = await action.handler(ctx, input);
    if (action.audit) {
      const resourceId = typeof input === "object" && input && "id" in input ? String((input as { id?: unknown }).id) : undefined;
      audit(ctx, action.audit, "success", { actionId: id }, resourceId);
    }
    return result;
  } catch (err) {
    if (action.audit) audit(ctx, action.audit, "failure", { actionId: id, error: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}

// Keep attachListener reachable to generated domain actions that want to reuse
// the generic SSE fan-out without importing from runs.ts directly.
export { attachListener };

function ensureActionAuthorized(ctx: ActionContext, action: AppAction): void {
  if (action.audit?.adminOnly && ctx.organizationId && ctx.membershipRole !== "owner" && ctx.membershipRole !== "admin") {
    throw new Error("admin-required");
  }
  for (const entry of action.requiredServiceScopes ?? []) {
    if (!ctx.organizationId) throw new Error("organization-required");
    for (const scope of entry.scopes) {
      if (!hasServiceScope(ctx, entry.serviceId, scope)) {
        throw new Error(`scope-forbidden:${scope}`);
      }
    }
  }
  for (const scope of action.requiredAnyScopes ?? []) {
    if (ctx.organizationId && !hasAnyScope(ctx, scope)) {
      throw new Error(`scope-forbidden:${scope}`);
    }
  }
}

function requireActionOrganization(ctx: ActionContext): string {
  if (!ctx.organizationId) throw new Error("organization-required");
  return ctx.organizationId;
}

function hasServiceScope(ctx: ActionContext, serviceId: string, scope: string): boolean {
  if (ctx.membershipRole === "owner" || ctx.membershipRole === "admin") return true;
  return (ctx.entitlements ?? []).some((entitlement) =>
    entitlement.enabled &&
    entitlement.service_id === serviceId &&
    entitlement.scopes.includes(scope)
  );
}

function hasAnyScope(ctx: ActionContext, scope: string): boolean {
  if (ctx.membershipRole === "owner" || ctx.membershipRole === "admin") return true;
  return (ctx.entitlements ?? []).some((entitlement) =>
    entitlement.enabled &&
    entitlement.scopes.includes(scope)
  );
}
