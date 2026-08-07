"use client";

import { useMemo, useState } from "react";
import { agentTemplates } from "@/data/feature-catalog";
import { callBridgeAction } from "@/lib/bridge-actions";

export function AgentsWorkspace() {
  const [status, setStatus] = useState("Agents prets");
  const [selectedAgentId, setSelectedAgentId] = useState(agentTemplates[0]?.id ?? "new");
  const selectedAgent = useMemo(
    () => agentTemplates.find((agent) => agent.id === selectedAgentId) ?? agentTemplates[0],
    [selectedAgentId],
  );

  async function run(action: string, id = selectedAgentId, payload: Record<string, unknown> = {}) {
    setStatus(`${action} : ${id}`);
    const result = action === "Creer agent"
      ? await callBridgeAction("knowledge_ai.agent.create", {
          name: payload.name ?? "Nouvel agent",
          systemInstructions: payload.systemInstructions ?? "Instructions systeme a valider dans le service Connaissance.",
          runtime: payload.runtime ?? "lmstudio_local",
        })
      : await callBridgeAction(agentActionId(action), {
          resourceId: id,
          payload: {
            action,
            agentId: id,
            ...payload,
          },
        });
    setStatus(result.ok ? `${action} pret via Bridge` : result.error ?? "Action agent indisponible");
  }

  return (
    <div className="knowledge-source-app">
      <aside className="knowledge-source-sidebar">
        <div className="knowledge-source-logo">
          <span>C</span>
          <strong>Connaissance</strong>
        </div>

        <div className="knowledge-source-mode-switch" role="group" aria-label="Mode">
          <a href="/chat">
            <ChatIcon />
            <span>Chat</span>
          </a>
          <a className="active" href="/dashboard">
            <DatabaseIcon />
            <span>Admin</span>
          </a>
        </div>

        <nav className="knowledge-source-nav" aria-label="Navigation principale">
          <a href="/chat"><ChatIcon /><span>Chat</span></a>
          <a href="/upload"><PlusIcon /><span>Ajouter</span></a>
          <a className="active" href="/dashboard"><DatabaseIcon /><span>Connaissances</span></a>
        </nav>

        <div className="knowledge-source-sidebar-spacer" aria-hidden="true" />

        <button
          className="knowledge-source-profile"
          type="button"
          onClick={() => {
            window.location.href = "/settings";
          }}
        >
          <span>NC</span>
          <div>
            <strong>Nicolas Cleton</strong>
            <small>demo@example.test</small>
          </div>
          <ChevronRightIcon />
        </button>
      </aside>

      <main className="knowledge-source-main knowledge-project-main knowledge-agents-main">
        <header className="knowledge-project-hero knowledge-agents-hero">
          <div className="knowledge-project-mark">
            <AgentIcon />
          </div>
          <div className="knowledge-project-heading">
            <span>Agents</span>
            <h1>Agents Connaissance</h1>
            <p>Instructions systeme, contexte dedie, tests et duplication via les actions Bridge du service.</p>
          </div>
          <div className="knowledge-project-actions">
            <button type="button" onClick={() => void run("Creer agent", "new")}>
              <PlusIcon />
              <span>Creer un agent</span>
            </button>
            <button type="button" onClick={() => void run("Tester", selectedAgentId)}>
              <PlayIcon />
              <span>Tester</span>
            </button>
          </div>
        </header>

        <section className="knowledge-project-stats" aria-label="Statistiques agents">
          <div><strong>{agentTemplates.length}</strong><span>Agents</span></div>
          <div><strong>system</strong><span>Instructions</span></div>
          <div><strong>local-only</strong><span>Runtime IA</span></div>
          <div><strong>Bridge</strong><span>Actions et scopes</span></div>
        </section>

        <section className="knowledge-project-grid knowledge-agents-grid">
          <article className="knowledge-project-section wide">
            <div className="knowledge-project-section-head">
              <div>
                <span>Bibliotheque</span>
                <h2>Agents existants</h2>
              </div>
            </div>

            <div className="knowledge-agents-list">
              {agentTemplates.map((agent) => (
                <button
                  className="knowledge-agent-row"
                  data-active={agent.id === selectedAgentId}
                  key={agent.id}
                  type="button"
                  onClick={() => {
                    setSelectedAgentId(agent.id);
                    void run("Selectionner", agent.id);
                  }}
                >
                  <span className="knowledge-project-type"><AgentIcon /></span>
                  <div>
                    <strong>{agent.name}</strong>
                    <small>{agent.systemInstruction}</small>
                  </div>
                  <em>{agent.role}</em>
                  <ChevronRightIcon />
                </button>
              ))}
            </div>
          </article>

          <article className="knowledge-project-section">
            <div className="knowledge-project-section-head">
              <div>
                <span>Edition</span>
                <h2>Instructions systeme</h2>
              </div>
            </div>
            <label className="knowledge-project-context">
              <span>Nom de l'agent</span>
              <input
                className="knowledge-agents-input"
                defaultValue={selectedAgent?.name ?? "Nouvel agent"}
                onBlur={(event) => void run("Modifier instructions systeme", selectedAgentId, { name: event.currentTarget.value })}
              />
            </label>
            <label className="knowledge-project-context">
              <span>Instructions systeme</span>
              <textarea
                defaultValue={selectedAgent?.systemInstruction ?? ""}
                onBlur={(event) => void run("Modifier instructions systeme", selectedAgentId, { systemInstructions: event.currentTarget.value })}
              />
            </label>
            <label className="knowledge-project-context">
              <span>Runtime</span>
              <select
                className="knowledge-agents-input"
                defaultValue="lmstudio_local"
                onChange={(event) => void run("Modifier instructions systeme", selectedAgentId, { runtime: event.currentTarget.value })}
              >
                <option value="lmstudio_local">LM Studio local</option>
                <option value="bridge_codex">Bridge Codex</option>
                <option value="dgx_spark_lan" disabled>DGX Spark LAN desactive</option>
              </select>
            </label>
          </article>

          <article className="knowledge-project-section">
            <div className="knowledge-project-section-head">
              <div>
                <span>Actions</span>
                <h2>{selectedAgent?.name ?? "Agent"}</h2>
              </div>
            </div>
            <div className="knowledge-agents-actions">
              <button type="button" onClick={() => void run("Tester", selectedAgentId)}><PlayIcon />Tester</button>
              <button type="button" onClick={() => void run("Modifier instructions systeme", selectedAgentId)}><EditIcon />Modifier</button>
              <button type="button" onClick={() => void run("Dupliquer", selectedAgentId)}><CopyIcon />Dupliquer</button>
              <button type="button" onClick={() => void run("Archiver", selectedAgentId)}><ArchiveIcon />Archiver</button>
            </div>
            <div className="knowledge-project-policy">
              <span><CheckIcon />service:knowledge_ai:agents</span>
              <span><CheckIcon />OAuth Bridge</span>
              <span><CheckIcon />0 API IA externe</span>
            </div>
          </article>

          <article className="knowledge-project-status">
            <a href="/dashboard">
              <DatabaseIcon />
              Retour aux connaissances
            </a>
            <p>{status}</p>
          </article>
        </section>
      </main>
    </div>
  );
}

