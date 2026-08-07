"use client";

import Link from "next/link";
import { useState } from "react";
import { knowledgeItems } from "@/data/feature-catalog";
import { callBridgeAction } from "@/lib/bridge-actions";
import {
  ChartIcon,
  ChatIcon,
  ConnaissanceSidebar,
  DatabaseIcon,
  FileIcon,
  RefreshIcon,
} from "@/components/SearchWorkspace";

const qualitySignals = [
  { label: "Sources citees", value: "94%", detail: "Documents avec passages exploitables" },
  { label: "Traitements locaux", value: "18", detail: "OCR, chunks, embeddings et resumes" },
  { label: "Erreurs ingestion", value: "2", detail: "A retraiter sans fallback cloud" },
];

const pipelines = [
  { label: "PDF et documents", value: 42, status: "stable" },
  { label: "Audio et video", value: 8, status: "en cours" },
  { label: "Tableurs GenBI", value: 6, status: "pret" },
  { label: "Social et email", value: 11, status: "controle" },
];

export function AnalyticsWorkspace() {
  const [status, setStatus] = useState("Analytics locales pretes");

  async function run(action: string, payload: Record<string, unknown> = {}) {
    setStatus(`${action}...`);
    const actionId = action === "Verifier runtime" ? "knowledge_ai.runtime.status" : "knowledge_ai.analytics.refresh";
    const result = await callBridgeAction(actionId, {
      payload: { action, route: "/analytics", ...payload },
      settingsAction: action,
    });
    setStatus(result.ok ? `${action} termine via Bridge` : result.error ?? "Analytics indisponibles");
  }

  async function exportReport() {
    setStatus("Export rapport...");
    const result = await callBridgeAction("knowledge_ai.automation.run", {
      resourceId: "analytics-report",
      payload: { task: "export-analytics-report", route: "/analytics" },
    });
    setStatus(result.ok ? "Rapport prepare via Bridge" : result.error ?? "Export indisponible");
  }

  return (
    <div className="knowledge-source-app">
      <ConnaissanceSidebar active="analytics" />
      <main className="knowledge-source-main knowledge-project-main knowledge-tool-main">
        <header className="knowledge-project-hero knowledge-tool-hero">
          <div className="knowledge-project-mark">
            <ChartIcon />
          </div>
          <div className="knowledge-project-heading">
            <span>Analytics</span>
            <h1>Analytics Connaissance</h1>
            <p>Qualite de la base, traitements locaux, couverture des sources et statut runtime Bridge.</p>
          </div>
          <div className="knowledge-project-actions">
            <button type="button" onClick={() => void run("Actualiser analytics")}>
              <RefreshIcon />
              <span>Actualiser</span>
            </button>
            <button type="button" onClick={() => void exportReport()}>
              <FileIcon />
              <span>Exporter</span>
            </button>
          </div>
        </header>

        <section className="knowledge-project-stats" aria-label="Statistiques analytics">
          <div><strong>{knowledgeItems.length}</strong><span>Sources demo</span></div>
          <div><strong>0</strong><span>API IA externe</span></div>
          <div><strong>local</strong><span>Embeddings/OCR</span></div>
          <div><strong>Bridge</strong><span>Audit et jobs</span></div>
        </section>

        <section className="knowledge-project-grid knowledge-tool-grid">
          <article className="knowledge-project-section wide">
            <div className="knowledge-project-section-head">
              <div>
                <span>Pipelines</span>
                <h2>Traitements par type</h2>
              </div>
              <button type="button" onClick={() => void run("Actualiser analytics")}>
                <RefreshIcon />
                Actualiser
              </button>
            </div>
            <div className="knowledge-analytics-bars">
              {pipelines.map((pipeline) => (
                <button key={pipeline.label} type="button" onClick={() => void run("Filtrer pipeline", { pipeline: pipeline.label })}>
                  <span>
                    <strong>{pipeline.label}</strong>
                    <small>{pipeline.status}</small>
                  </span>
                  <em style={{ width: `${Math.max(18, pipeline.value)}%` }} />
                  <b>{pipeline.value}</b>
                </button>
              ))}
            </div>
          </article>

          <article className="knowledge-project-section">
            <div className="knowledge-project-section-head">
              <div>
                <span>Qualite</span>
                <h2>Signaux de confiance</h2>
              </div>
            </div>
            <div className="knowledge-analytics-signal-list">
              {qualitySignals.map((signal) => (
                <button key={signal.label} type="button" onClick={() => void run("Inspecter signal", { signal: signal.label })}>
                  <strong>{signal.value}</strong>
                  <span>{signal.label}</span>
                  <small>{signal.detail}</small>
                </button>
              ))}
            </div>
          </article>

          <article className="knowledge-project-section">
            <div className="knowledge-project-section-head">
              <div>
                <span>Runtime</span>
                <h2>Controle local-only</h2>
              </div>
            </div>
            <div className="knowledge-project-policy">
              <span>Bridge Codex autorise</span>
              <span>LM Studio local autorise</span>
              <span>DGX Spark LAN desactive</span>
              <span>Cloud IA interdit</span>
            </div>
            <div className="knowledge-agents-actions">
              <button type="button" onClick={() => void run("Verifier runtime")}><ChartIcon />Verifier runtime</button>
              <Link href="/search"><ChatIcon />Explorer</Link>
            </div>
          </article>

          <article className="knowledge-project-status">
            <Link href="/dashboard">
              <DatabaseIcon />
              Retour aux connaissances
            </Link>
            <p>{status}</p>
          </article>
        </section>
      </main>
    </div>
  );
}
