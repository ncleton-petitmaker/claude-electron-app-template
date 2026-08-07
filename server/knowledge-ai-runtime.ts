import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { DEFAULT_LOCAL_MODEL, LMSTUDIO_BASE_URL, loadAppConfig } from "./app-config.js";
import { startRun } from "./runs.js";
import type { ActionContext } from "./actions.js";

export type KnowledgeAiProvider = "bridge_codex" | "lmstudio_local" | "dgx_spark_lan";

export interface KnowledgeAiRuntimeStatus {
  providerMode: "local_only";
  providers: Array<{
    key: KnowledgeAiProvider;
    label: string;
    enabled: boolean;
    ready: boolean;
    baseUrl?: string;
    detail: string;
  }>;
  externalAiBlocked: true;
  generatedAt: string;
}

export interface KnowledgeAiSourceInventory {
  sourceDir: string;
  exists: boolean;
  commit?: string;
  branch?: string;
  uiSource: string;
  uiFiles: number;
  backendFunctionFolders: number;
  migrationFiles: number;
  copiedUiGroups: string[];
  rejectedRuntimeFamilies: string[];
  generatedAt: string;
}

export interface KnowledgeAiChatInput {
  message: string;
  provider?: KnowledgeAiProvider;
  projectId?: string;
  agentId?: string;
  conversationId?: string;
  contextIds?: string[];
  options?: {
    model?: string;
    useReasoning?: boolean;
    usePro?: boolean;
  };
}

export interface KnowledgeAiOperationInput {
  operation: string;
  resourceId?: string;
  payload?: Record<string, unknown>;
}

export const KNOWLEDGE_AI_PROVIDER_MODE = "local_only" as const;
const DEFAULT_SOURCE_DIR = "/Users/nicolascleton/Documents/connaissanceNEW";
const DGX_DEFAULT_BASE_URL = "http://dgx-spark.local:8000/v1";

export async function knowledgeAiRuntimeStatus(): Promise<KnowledgeAiRuntimeStatus> {
  assertLocalOnlyMode();
  const lmstudioBaseUrl = process.env.KNOWLEDGE_AI_LMSTUDIO_BASE_URL?.trim() || LMSTUDIO_BASE_URL;
  const dgxBaseUrl = process.env.KNOWLEDGE_AI_DGX_BASE_URL?.trim() || DGX_DEFAULT_BASE_URL;
  const [lmstudioReady, dgxReady] = await Promise.all([
    checkChatCompletionsServer(lmstudioBaseUrl),
    process.env.KNOWLEDGE_AI_DGX_ENABLED === "1" ? checkChatCompletionsServer(dgxBaseUrl) : Promise.resolve(false),
  ]);

  return {
    providerMode: KNOWLEDGE_AI_PROVIDER_MODE,
    externalAiBlocked: true,
    generatedAt: new Date().toISOString(),
    providers: [
      {
        key: "bridge_codex",
        label: "Bridge Codex",
        enabled: true,
        ready: true,
        detail: "Jobs Bridge audites via le runtime Codex local.",
      },
      {
        key: "lmstudio_local",
        label: "LM Studio local",
        enabled: true,
        ready: lmstudioReady,
        baseUrl: lmstudioBaseUrl,
        detail: lmstudioReady ? "Serveur local joignable." : "LM Studio doit exposer /v1 sur la loopback.",
      },
      {
        key: "dgx_spark_lan",
        label: "DGX Spark LAN",
        enabled: process.env.KNOWLEDGE_AI_DGX_ENABLED === "1",
        ready: dgxReady,
        baseUrl: dgxBaseUrl,
        detail: process.env.KNOWLEDGE_AI_DGX_ENABLED === "1" ? "Endpoint LAN configure." : "Prepare pour activation reseau local ulterieure.",
      },
    ],
  };
}

