"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { agentTemplates, knowledgeItems, projectContexts } from "@/data/feature-catalog";
import { callBridgeAction } from "@/lib/bridge-actions";

interface ProjectWorkspaceProps {
  projectId: string;
}

export function ProjectWorkspace({ projectId }: ProjectWorkspaceProps) {
  const [status, setStatus] = useState("Contexte projet pret");
  const project = useMemo(() => projectContexts.find((entry) => entry.id === projectId) ?? projectContexts[0], [projectId]);
  const projectSources = useMemo(() => knowledgeItems.slice(0, Math.min(6, knowledgeItems.length)), []);

  async function run(action: string, extra: Record<string, unknown> = {}) {
    setStatus(`${action} : ${project.name}`);
    const result = await callBridgeAction(projectActionId(action), {
      resourceId: project.id,
      payload: { action, projectName: project.name, ...extra },
    });
    setStatus(result.ok ? `${action} pret via Bridge` : result.error ?? "Action projet indisponible");
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

      <main className="knowledge-source-main knowledge-project-main">
        <header className="knowledge-project-hero">
          <div className="knowledge-project-mark">
            <FolderIcon />
          </div>
          <div className="knowledge-project-heading">
            <span>Projet</span>
            <h1>{project.name}</h1>
            <p>{project.description}</p>
          </div>
          <div className="knowledge-project-actions">
            <button type="button" onClick={() => void run("Mettre a jour le contexte")}>
              <RefreshIcon />
              <span>Mettre a jour</span>
            </button>
            <button type="button" onClick={() => void run("Chat projet")}>
              <ChatIcon />
              <span>Interroger</span>
            </button>
          </div>
        </header>

        <section className="knowledge-project-stats" aria-label="Statistiques projet">
          <div><strong>{project.sources}</strong><span>Sources</span></div>
          <div><strong>{project.agents}</strong><span>Agents</span></div>
          <div><strong>local-only</strong><span>Runtime IA</span></div>
          <div><strong>Bridge</strong><span>OAuth et scopes</span></div>
        </section>

        <section className="knowledge-project-grid">
          <article className="knowledge-project-section wide">
            <div className="knowledge-project-section-head">
              <div>
                <span>Contexte dedie</span>
                <h2>Sources associees</h2>
              </div>
              <button type="button" onClick={() => void run("Ajouter une source")}>
                <PlusIcon />
                Ajouter
              </button>
            </div>
            <div className="knowledge-project-source-list">
              {projectSources.map((item) => (
                <Link className="knowledge-project-source-row" key={item.id} href={item.type === "group" ? `/groups/${item.id}` : `/knowledge/${item.id}`}>
                  <span className={`knowledge-project-type ${item.type}`}>
                    {item.type === "group" ? <FolderIcon /> : <FileIcon />}
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.summary}</small>
                  </div>
                  <em>{item.type}</em>
                  <ChevronRightIcon />
                </Link>
              ))}
            </div>
          </article>

          <article className="knowledge-project-section">
            <div className="knowledge-project-section-head">
              <div>
                <span>Agents</span>
                <h2>Agents du projet</h2>
              </div>
            </div>
            <div className="knowledge-project-agent-list">
              {agentTemplates.map((agent) => (
                <button key={agent.id} type="button" onClick={() => void run(`Lancer ${agent.name}`, { agentId: agent.id })}>
                  <span><AgentIcon /></span>
                  <div>
                    <strong>{agent.name}</strong>
                    <small>{agent.role}</small>
                  </div>
                  <PlayIcon />
                </button>
              ))}
            </div>
          </article>

          <article className="knowledge-project-section">
            <div className="knowledge-project-section-head">
              <div>
                <span>Instructions</span>
                <h2>Memoire projet</h2>
              </div>
            </div>
            <label className="knowledge-project-context">
              <span>Instructions systeme du projet</span>
              <textarea
                defaultValue={`Repondre seulement avec les sources de ${project.name}. Citer les connaissances utilisees et refuser les appels IA externes.`}
                onBlur={(event) => void run("Mettre a jour le contexte", { instructions: event.currentTarget.value })}
              />
            </label>
            <div className="knowledge-project-policy">
              <span><CheckIcon />Bridge OAuth</span>
              <span><CheckIcon />LM Studio local</span>
              <span><CheckIcon />DGX Spark LAN desactive</span>
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

function projectActionId(action: string) {
  if (action === "Chat projet") return "knowledge_ai.conversation.context.set";
  if (action === "Ajouter une source") return "knowledge_ai.knowledge.associate";
  if (action.startsWith("Lancer ")) return "knowledge_ai.project.launch_agent";
  return "knowledge_ai.project.update_context";
}

const ChatIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 4.556-4.03 8.25-9 8.25a9.8 9.8 0 01-2.55-.335A6 6 0 015.4 20.97a4.5 4.5 0 00.98-2.02c.09-.46-.13-.9-.47-1.23C4.4 16.18 3 14.19 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
const DatabaseIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6c0 1.66-3.69 3-8.25 3S3.75 7.66 3.75 6 7.44 3 12 3s8.25 1.34 8.25 3Zm0 0v6c0 1.66-3.69 3-8.25 3s-8.25-1.34-8.25-3V6m16.5 6v6c0 1.66-3.69 3-8.25 3s-8.25-1.34-8.25-3v-6" /></svg>;
const PlusIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const ChevronRightIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" /></svg>;
const FolderIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V6A2.25 2.25 0 014.5 3.75h5.38c.4 0 .78.16 1.06.44l2.12 2.12h6.44a2.25 2.25 0 012.25 2.25v9.19A2.25 2.25 0 0119.5 20H4.5a2.25 2.25 0 01-2.25-2.25v-5z" /></svg>;
const FileIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.6L19 9.4V19a2 2 0 01-2 2z" /></svg>;
const RefreshIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.02 9.35h4.99V4.36M3 20.94v-4.99h4.99M21.02 9.35A9 9 0 006.7 4.36M3 15.95a9 9 0 0014.32 4.99" /></svg>;
const AgentIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V3m0 3a6 6 0 016 6v3a6 6 0 01-12 0v-3a6 6 0 016-6zm-6 7H4m16 0h-2m-8 4h4" /></svg>;
const PlayIcon = () => <svg className="icon-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5.14v13.72a1 1 0 001.52.85l11.22-6.86a1 1 0 000-1.7L9.52 4.29A1 1 0 008 5.14z" /></svg>;
const CheckIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
