"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { dashboardFilterLabels, knowledgeCardActions, knowledgeFilters, knowledgeItems, type KnowledgeItem } from "@/data/feature-catalog";
import { KnowledgeManagementModals, type KnowledgeModalKind } from "@/components/KnowledgeManagementModals";
import { callBridgeAction } from "@/lib/bridge-actions";
import { ServiceIcon } from "@/components/ServiceIcon";

export function KnowledgeBrowser() {
  const [filter, setFilter] = useState("Tous");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [status, setStatus] = useState("Pret");
  const [modalItem, setModalItem] = useState<KnowledgeItem | null>(null);
  const [modalKind, setModalKind] = useState<KnowledgeModalKind>(null);
  const visible = useMemo(() => {
    if (filter === "Tous") return knowledgeItems;
    if (filter === "Groupes") return knowledgeItems.filter((item) => item.type === "group");
    if (filter === "Processing") return knowledgeItems.filter((item) => item.status === "processing" || item.status === "pending");
    if (filter === "Tableur") return knowledgeItems.filter((item) => item.type === "spreadsheet" || item.type === "google_sheets");
    if (filter === "X") return knowledgeItems.filter((item) => item.type === "twitter");
    return knowledgeItems.filter((item) => item.type.toLowerCase() === filter.toLowerCase());
  }, [filter]);

  async function runAction(action: string, item: KnowledgeItem) {
    if (action === "Modifier") return openModal("edit", item);
    if (action === "Associer à une autre connaissance") return openModal("associate", item);
    if (action === "Remplacer le fichier") return openModal("replace", item);
    if (action === "Historique des versions") return openModal("versions", item);
    setStatus(`${action} : ${item.title}`);
    const result = await callBridgeAction(knowledgeCardActionId(action), {
      resourceId: item.id,
      payload: { title: item.title, type: item.type },
    });
    setStatus(result.ok ? `${action} pret via Bridge` : result.error ?? "Bridge indisponible");
  }

  function openModal(kind: Exclude<KnowledgeModalKind, null>, item: KnowledgeItem) {
    setModalItem(item);
    setModalKind(kind);
  }

  return (
    <section className="knowledge-browser">
      <div className="service-grid">
        <article className="service-card">
          <span className="service-badge ok">231</span>
          <strong>Fichiers</strong>
          <span className="service-muted">Documents et medias indexes.</span>
        </article>
        <article className="service-card">
          <span className="service-badge">45</span>
          <strong>Liens</strong>
          <span className="service-muted">URLs et sources sociales.</span>
        </article>
        <article className="service-card">
          <span className="service-badge">2</span>
          <strong>Processing</strong>
          <span className="service-muted">Jobs locaux en cours.</span>
        </article>
      </div>

      <section className="service-panel">
        <div className="viewer-title-row">
          <div>
            <h2>Mes connaissances</h2>
            <p className="service-muted">Explorez et gérez votre base de connaissances.</p>
          </div>
          <div className="service-mini-stats compact-stats">
            <div><strong>{knowledgeItems.length}</strong><span>Total</span></div>
            <div><strong>{knowledgeItems.filter((item) => item.status === "completed").length}</strong><span>Prêts</span></div>
          </div>
        </div>
        <div className="knowledge-toolbar">
          <label className="service-search">
            <ServiceIcon name="search" size={15} />
            <input type="search" placeholder="Rechercher dans vos connaissances..." />
          </label>
          <label className="service-search compact-search">
            <ServiceIcon name="search" size={15} />
            <input type="search" placeholder="Rechercher..." />
          </label>
          <button type="button" onClick={() => setStatus("Types de contenu")}>
            <ServiceIcon name="settings" size={14} />
            Types
          </button>
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            {knowledgeFilters.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select aria-label="Statut">
            <option>Tous les statuts</option>
            <option>Terminé</option>
            <option>En cours</option>
            <option>En attente</option>
            <option>Erreur</option>
          </select>
          <select aria-label="Tri">
            <option>Plus récent</option>
            <option>Plus ancien</option>
            <option>Titre A-Z</option>
            <option>Nom A-Z</option>
            <option>Type</option>
            <option>Statut</option>
            <option>Taille</option>
          </select>
          <div className="chat-mode-row">
            <button type="button" aria-label="Vue grille" data-active={view === "grid"} onClick={() => setView("grid")}>Grille</button>
            <button type="button" aria-label="Vue liste" data-active={view === "list"} onClick={() => setView("list")}>Liste</button>
          </div>
        </div>
        <div className="active-filter-row">
          <span>Filtres actifs:</span>
          <span className="service-badge">Document</span>
          <span className="service-badge">Données CSV</span>
          <button type="button" onClick={() => setFilter("Tous")}>Tout effacer</button>
        </div>
        <div className="filter-chip-row">
          {dashboardFilterLabels.slice(8, 18).map((label) => (
            <button key={label} type="button" onClick={() => setStatus(label)}>{label}</button>
          ))}
        </div>
        <div className={view === "grid" ? "knowledge-grid" : "knowledge-list"}>
          {visible.map((item) => (
            <article className="knowledge-card" key={item.id}>
              <div className="knowledge-card-head">
                <span className="upload-icon"><ServiceIcon name={item.type === "group" ? "dashboard" : "file"} /></span>
                <span className={`service-badge ${item.status === "completed" ? "ok" : ""}`}>{item.status}</span>
              </div>
              <strong>{item.title}</strong>
              {item.itemCount ? <small className="service-muted">{item.itemCount} éléments • Modifié {item.updatedAt}</small> : <small className="service-muted">1 éléments</small>}
              <p className="service-muted">{item.summary}</p>
              <div className="knowledge-tags">
                {item.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <div className="knowledge-actions">
                <button type="button" onClick={() => void runAction("chat", item)}>Chat</button>
                <Link href={item.type === "group" ? `/groups/${item.id}` : `/knowledge/${item.id}`}>Voir</Link>
                {knowledgeCardActions.map((action) => (
                  <button key={action} type="button" onClick={() => void runAction(action, item)}>{action}</button>
                ))}
              </div>
            </article>
          ))}
        </div>
        {visible.length === 0 ? (
          <section className="service-panel subtle-panel">
            <h2>Aucune connaissance</h2>
            <button type="button" onClick={() => setFilter("Tous")}>Effacer les filtres</button>
          </section>
        ) : null}
        <section className="processing-strip">
          <article>
            <span className="service-badge">En cours...</span>
            <strong>Extraction locale</strong>
            <p>2-3 min · Texte complet, tags sémantiques (IA locale) et citations.</p>
          </article>
          <article>
            <span className="service-badge">En attente</span>
            <strong>ProcessingCard</strong>
            <p>Chargement des connaissances... puis Terminé quand le job Bridge répond.</p>
          </article>
        </section>
        <p className="service-muted" style={{ margin: 0 }}>{status}</p>
      </section>
      <KnowledgeManagementModals
        item={modalItem}
        kind={modalKind}
        onClose={() => setModalKind(null)}
        onStatus={setStatus}
      />
    </section>
  );
}

function knowledgeCardActionId(action: string) {
  if (action === "chat") return "knowledge_ai.conversation.context.set";
  if (action === "Supprimer") return "knowledge_ai.knowledge.delete";
  if (action === "Dupliquer") return "knowledge_ai.knowledge.update";
  if (action === "Partager" || action === "Copier le lien") return "knowledge_ai.viewer.action";
  return "knowledge_ai.knowledge.get";
}
