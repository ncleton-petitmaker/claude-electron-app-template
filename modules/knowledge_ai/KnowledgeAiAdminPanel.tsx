"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { apiFetch } from "@/lib/api-client";

type RuntimeProvider = "bridge_codex" | "lmstudio_local" | "dgx_spark_lan";

interface RuntimeStatus {
  providerMode: "local_only";
  providers: Array<{
    key: RuntimeProvider;
    label: string;
    enabled: boolean;
    ready: boolean;
    baseUrl?: string;
    detail: string;
  }>;
  externalAiBlocked: true;
  generatedAt: string;
}

interface SourceInventory {
  sourceDir: string;
  exists: boolean;
  commit?: string;
  branch?: string;
  uiSource: string;
  uiFiles: number;
  backendFunctionFolders: number;
  migrationFiles: number;
  generatedAt: string;
}

interface ActionEnvelope<T> {
  ok?: boolean;
  output?: T;
  error?: string;
}

async function callAction<T>(id: string, body: Record<string, unknown> = {}): Promise<T> {
  const response = await apiFetch(`/api/actions/${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as ActionEnvelope<T>;
  if (!response.ok || data.ok === false || !data.output) {
    throw new Error(data.error ?? `Action ${id} indisponible`);
  }
  return data.output;
}

export function KnowledgeAiAdminPanel() {
  const [runtime, setRuntime] = useState<RuntimeStatus | null>(null);
  const [inventory, setInventory] = useState<SourceInventory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const serviceUrl = process.env.NEXT_PUBLIC_KNOWLEDGE_AI_SERVICE_URL;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const [runtimeStatus, sourceInventory] = await Promise.all([
          callAction<RuntimeStatus>("knowledge_ai.runtime.status"),
          callAction<SourceInventory>("knowledge_ai.source.inventory"),
        ]);
        if (!cancelled) {
          setRuntime(runtimeStatus);
          setInventory(sourceInventory);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {error ? (
        <div className="card" style={{ padding: 14, borderColor: "var(--red-border)", color: "var(--red-fg)" }}>
          {error}
        </div>
      ) : null}

      <section className="admin-grid">
        <article className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
          <span className="eyebrow">Architecture</span>
          <strong style={{ color: "var(--fg-strong)", fontSize: 16 }}>Service web indépendant</strong>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            Bridge garde le contrat, les scopes, les tickets de lancement et le runtime local-only. La UI produit Connaissance vit dans son propre service Coolify.
          </p>
        </article>

        <article className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
          <span className="eyebrow">Déploiement</span>
          <strong style={{ color: "var(--fg-strong)", fontSize: 16 }}>Coolify dédié</strong>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            Domaine attendu : <code>connaissance.&lt;client-domain&gt;</code>. Supabase dédié par défaut, exception partagée uniquement si documentée.
          </p>
        </article>

        <article className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
          <span className="eyebrow">Service URL</span>
          <strong style={{ color: "var(--fg-strong)", fontSize: 16 }}>
            {serviceUrl ? "Configurée" : "Non configurée"}
          </strong>
          <code style={{ color: "var(--muted)", overflowWrap: "anywhere" }}>
            {serviceUrl ?? "NEXT_PUBLIC_KNOWLEDGE_AI_SERVICE_URL"}
          </code>
        </article>
      </section>

      <section className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <span className="eyebrow">Runtime IA</span>
            <h2 style={{ marginTop: 6, fontSize: 20 }}>Local-only</h2>
          </div>
          <span className="badge ok">APIs IA externes bloquées</span>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {(runtime?.providers ?? []).map((provider) => (
            <div
              key={provider.key}
              style={{
                display: "grid",
                gridTemplateColumns: "18px minmax(0, 1fr) auto",
                gap: 10,
                alignItems: "center",
                padding: "10px 0",
                borderTop: "1px solid var(--border)",
              }}
            >
              <Icon name={provider.ready ? "check" : "cpu"} size={14} />
              <span style={{ minWidth: 0, display: "grid", gap: 2 }}>
                <strong style={{ color: "var(--fg-strong)" }}>{provider.label}</strong>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>{provider.detail}</span>
              </span>
              <span className={`badge ${provider.ready ? "ok" : provider.enabled ? "warn" : ""}`}>
                {provider.ready ? "prêt" : provider.enabled ? "à vérifier" : "désactivé"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
        <span className="eyebrow">Source UI à adapter côté service</span>
        <strong style={{ color: "var(--fg-strong)" }}>{inventory?.exists ? "connaissanceNEW détecté" : "Source non détectée"}</strong>
        <code style={{ color: "var(--muted)", overflowWrap: "anywhere" }}>
          {inventory?.sourceDir ?? "/Users/nicolascleton/Documents/connaissanceNEW"}
        </code>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          UI source : <code>{inventory?.uiSource ?? "src/app-v2"}</code>
          {inventory?.commit ? <> · commit <code>{inventory.commit}</code></> : null}
        </p>
      </section>
    </div>
  );
}