export function knowledgeAiSourceInventory(input: { sourceDir?: string } = {}): KnowledgeAiSourceInventory {
  assertLocalOnlyMode();
  const sourceDir = resolve(input.sourceDir?.trim() || process.env.YAKA_CONNAISSANCE_SOURCE_DIR || DEFAULT_SOURCE_DIR);
  const exists = existsSync(sourceDir);
  const uiRoot = join(sourceDir, "src", "app-v2");
  const functionsRoot = join(sourceDir, "supabase", "functions");
  const migrationsRoot = join(sourceDir, "supabase", "migrations");
  return {
    sourceDir,
    exists,
    commit: exists ? git(sourceDir, ["rev-parse", "HEAD"]) : undefined,
    branch: exists ? git(sourceDir, ["branch", "--show-current"]) : undefined,
    uiSource: "src/app-v2",
    uiFiles: countFiles(uiRoot, [".ts", ".tsx", ".css", ".svg"]),
    backendFunctionFolders: countDirs(functionsRoot),
    migrationFiles: countFiles(migrationsRoot, [".sql"]),
    copiedUiGroups: ["chat", "upload", "dashboard", "knowledge", "agents", "projects", "history"],
    rejectedRuntimeFamilies: ["cloud chat providers", "cloud embeddings", "cloud OCR", "legacy dynamic tenant cloning", "debug and repair functions"],
    generatedAt: new Date().toISOString(),
  };
}

export async function knowledgeAiChatSend(ctx: ActionContext, input: KnowledgeAiChatInput) {
  assertLocalOnlyMode();
  const provider = input.provider ?? "lmstudio_local";
  assertLocalProvider(provider);
  if (provider === "bridge_codex") return startBridgeCodexChat(ctx, input);
  if (provider === "dgx_spark_lan") return sendChatToDgx(input, false);
  return sendChatToLmStudio(ctx, input, false);
}

export async function knowledgeAiChatStream(ctx: ActionContext, input: KnowledgeAiChatInput) {
  assertLocalOnlyMode();
  const provider = input.provider ?? "lmstudio_local";
  assertLocalProvider(provider);
  if (provider === "bridge_codex") return startBridgeCodexChat(ctx, input);
  if (provider === "dgx_spark_lan") return sendChatToDgx(input, true);
  return sendChatToLmStudio(ctx, input, true);
}

export function knowledgeAiPrepareUpload(input: { fileName?: string; contentType?: string; sourceType?: string }) {
  assertLocalOnlyMode();
  const now = new Date().toISOString();
  return {
    upload: {
      id: `local-upload-${Date.now()}`,
      fileName: input.fileName ?? "source",
      contentType: input.contentType ?? "application/octet-stream",
      sourceType: input.sourceType ?? "file",
      status: "prepared",
      createdAt: now,
      runtime: "bridge-local",
    },
  };
}

export function knowledgeAiCreateProject(input: { name: string; description?: string }) {
  assertLocalOnlyMode();
  return {
    project: {
      id: `project-${Date.now()}`,
      name: input.name,
      description: input.description ?? "",
      contextPolicy: "organization-local",
      createdAt: new Date().toISOString(),
    },
  };
}

export function knowledgeAiCreateAgent(input: { name: string; systemInstructions: string; provider?: KnowledgeAiProvider }) {
  assertLocalOnlyMode();
  const provider = input.provider ?? "lmstudio_local";
  assertLocalProvider(provider);
  return {
    agent: {
      id: `agent-${Date.now()}`,
      name: input.name,
      systemInstructions: input.systemInstructions,
      provider,
      createdAt: new Date().toISOString(),
    },
  };
}

export function knowledgeAiBridgeOperation(input: KnowledgeAiOperationInput) {
  assertLocalOnlyMode();
  return {
    operation: {
      id: `knowledge-op-${Date.now()}`,
      operation: input.operation,
      resourceId: input.resourceId,
      payloadKeys: Object.keys(input.payload ?? {}),
      providerMode: KNOWLEDGE_AI_PROVIDER_MODE,
      bridgeOAuthRequired: true,
      dedicatedServiceRuntime: true,
      externalAiBlocked: true,
      acceptedAt: new Date().toISOString(),
    },
  };
}

export function knowledgeAiUiAction(input: {
  surface: string;
  action: string;
  resourceId?: string;
  payload?: Record<string, unknown>;
}) {
  assertLocalOnlyMode();
  return {
    uiAction: {
      id: `knowledge-ui-${Date.now()}`,
      surface: input.surface,
      action: input.action,
      resourceId: input.resourceId,
      accepted: true,
      providerMode: KNOWLEDGE_AI_PROVIDER_MODE,
      bridgeOAuthRequired: true,
      externalAiBlocked: true,
      createdAt: new Date().toISOString(),
    },
  };
}

