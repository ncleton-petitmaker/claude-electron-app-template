"use client";

import { useMemo, useState } from "react";
import { AutomationPanel } from "@/components/AutomationPanel";
import { ServiceIcon } from "@/components/ServiceIcon";
import {
  knowledgeItems,
  emailThreadLabels,
  structuredDataLabels,
  viewerTabsByType,
  type KnowledgeItem,
} from "@/data/feature-catalog";
import { callBridgeAction } from "@/lib/bridge-actions";

interface KnowledgeDetailPageProps {
  sourceId: string;
}

export function KnowledgeDetailPage({ sourceId }: KnowledgeDetailPageProps) {
  const item = useMemo(() => knowledgeItems.find((entry) => entry.id === sourceId) ?? knowledgeItems[0], [sourceId]);
  const type = item.type === "group" ? "pdf" : item.type;

  if (type === "audio") return <AudioDetailViewer item={item} />;
  if (type === "video") return <VideoDetailViewer item={item} />;
  if (type === "linkedin" || type === "twitter") return <SocialDetailViewer item={item} />;
  if (type === "email") return <EmailThreadViewer item={item} />;
  if (type === "spreadsheet") return <SpreadsheetDetailViewer item={item} />;
  return <GenericDetailViewer item={item} />;
}

function GenericDetailViewer({ item }: { item: KnowledgeItem }) {
  const tabs = viewerTabsByType[item.type] ?? viewerTabsByType.pdf;
  const [tab, setTab] = useState(tabs[0]?.id ?? "document");
  const [status, setStatus] = useState("Viewer pret");

  async function run(action: string) {
    setStatus(`${action}...`);
    const result = await callViewerAction(item.id, action);
    setStatus(result.ok ? `${action} pret via Bridge` : result.error ?? "Action Bridge indisponible");
  }

  return (
    <section className="viewer-grid">
      <article className="viewer-main service-panel">
        <ViewerHeader title={item.title} type={item.type} onRun={run} />
        <ViewerTabs tabs={tabs} active={tab} onChange={setTab} />
        {tab === "automation" ? (
          <AutomationPanel sourceId={item.id} />
        ) : (
          <div className="viewer-document">
            <div className="service-preview">
              <ServiceIcon name="file" size={36} />
              <span>{tabLabel(tab)} local</span>
            </div>
            <p className="service-muted">
              {item.summary} Les controles Copier le texte, Ouvrir la source, Telecharger, zoom out et zoom in passent par Bridge.
            </p>
          </div>
        )}
        <p className="service-muted">{status}</p>
      </article>
      <ViewerMetadata item={item} />
    </section>
  );
}

function AudioDetailViewer({ item }: { item: KnowledgeItem }) {
  const [tab, setTab] = useState("summary");
  return (
    <section className="viewer-grid">
      <article className="viewer-main service-panel">
        <ViewerHeader title={item.title} type="audio" onRun={(action) => callViewerAction(item.id, action)} />
        <ViewerTabs tabs={viewerTabsByType.audio} active={tab} onChange={setTab} />
        {tab === "automation" ? <AutomationPanel sourceId={item.id} /> : (
          <div className="viewer-document">
            <div className="audio-waveform">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <section className="service-grid">
              <article className="service-card"><strong>Resume</strong><span className="service-muted">Synthese locale de l'audio.</span></article>
              <article className="service-card"><strong>Besoins</strong><span className="service-muted">Attentes extraites de la transcription.</span></article>
              <article className="service-card"><strong>Taches</strong><span className="service-muted">Actions detectees, assignables ensuite.</span></article>
              <article className="service-card"><strong>Transcription</strong><span className="service-muted">Texte complet avec timestamps.</span></article>
            </section>
            <button className="service-button" type="button">Copier</button>
          </div>
        )}
      </article>
      <ViewerMetadata item={item} />
    </section>
  );
}

