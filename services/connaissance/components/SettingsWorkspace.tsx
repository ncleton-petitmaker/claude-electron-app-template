"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { bridgeContract } from "@/data/surfaces";
import { callBridgeAction } from "@/lib/bridge-actions";
import {
  ConnaissanceSidebar,
  FileIcon,
  RefreshIcon,
  SettingsIcon,
} from "@/components/SearchWorkspace";

type SettingsSection = "automation" | "workflows" | "connections" | "data" | "api-keys" | "account";

const settingsSections: Array<{ id: SettingsSection; label: string; description: string }> = [
  { id: "automation", label: "Tri automatique", description: "Regles locales de classement et tags" },
  { id: "workflows", label: "Integrations", description: "Webhooks et payloads controles par Bridge" },
  { id: "connections", label: "Connecteurs", description: "OAuth Bridge, Google Sheets et MCP" },
  { id: "data", label: "Donnees", description: "Export, retention et stockage dedie" },
  { id: "api-keys", label: "Cles API", description: "Cles Bridge scopees, pas de cle IA cloud" },
  { id: "account", label: "Compte", description: "Profil, organisation et session" },
];

const connectors = [
  { id: "google-drive", name: "Google Drive", detail: "Documents et tableurs via OAuth Bridge", status: "disponible" },
  { id: "google-sheets", name: "Google Sheets", detail: "Selection de feuilles et synchronisation locale", status: "pret" },
  { id: "mcp-custom", name: "Connecteur MCP", detail: "Serveur MCP client, scopes Bridge obligatoires", status: "controle" },
];

export function SettingsWorkspace() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("automation");
  const [status, setStatus] = useState("Parametres Bridge prets");
  const current = settingsSections.find((section) => section.id === activeSection) ?? settingsSections[0];

  async function run(actionId: string, label: string, payload: Record<string, unknown> = {}) {
    setStatus(`${label}...`);
    const result = await callBridgeAction(actionId, {
      resourceId: activeSection,
      payload: {
        section: activeSection,
        label,
        route: "/settings",
        ...payload,
      },
      settingsAction: label,
    });
    setStatus(result.ok ? `${label} pret via Bridge` : result.error ?? "Action parametres indisponible");
  }

  return (
    <div className="knowledge-source-app">
      <ConnaissanceSidebar active="settings" />
      <main className="knowledge-source-main knowledge-project-main knowledge-settings-main">
        <header className="knowledge-project-hero knowledge-settings-hero">
          <div className="knowledge-project-mark">
            <SettingsIcon />
          </div>
          <div className="knowledge-project-heading">
            <span>Parametres</span>
            <h1>Parametres Connaissance</h1>
            <p>Tri automatique, integrations, connecteurs, donnees, cles API et compte adaptes au Bridge.</p>
          </div>
          <div className="knowledge-project-actions">
            <button type="button" onClick={() => void run("knowledge_ai.runtime.status", "Verifier Bridge")}>
              <RefreshIcon />
              <span>Verifier Bridge</span>
            </button>
            <button type="button" onClick={() => void run("knowledge_ai.settings.update", "Enregistrer")}>
              <FileIcon />
              <span>Enregistrer</span>
            </button>
          </div>
        </header>

        <section className="knowledge-settings-layout">
          <aside className="knowledge-settings-nav" aria-label="Sections parametres">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                type="button"
                data-active={activeSection === section.id}
                onClick={() => setActiveSection(section.id)}
              >
                <SettingsIcon />
                <span>{section.label}</span>
                <small>{section.description}</small>
              </button>
            ))}
          </aside>

          <section className="knowledge-settings-panel">
            <div className="knowledge-project-section-head">
              <div>
                <span>{current.label}</span>
                <h2>{current.description}</h2>
              </div>
            </div>
            {activeSection === "automation" && <AutomationSettings onRun={run} />}
            {activeSection === "workflows" && <WorkflowSettings onRun={run} />}
            {activeSection === "connections" && <ConnectorSettings onRun={run} />}
            {activeSection === "data" && <DataSettings onRun={run} />}
            {activeSection === "api-keys" && <ApiKeySettings onRun={run} />}
            {activeSection === "account" && <AccountSettings onRun={run} />}
          </section>

          <aside className="knowledge-settings-side">
            <article>
              <span>Contrat Bridge</span>
              <strong>{bridgeContract.serviceId}</strong>
              <small>{bridgeContract.providerMode}</small>
            </article>
            <article>
              <span>Deploiement</span>
              <strong>Coolify dedie</strong>
              <small>Supabase dedie par defaut</small>
            </article>
            <article>
              <span>Runtime IA</span>
              <strong>local-only</strong>
              <small>Bridge Codex, LM Studio, DGX plus tard</small>
            </article>
            <p>{status}</p>
          </aside>
        </section>
      </main>
    </div>
  );
}

function AutomationSettings({ onRun }: { onRun: RunSettingsAction }) {
  return (
    <div className="knowledge-settings-stack">
      <SettingsRow title="Regle documents" detail="Si le titre contient procedure, ajouter le tag onboarding.">
        <button type="button" onClick={() => void onRun("knowledge_ai.settings.automation.save", "Sauvegarder la regle documents")}>Sauvegarder</button>
      </SettingsRow>
      <SettingsRow title="Regle medias" detail="Si le type est audio ou video, lancer transcription locale.">
        <button type="button" onClick={() => void onRun("knowledge_ai.settings.automation.save", "Sauvegarder la regle medias")}>Activer</button>
      </SettingsRow>
      <SettingsRow title="Traitement prive" detail="Marquer comme prive les sources contenant donnees sensibles.">
        <button type="button" onClick={() => void onRun("knowledge_ai.settings.automation.save", "Sauvegarder la regle privee")}>Enregistrer</button>
      </SettingsRow>
    </div>
  );
}