async function sendChatToLmStudio(ctx: ActionContext, input: KnowledgeAiChatInput, stream: boolean) {
  const cfg = loadAppConfig(ctx.dataDir);
  const baseUrl = process.env.KNOWLEDGE_AI_LMSTUDIO_BASE_URL?.trim() || LMSTUDIO_BASE_URL;
  const model = cfg.localModel?.trim() || DEFAULT_LOCAL_MODEL;
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "Tu es le module Connaissance de Bridge. Reponds en utilisant uniquement les informations locales fournies par Bridge.",
        },
        { role: "user", content: input.message },
      ],
      temperature: 0.2,
      stream,
    }),
  }).catch((err) => {
    throw new Error(`lmstudio-unavailable:${err instanceof Error ? err.message : String(err)}`);
  });
  if (!response.ok) {
    throw new Error(`lmstudio-unavailable:http-${response.status}`);
  }
  if (stream) {
    const content = await readChatCompletionStream(response, "lmstudio");
    return {
      provider: "lmstudio_local" as const,
      streamed: true,
      message: {
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
      },
    };
  }
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: unknown };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("lmstudio-empty-response");
  return {
    provider: "lmstudio_local" as const,
    message: {
      role: "assistant",
      content,
      createdAt: new Date().toISOString(),
    },
    usage: data.usage,
  };
}

async function sendChatToDgx(input: KnowledgeAiChatInput, stream: boolean) {
  if (process.env.KNOWLEDGE_AI_DGX_ENABLED !== "1") {
    throw new Error("dgx-disabled");
  }
  const baseUrl = process.env.KNOWLEDGE_AI_DGX_BASE_URL?.trim() || DGX_DEFAULT_BASE_URL;
  const model = process.env.KNOWLEDGE_AI_DGX_MODEL?.trim() || DEFAULT_LOCAL_MODEL;
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: input.message }],
      temperature: 0.2,
      stream,
    }),
  }).catch((err) => {
    throw new Error(`dgx-unavailable:${err instanceof Error ? err.message : String(err)}`);
  });
  if (!response.ok) throw new Error(`dgx-unavailable:http-${response.status}`);
  if (stream) {
    const content = await readChatCompletionStream(response, "dgx");
    return {
      provider: "dgx_spark_lan" as const,
      streamed: true,
      message: { role: "assistant", content, createdAt: new Date().toISOString() },
    };
  }
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: unknown };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("dgx-empty-response");
  return {
    provider: "dgx_spark_lan" as const,
    message: { role: "assistant", content, createdAt: new Date().toISOString() },
    usage: data.usage,
  };
}

async function readChatCompletionStream(response: Response, source: string): Promise<string> {
  if (!response.body) throw new Error(`${source}-empty-stream`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }> };
        content += parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.message?.content ?? "";
      } catch {
        throw new Error(`${source}-invalid-stream`);
      }
    }
  }
  const trimmed = content.trim();
  if (!trimmed) throw new Error(`${source}-empty-stream`);
  return trimmed;
}

function startBridgeCodexChat(ctx: ActionContext, input: KnowledgeAiChatInput) {
  const run = startRun({
    prompt: [
      "Contexte: module Connaissance Bridge, mode IA locale uniquement.",
      "Reponds a la demande utilisateur sans appeler d'API IA externe.",
      "",
      input.message,
    ].join("\n"),
    cwd: ctx.dataDir,
    tag: "knowledge-ai-chat",
    agentProvider: "codex-cloud",
  });
  return {
    provider: "bridge_codex" as const,
    run,
    message: {
      role: "assistant",
      content: `Job Bridge Codex lance: ${run.id}`,
      createdAt: new Date().toISOString(),
    },
  };
}

async function checkChatCompletionsServer(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      method: "GET",
      signal: AbortSignal.timeout(1200),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function assertLocalProvider(provider: KnowledgeAiProvider): void {
  if (provider !== "bridge_codex" && provider !== "lmstudio_local" && provider !== "dgx_spark_lan") {
    throw new Error(`provider-forbidden:${provider}`);
  }
}

function assertLocalOnlyMode(): void {
  const configured = process.env.KNOWLEDGE_AI_PROVIDER_MODE?.trim();
  if (configured && configured !== KNOWLEDGE_AI_PROVIDER_MODE) {
    throw new Error(`knowledge-ai-provider-mode-forbidden:${configured}`);
  }
}

function countFiles(dir: string, extensions: string[]): number {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) total += countFiles(full, extensions);
    else if (extensions.some((ext) => entry.endsWith(ext))) total += 1;
  }
  return total;
}

function countDirs(dir: string): number {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((entry) => statSync(join(dir, entry)).isDirectory()).length;
}

function git(dir: string, args: string[]): string | undefined {
  try {
    return execFileSync("git", ["-C", dir, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).trim() || undefined;
  } catch {
    return undefined;
  }
}