function VideoDetailViewer({ item }: { item: KnowledgeItem }) {
  const [tab, setTab] = useState("summary");
  return (
    <section className="viewer-grid">
      <article className="viewer-main service-panel">
        <ViewerHeader title={item.title} type="video" onRun={(action) => callViewerAction(item.id, action)} />
        <ViewerTabs tabs={viewerTabsByType.video} active={tab} onChange={setTab} />
        {tab === "automation" ? <AutomationPanel sourceId={item.id} /> : (
          <div className="viewer-document">
            <div className="video-frame">Timeline</div>
            <div className="timeline-controls">
              <button type="button">00:00 Objectif</button>
              <button type="button">02:14 Resultat</button>
              <button type="button">04:32 Ressources</button>
            </div>
            <section className="service-grid">
              {["Objectif", "Resultat", "Resume", "Tags", "Outils utilises", "Outils requis", "Documentation", "Liens", "Contacts"].map((label) => (
                <article className="service-card" key={label}>
                  <strong>{label}</strong>
                  <span className="service-muted">Extrait structure depuis la video.</span>
                </article>
              ))}
            </section>
          </div>
        )}
      </article>
      <ViewerMetadata item={item} />
    </section>
  );
}

function SocialDetailViewer({ item }: { item: KnowledgeItem }) {
  const [tab, setTab] = useState("ai-summary");
  return (
    <section className="viewer-grid">
      <article className="viewer-main service-panel">
        <ViewerHeader title={item.title} type={item.type} onRun={(action) => callViewerAction(item.id, action)} />
        <ViewerTabs tabs={viewerTabsByType.linkedin} active={tab} onChange={setTab} />
        {tab === "automation" ? <AutomationPanel sourceId={item.id} /> : (
          <div className="viewer-document">
            <article className="service-card">
              <strong>Resume IA</strong>
              <span className="service-muted">Angle, promesse, preuves, audience et idees de reutilisation.</span>
            </article>
            <div className="timeline-controls">
              <button type="button">Copier</button>
              <button type="button">Ouvrir la source</button>
            </div>
          </div>
        )}
      </article>
      <ViewerMetadata item={item} />
    </section>
  );
}

function EmailThreadViewer({ item }: { item: KnowledgeItem }) {
  const [tab, setTab] = useState("thread");
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const messages = [
    { from: "client@example.test", date: "Aujourd'hui", content: "Bonjour, pouvez-vous confirmer le périmètre et les prochaines étapes ?", quoted: "On ... wrote:" },
    { from: "equipe@example.test", date: "Aujourd'hui", content: "Voici le résumé de la conversation et les pièces jointes utiles.", quoted: "Le ... a écrit :" },
  ];
  return (
    <section className="viewer-grid">
      <article className="viewer-main service-panel">
        <ViewerHeader title={item.title} type="email" onRun={(action) => callViewerAction(item.id, action)} />
        <ViewerTabs tabs={[
          { id: "thread", label: "Conversation" },
          { id: "summary", label: "Résumé IA" },
          { id: "automation", label: "Automatisation" },
        ]} active={tab} onChange={setTab} />
        {tab === "automation" ? <AutomationPanel sourceId={item.id} /> : (
          <div className="email-thread">
            <div className="viewer-title-row">
              <span className="service-badge">Messages dans le thread</span>
              <div className="viewer-actions">
                <button type="button" onClick={() => setExpanded((value) => !value)}>{expanded ? "Réduire tout" : "Tout développer"}</button>
                <button type="button" onClick={() => setCopied(true)}>{copied ? "Copié" : "Copier"}</button>
              </div>
            </div>
            <div className="filter-chip-row">
              {emailThreadLabels.slice(0, 8).map((label) => (
                <span className="service-badge" key={label}>{label}</span>
              ))}
            </div>
            {tab === "summary" ? (
              <section className="service-panel subtle-panel">
                <h2>Résumé de la conversation</h2>
                <p>{item.summary}</p>
                <p className="service-muted">Résumé en cours de génération... Le résumé sera disponible sous peu si le pipeline local n'a pas encore terminé.</p>
              </section>
            ) : (
              messages.map((message, index) => (
                <article className="email-message" key={message.from}>
                  <div className="viewer-title-row">
                    <div>
                      <strong>{message.from || "Expéditeur inconnu"}</strong>
                      <p className="service-muted">{message.date}</p>
                    </div>
                    <span className="service-badge">{index + 1}</span>
                  </div>
                  {expanded ? <p>{message.content}</p> : <p className="service-muted">{message.content.slice(0, 42)}...</p>}
                  <details>
                    <summary>{expanded ? "Masquer le texte cité" : "Afficher le texte cité"}</summary>
                    <p className="service-muted">{message.quoted}</p>
                  </details>
                </article>
              ))
            )}
            <section className="service-panel subtle-panel">
              <h2>Pièces jointes</h2>
              <div className="service-list">
                <div className="service-row"><span>brief.pdf</span><span>Prêt</span></div>
                <div className="service-row"><span>capture.png 🖼️</span><span>En traitement...</span></div>
              </div>
            </section>
          </div>
        )}
      </article>
      <ViewerMetadata item={item} />
    </section>
  );
}