function WorkflowSettings({ onRun }: { onRun: RunSettingsAction }) {
  return (
    <div className="knowledge-settings-stack">
      <SettingsRow title="Webhook RAG termine" detail="Envoyer titre, resume, citations et tags quand le traitement local se termine.">
        <button type="button" onClick={() => void onRun("knowledge_ai.settings.workflow.save", "Sauvegarder workflow RAG")}>Sauvegarder</button>
      </SettingsRow>
      <SettingsRow title="Payload audio" detail="Inclure transcription, besoins client et taches extraites localement.">
        <button type="button" onClick={() => void onRun("knowledge_ai.settings.workflow.save", "Configurer payload audio")}>Configurer</button>
      </SettingsRow>
      <SettingsRow title="Historique executions" detail="Les executions sont auditees par Bridge, sans secret visible dans le client.">
        <button type="button" onClick={() => void onRun("knowledge_ai.automation.run", "Lire historique workflow")}>Afficher</button>
      </SettingsRow>
    </div>
  );
}

function ConnectorSettings({ onRun }: { onRun: RunSettingsAction }) {
  return (
    <div className="knowledge-settings-stack">
      {connectors.map((connector) => (
        <SettingsRow key={connector.id} title={connector.name} detail={`${connector.detail} - ${connector.status}`}>
          <button type="button" onClick={() => void onRun("knowledge_ai.connector.connect", `Connecter ${connector.name}`, { connectorId: connector.id })}>Connecter</button>
          <button type="button" onClick={() => void onRun("knowledge_ai.connector.disconnect", `Deconnecter ${connector.name}`, { connectorId: connector.id })}>Deconnecter</button>
        </SettingsRow>
      ))}
    </div>
  );
}

function DataSettings({ onRun }: { onRun: RunSettingsAction }) {
  return (
    <div className="knowledge-settings-stack">
      <SettingsRow title="Export des connaissances" detail="Exporter sources, chunks, citations et metadonnees depuis le Supabase dedie.">
        <button type="button" onClick={() => void onRun("knowledge_ai.data.export", "Exporter les donnees")}>Exporter</button>
      </SettingsRow>
      <SettingsRow title="Retention locale" detail="Conserver les traitements locaux 90 jours avant archivage.">
        <button type="button" onClick={() => void onRun("knowledge_ai.data.retention.update", "Modifier la retention", { days: 90 })}>Modifier</button>
      </SettingsRow>
      <SettingsRow title="Healthcheck stockage" detail="Verifier service, launch callback, healthz et scopes Bridge.">
        <button type="button" onClick={() => void onRun("knowledge_ai.runtime.status", "Verifier stockage")}>Verifier</button>
      </SettingsRow>
    </div>
  );
}

function ApiKeySettings({ onRun }: { onRun: RunSettingsAction }) {
  return (
    <div className="knowledge-settings-stack">
      <SettingsRow title="Cle lecture Bridge" detail="Lecture seule pour consulter les connaissances via le contrat service.">
        <button type="button" onClick={() => void onRun("knowledge_ai.api_key.create", "Creer cle lecture", { permissions: ["read"] })}>Creer</button>
      </SettingsRow>
      <SettingsRow title="Cle ingestion Bridge" detail="Creation et remplacement de contenus, sans acces aux providers IA cloud.">
        <button type="button" onClick={() => void onRun("knowledge_ai.api_key.create", "Creer cle ingestion", { permissions: ["read", "create", "replace"] })}>Creer</button>
      </SettingsRow>
      <SettingsRow title="Revocation" detail="Revoquer une cle compromise et tracer l'action dans l'audit Bridge.">
        <button type="button" onClick={() => void onRun("knowledge_ai.api_key.revoke", "Revoquer cle demo")}>Revoquer</button>
      </SettingsRow>
    </div>
  );
}

function AccountSettings({ onRun }: { onRun: RunSettingsAction }) {
  return (
    <div className="knowledge-settings-stack">
      <SettingsRow title="Profil" detail="Nicolas Cleton - demo@example.test - administrateur demo.">
        <button type="button" onClick={() => void onRun("knowledge_ai.account.update", "Modifier le profil")}>Modifier</button>
      </SettingsRow>
      <SettingsRow title="Organisation" detail="Service Connaissance lance via OAuth Bridge et ticket court.">
        <button type="button" onClick={() => void onRun("knowledge_ai.runtime.status", "Verifier organisation")}>Verifier</button>
      </SettingsRow>
      <SettingsRow title="Session" detail="La deconnexion termine la session Bridge sans appeler Supabase Auth cote client.">
        <button type="button" onClick={() => void onRun("knowledge_ai.account.logout", "Deconnecter")}>Deconnecter</button>
      </SettingsRow>
    </div>
  );
}

type RunSettingsAction = (actionId: string, label: string, payload?: Record<string, unknown>) => Promise<void>;

function SettingsRow({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return (
    <div className="knowledge-settings-row">
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
      <div>{children}</div>
    </div>
  );
}