function agentActionId(action: string) {
  if (action === "Tester") return "knowledge_ai.agent.test";
  if (action === "Modifier instructions systeme") return "knowledge_ai.agent.update";
  if (action === "Dupliquer") return "knowledge_ai.agent.duplicate";
  if (action === "Archiver") return "knowledge_ai.agent.archive";
  return "knowledge_ai.agent.test";
}

const ChatIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0zm3.75 0a.375.375 0 11-.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 4.556-4.03 8.25-9 8.25a9.8 9.8 0 01-2.55-.335A6 6 0 015.4 20.97a4.5 4.5 0 00.98-2.02c.09-.46-.13-.9-.47-1.23C4.4 16.18 3 14.19 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
const DatabaseIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6c0 1.66-3.69 3-8.25 3S3.75 7.66 3.75 6 7.44 3 12 3s8.25 1.34 8.25 3Zm0 0v6c0 1.66-3.69 3-8.25 3s-8.25-1.34-8.25-3V6m16.5 6v6c0 1.66-3.69 3-8.25 3s-8.25-1.34-8.25-3v-6" /></svg>;
const PlusIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const ChevronRightIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" /></svg>;
const AgentIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V3m0 3a6 6 0 016 6v3a6 6 0 01-12 0v-3a6 6 0 016-6zm-6 7H4m16 0h-2m-8 4h4" /></svg>;
const PlayIcon = () => <svg className="icon-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5.14v13.72a1 1 0 001.52.85l11.22-6.86a1 1 0 000-1.7L9.52 4.29A1 1 0 008 5.14z" /></svg>;
const EditIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.86 4.49l2.65 2.65m-1.33-3.98a1.875 1.875 0 012.65 2.65L7.5 19.14 3.75 20.25l1.11-3.75L18.18 3.16z" /></svg>;
const CopyIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 8h10v12H8z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 16H4V4h12v2" /></svg>;
const ArchiveIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5h18M5.25 7.5V19A2.25 2.25 0 007.5 21.25h9A2.25 2.25 0 0018.75 19V7.5M9.75 12h4.5M6 3.75h12l1.5 3.75h-15L6 3.75z" /></svg>;
const CheckIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