function SpreadsheetDetailViewer({ item }: { item: KnowledgeItem }) {
  const [tab, setTab] = useState("data");
  return (
    <section className="viewer-grid">
      <article className="viewer-main service-panel">
        <ViewerHeader title={item.title} type="spreadsheet" onRun={(action) => callViewerAction(item.id, action)} />
        <ViewerTabs tabs={viewerTabsByType.spreadsheet} active={tab} onChange={setTab} />
        {tab === "automation" ? <AutomationPanel sourceId={item.id} /> : (
          <div className="viewer-document">
            <section className="service-panel subtle-panel">
              <h2>Données CSV</h2>
              <p className="service-muted">{structuredDataLabels.join(" · ")}</p>
            </section>
            <div className="structured-table">
              <div data-header="true"><span>Colonne</span><span>Valeur</span><span>Statut</span></div>
              <div><span>Sources</span><span>42</span><span>Terminé</span></div>
              <div><span>Embeddings</span><span>local</span><span>Prêt</span></div>
            </div>
          </div>
        )}
      </article>
      <ViewerMetadata item={item} />
    </section>
  );
}

function ViewerHeader({ title, type, onRun }: { title: string; type: string; onRun: (action: string) => void | Promise<unknown> }) {
  return (
    <div className="viewer-title-row">
      <div>
        <span className="service-badge">{type}</span>
        <h2>{title}</h2>
      </div>
      <div className="viewer-actions">
        {["Zoom out", "Zoom in", "Copier le texte", "Ouvrir la source", "Telecharger"].map((action) => (
          <button key={action} type="button" onClick={() => void onRun(action)}>{action}</button>
        ))}
      </div>
    </div>
  );
}

function ViewerTabs({ tabs, active, onChange }: { tabs: Array<{ id: string; label: string }>; active: string; onChange: (id: string) => void }) {
  return (
    <div className="viewer-tabs">
      {tabs.map((tab) => (
        <button key={tab.id} type="button" data-active={active === tab.id} onClick={() => onChange(tab.id)}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ViewerMetadata({ item }: { item: KnowledgeItem }) {
  return (
    <aside className="service-panel viewer-side">
      <h2>Metadonnees</h2>
      <div className="service-list">
        <div className="service-row"><span>Statut</span><span className="service-badge ok">{item.status}</span></div>
        <div className="service-row"><span>Mis a jour</span><span>{item.updatedAt}</span></div>
        <div className="service-row"><span>Citations</span><span>12 passages</span></div>
        <div className="service-row"><span>Projet</span><span>Bridge Template</span></div>
      </div>
      <div className="knowledge-tags">
        {item.tags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
    </aside>
  );
}

function tabLabel(tab: string) {
  if (tab === "ocr") return "Texte OCR";
  if (tab === "data") return "Donnees";
  if (tab === "preview") return "Apercu";
  if (tab === "content") return "Contenu";
  return "Document";
}

function callViewerAction(sourceId: string, action: string) {
  return callBridgeAction("knowledge_ai.viewer.action", {
    resourceId: sourceId,
    payload: { action },
  });
}
