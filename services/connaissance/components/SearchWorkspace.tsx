"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { knowledgeItems } from "@/data/feature-catalog";
import { callBridgeAction } from "@/lib/bridge-actions";

const filters = ["Tous", "Documents", "Groupes", "Medias", "Donnees", "Projet"];

export function SearchWorkspace() {
  const [query, setQuery] = useState("installation locale");
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [status, setStatus] = useState("Recherche locale prete");
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return knowledgeItems;
    return knowledgeItems.filter((item) =>
      `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(normalized),
    );
  }, [query]);

  async function runSearch(nextFilter = activeFilter) {
    setStatus(`Recherche : ${query || "toutes les connaissances"}`);
    const result = await callBridgeAction("knowledge_ai.knowledge.search", {
      payload: {
        query,
        filter: nextFilter,
        mode: "local_only",
      },
    });
    setStatus(result.ok ? "Resultats synchronises via Bridge" : result.error ?? "Recherche indisponible");
  }

  async function setFilter(filter: string) {
    setActiveFilter(filter);
    const result = await callBridgeAction("knowledge_ai.knowledge.filter.set", {
      payload: { filter, route: "/search" },
    });
    setStatus(result.ok ? `Filtre actif : ${filter}` : result.error ?? "Filtre indisponible");
    void runSearch(filter);
  }

  async function askWithResult(id: string) {
    const result = await callBridgeAction("knowledge_ai.conversation.context.set", {
      resourceId: id,
      payload: { route: "/search", query },
    });
    setStatus(result.ok ? "Contexte de chat prepare via Bridge" : result.error ?? "Contexte indisponible");
  }

  async function copyResult(id: string) {
    const result = await callBridgeAction("knowledge_ai.viewer.action", {
      resourceId: id,
      payload: { action: "copy-link", route: "/search" },
    });
    setStatus(result.ok ? "Lien copie via action Bridge" : result.error ?? "Copie indisponible");
  }

  return (
    <div className="knowledge-source-app">
      <ConnaissanceSidebar active="search" />
      <main className="knowledge-source-main knowledge-project-main knowledge-tool-main">
        <header className="knowledge-project-hero knowledge-tool-hero">
          <div className="knowledge-project-mark">
            <SearchIcon />
          </div>
          <div className="knowledge-project-heading">
            <span>Recherche</span>
            <h1>Recherche Connaissance</h1>
            <p>Retrouvez les passages, sources et groupes sans appel IA externe, via l'index local du service.</p>
          </div>
          <div className="knowledge-project-actions">
            <button type="button" onClick={() => void runSearch()}>
              <SearchIcon />
              <span>Rechercher</span>
            </button>
            <Link href="/chat">
              <ChatIcon />
              <span>Interroger</span>
            </Link>
          </div>
        </header>

        <section className="knowledge-tool-searchbar">
          <label>
            <span>Rechercher dans vos connaissances</span>
            <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} onKeyDown={(event) => {
              if (event.key === "Enter") void runSearch();
            }} />
          </label>
          <div className="knowledge-tool-filters" aria-label="Filtres de recherche">
            {filters.map((filter) => (
              <button key={filter} data-active={activeFilter === filter} type="button" onClick={() => void setFilter(filter)}>
                {filter}
              </button>
            ))}
          </div>
        </section>

        <section className="knowledge-project-grid knowledge-tool-grid">
          <article className="knowledge-project-section wide">
            <div className="knowledge-project-section-head">
              <div>
                <span>Resultats</span>
                <h2>{results.length} connaissances trouvees</h2>
              </div>
              <button type="button" onClick={() => void runSearch()}>
                <RefreshIcon />
                Actualiser
              </button>
            </div>

            <div className="knowledge-project-source-list">
              {results.map((item) => (
                <article className="knowledge-tool-result" key={item.id}>
                  <Link href={item.type === "group" ? `/groups/${item.id}` : `/knowledge/${item.id}`}>
                    <span className={`knowledge-project-type ${item.type}`}>
                      {item.type === "group" ? <FolderIcon /> : <FileIcon />}
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.summary}</small>
                    </div>
                    <em>{item.type}</em>
                  </Link>
                  <div className="knowledge-tool-result-actions">
                    <button type="button" onClick={() => void askWithResult(item.id)}>Interroger</button>
                    <button type="button" onClick={() => void copyResult(item.id)}>Copier le lien</button>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="knowledge-project-section">
            <div className="knowledge-project-section-head">
              <div>
                <span>Citations</span>
                <h2>Passages pertinents</h2>
              </div>
            </div>
            <div className="knowledge-tool-citations">
              <p>Installation Bridge et LM Studio : verifier les scopes avant le premier lancement local.</p>
              <p>Les traitements OCR, embeddings et resume restent dans le runtime local-only.</p>
              <p>Le contexte projet limite les reponses aux sources associees.</p>
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

export function ConnaissanceSidebar({ active }: { active: "search" | "analytics" | "settings" }) {
  return (
    <aside className="knowledge-source-sidebar">
      <div className="knowledge-source-logo">
        <span>C</span>
        <strong>Connaissance</strong>
      </div>
      <div className="knowledge-source-mode-switch" role="group" aria-label="Mode">
        <a href="/chat"><ChatIcon /><span>Chat</span></a>
        <a className="active" href="/dashboard"><DatabaseIcon /><span>Admin</span></a>
      </div>
      <nav className="knowledge-source-nav" aria-label="Navigation principale">
        <a href="/chat"><ChatIcon /><span>Chat</span></a>
        <a href="/upload"><PlusIcon /><span>Ajouter</span></a>
        <a href="/dashboard"><DatabaseIcon /><span>Connaissances</span></a>
        <a className={active === "search" ? "active" : undefined} href="/search"><SearchIcon /><span>Recherche</span></a>
        <a className={active === "analytics" ? "active" : undefined} href="/analytics"><ChartIcon /><span>Analytics</span></a>
        <a className={active === "settings" ? "active" : undefined} href="/settings"><SettingsIcon /><span>Parametres</span></a>
      </nav>
      <div className="knowledge-source-sidebar-spacer" aria-hidden="true" />
      <button className="knowledge-source-profile" type="button" onClick={() => { window.location.href = "/settings"; }}>
        <span>NC</span>
        <div>
          <strong>Nicolas Cleton</strong>
          <small>demo@example.test</small>
        </div>
        <ChevronRightIcon />
      </button>
    </aside>
  );
}

export const SearchIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.6-5.4a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
export const ChartIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 19V9m5 10V5m5 14v-7m5 7V3" /></svg>;
export const ChatIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0zm3.75 0a.375.375 0 11-.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 4.556-4.03 8.25-9 8.25a9.8 9.8 0 01-2.55-.335A6 6 0 015.4 20.97a4.5 4.5 0 00.98-2.02c.09-.46-.13-.9-.47-1.23C4.4 16.18 3 14.19 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
export const DatabaseIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6c0 1.66-3.69 3-8.25 3S3.75 7.66 3.75 6 7.44 3 12 3s8.25 1.34 8.25 3Zm0 0v6c0 1.66-3.69 3-8.25 3s-8.25-1.34-8.25-3V6m16.5 6v6c0 1.66-3.69 3-8.25 3s-8.25-1.34-8.25-3v-6" /></svg>;
export const PlusIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
export const ChevronRightIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" /></svg>;
export const FolderIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V6A2.25 2.25 0 014.5 3.75h5.38c.4 0 .78.16 1.06.44l2.12 2.12h6.44a2.25 2.25 0 012.25 2.25v9.19A2.25 2.25 0 0119.5 20H4.5a2.25 2.25 0 01-2.25-2.25v-5z" /></svg>;
export const FileIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.6L19 9.4V19a2 2 0 01-2 2z" /></svg>;
export const RefreshIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.02 9.35h4.99V4.36M3 20.94v-4.99h4.99M21.02 9.35A9 9 0 006.7 4.36M3 15.95a9 9 0 0014.32 4.99" /></svg>;
export const SettingsIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M9.59 3.94c.09-.54.56-.94 1.11-.94h2.6c.55 0 1.02.4 1.11.94l.21 1.28c.06.37.31.68.64.87.08.04.15.08.22.13.33.19.72.25 1.08.12l1.22-.46a1.13 1.13 0 011.37.49l1.3 2.25c.27.48.16 1.08-.26 1.43l-1 .83c-.3.24-.44.61-.43.99a7.68 7.68 0 010 .26c-.01.38.13.75.43.99l1 .83c.42.35.53.95.26 1.43l-1.3 2.25a1.13 1.13 0 01-1.37.49l-1.22-.46c-.36-.13-.75-.07-1.08.12l-.22.13c-.33.18-.58.5-.64.87l-.21 1.28c-.09.54-.56.94-1.11.94h-2.6c-.55 0-1.02-.4-1.11-.94l-.21-1.28c-.06-.37-.31-.69-.64-.87l-.22-.13c-.33-.19-.72-.25-1.08-.12l-1.22.46a1.13 1.13 0 01-1.37-.49l-1.3-2.25a1.13 1.13 0 01.26-1.43l1-.83c.3-.24.44-.61.43-.99a7.68 7.68 0 010-.26c.01-.38-.13-.75-.43-.99l-1-.83a1.13 1.13 0 01-.26-1.43l1.3-2.25a1.13 1.13 0 011.37-.49l1.22.46c.36.13.75.07 1.08-.12.07-.05.14-.09.22-.13.33-.19.58-.5.64-.87l.21-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
