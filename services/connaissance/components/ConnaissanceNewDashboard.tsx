"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { callBridgeAction } from "@/lib/bridge-actions";

type ViewMode = "grid" | "list";
type DashboardViewMode = "list" | "graph";
type ScopeMode = "personal" | "company";
type ProcessingStatus = "completed" | "processing" | "pending" | "error";
type KnowledgeType = "document" | "video" | "audio" | "note" | "web_page" | "youtube" | "linkedin" | "twitter" | "csv" | "spreadsheet" | "pdf" | "image" | "email";

interface KnowledgeItem {
  id: string;
  title: string;
  summary: string;
  dataType: KnowledgeType;
  processingStatus: ProcessingStatus;
  createdAt: string;
  updatedAt?: string;
  ontologyCategory?: string;
  tags?: string[];
  semanticTags?: string[];
  isPrivate?: boolean;
  groupId?: string;
  groupTitle?: string;
  itemCount?: number;
}

interface Filters {
  search: string;
  types: KnowledgeType[];
  status: ProcessingStatus | null;
  sort: "recent" | "oldest" | "title" | "size";
  viewMode: ViewMode;
}

interface ConnaissanceNewDashboardProps {
  initialKnowledgeId?: string;
  standaloneDetail?: boolean;
}

const typeOptions: Array<{ value: KnowledgeType; label: string; color: string }> = [
  { value: "document", label: "Document", color: "#3B82F6" },
  { value: "video", label: "Vidéo", color: "#EC4899" },
  { value: "audio", label: "Audio", color: "#F59E0B" },
  { value: "note", label: "Note", color: "#10B981" },
  { value: "web_page", label: "Page web", color: "#6366F1" },
  { value: "youtube", label: "YouTube", color: "#EF4444" },
  { value: "linkedin", label: "LinkedIn", color: "#0077B5" },
  { value: "twitter", label: "X", color: "#000000" },
  { value: "csv", label: "Données CSV", color: "#22C55E" },
  { value: "spreadsheet", label: "Tableur Excel", color: "#22C55E" },
  { value: "pdf", label: "PDF", color: "#EF4444" },
  { value: "image", label: "Image", color: "#8B5CF6" },
  { value: "email", label: "Email", color: "#EA580C" },
];

const knowledges: KnowledgeItem[] = [
  {
    id: "group-procedures",
    title: "Procédures internes",
    summary: "3 fichiers dans ce groupe",
    dataType: "document",
    processingStatus: "completed",
    createdAt: "2026-06-14",
    updatedAt: "2026-06-14",
    ontologyCategory: "Organisation",
    tags: ["process", "interne"],
    semanticTags: ["onboarding", "securite"],
    groupId: "group-procedures",
    groupTitle: "Procédures internes",
    itemCount: 3,
  },
  {
    id: "source-energy-report",
    title: "Rapport operations Q2",
    summary: "Synthèse des indicateurs, dépenses et points d'attention opérationnels.",
    dataType: "pdf",
    processingStatus: "completed",
    createdAt: "2026-06-13",
    updatedAt: "2026-06-14",
    ontologyCategory: "Finance",
    tags: ["operations", "q2"],
    semanticTags: ["budget", "energie"],
  },
  {
    id: "source-demo-video",
    title: "Démonstration terrain",
    summary: "Vidéo importée pour transcription, tags et citations locales.",
    dataType: "video",
    processingStatus: "processing",
    createdAt: "2026-06-14",
    updatedAt: "2026-06-14",
    tags: ["terrain"],
  },
  {
    id: "source-video-audit",
    title: "Audit vidéo installation",
    summary: "Analyse vidéo avec étapes, expertise, ressources et timeline locale.",
    dataType: "video",
    processingStatus: "completed",
    createdAt: "2026-06-11",
    updatedAt: "2026-06-14",
    ontologyCategory: "Terrain",
    tags: ["video", "audit"],
    semanticTags: ["timeline", "maintenance"],
  },
  {
    id: "source-audio-comite",
    title: "Compte-rendu audio comité",
    summary: "Réunion transcrite avec besoins client, tâches et points en suspens.",
    dataType: "audio",
    processingStatus: "completed",
    createdAt: "2026-06-10",
    updatedAt: "2026-06-14",
    ontologyCategory: "Réunion",
    tags: ["audio", "comite"],
    semanticTags: ["besoins", "taches"],
  },
  {
    id: "source-linkedin-post",
    title: "Post LinkedIn stratégie locale",
    summary: "Publication sociale structurée avec auteur, contenu, tags et engagement.",
    dataType: "linkedin",
    processingStatus: "completed",
    createdAt: "2026-06-09",
    updatedAt: "2026-06-14",
    ontologyCategory: "Veille",
    tags: ["linkedin", "energie"],
    semanticTags: ["strategie", "communication"],
  },
  {
    id: "source-email-thread",
    title: "Thread email cadrage client",
    summary: "Conversation client avec résumé IA local, participants et pièces jointes.",
    dataType: "email",
    processingStatus: "completed",
    createdAt: "2026-06-08",
    updatedAt: "2026-06-14",
    ontologyCategory: "Client",
    tags: ["email", "cadrage"],
    semanticTags: ["client", "suivi"],
  },
  {
    id: "source-customer-notes",
    title: "Notes réunion client",
    summary: "Points de décision, questions ouvertes et tâches associées.",
    dataType: "note",
    processingStatus: "completed",
    createdAt: "2026-06-12",
    updatedAt: "2026-06-13",
    ontologyCategory: "Client",
    tags: ["client", "decision"],
    semanticTags: ["action", "suivi"],
  },
  {
    id: "source-data-sheet",
    title: "Suivi production",
    summary: "Données tableur importées pour analyse structurée.",
    dataType: "spreadsheet",
    processingStatus: "completed",
    createdAt: "2026-06-14",
    updatedAt: "2026-06-14",
    ontologyCategory: "Données",
    tags: ["production"],
    semanticTags: ["tableur", "synchronisation"],
  },
];

export function ConnaissanceNewDashboard({ initialKnowledgeId, standaloneDetail = false }: ConnaissanceNewDashboardProps = {}) {
  const initialModal = useMemo(() => {
    if (!initialKnowledgeId) return null;
    const item = knowledges.find((entry) => entry.id === initialKnowledgeId);
    return item ? { kind: "Voir", item } : null;
  }, [initialKnowledgeId]);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    types: [],
    status: null,
    sort: "recent",
    viewMode: "grid",
  });
  const [scopeMode, setScopeMode] = useState<ScopeMode>("personal");
  const [dashboardViewMode, setDashboardViewMode] = useState<DashboardViewMode>("list");
  const [typeOpen, setTypeOpen] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [modal, setModal] = useState<{ kind: string; item: KnowledgeItem } | null>(initialModal);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(null), 1800);
    return () => window.clearTimeout(timer);
  }, [status]);

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return knowledges
      .filter((item) => !search || item.title.toLowerCase().includes(search) || item.summary.toLowerCase().includes(search))
      .filter((item) => filters.types.length === 0 || filters.types.includes(item.dataType))
      .filter((item) => !filters.status || item.processingStatus === filters.status)
      .sort((a, b) => {
        if (filters.sort === "title") return a.title.localeCompare(b.title);
        if (filters.sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [filters]);

  async function runAction(id: string, input: Record<string, unknown> = {}) {
    const result = await callBridgeAction(id, input);
    setStatus(result.ok ? "Action Bridge acceptée" : result.error ?? "Action Bridge indisponible");
    return result;
  }

  function updateFilters(next: Partial<Filters>) {
    const merged = { ...filters, ...next };
    setFilters(merged);
    void runAction("knowledge_ai.knowledge.filter.set", {
      payload: {
        search: merged.search,
        types: merged.types,
        status: merged.status,
        sort: merged.sort,
        viewMode: merged.viewMode,
      },
    });
  }

  function updateScopeMode(next: ScopeMode) {
    setScopeMode(next);
    void runAction("knowledge_ai.knowledge.scope.set", {
      payload: {
        scopeMode: next,
      },
    });
  }

  function updateDashboardViewMode(next: DashboardViewMode) {
    setDashboardViewMode(next);
    void runAction("knowledge_ai.knowledge.filter.set", {
      payload: {
        dashboardViewMode: next,
        search: filters.search,
        types: filters.types,
        status: filters.status,
        sort: filters.sort,
      },
    });
  }

  function toggleType(type: KnowledgeType) {
    updateFilters({
      types: filters.types.includes(type) ? filters.types.filter((value) => value !== type) : [...filters.types, type],
    });
    setTypeOpen(false);
  }

  function runItemAction(action: string, item: KnowledgeItem) {
    setActionMenu(null);
    if (
      action === "Voir" ||
      action === "Modifier" ||
      action === "Associer à une autre connaissance" ||
      action === "Remplacer le fichier" ||
      action === "Historique des versions"
    ) {
      setModal({ kind: action, item });
      return;
    }

    const id =
      action === "Chat" || action === "Interroger"
        ? "knowledge_ai.conversation.context.set"
        : action === "Supprimer"
          ? "knowledge_ai.knowledge.delete"
          : action === "Partager" || action === "Copier le lien" || action === "Télécharger"
            ? "knowledge_ai.viewer.action"
            : "knowledge_ai.knowledge.get";

    void runAction(id, { resourceId: item.id, payload: { action, title: item.title, type: item.dataType } });
  }

  function closeModal() {
    if (standaloneDetail) {
      window.location.href = "/dashboard";
      return;
    }
    setModal(null);
  }

  return (
    <div className="knowledge-source-app">
      <aside className="knowledge-source-sidebar">
        <div className="knowledge-source-logo">
          <span>C</span>
          <strong>Connaissance</strong>
        </div>

        <div className="knowledge-source-mode-switch" role="group" aria-label="Mode">
          <a className="active" href="/chat">
            <ChatIcon />
            <span>Chat</span>
          </a>
          <a href="/dashboard">
            <DatabaseIcon />
            <span>Admin</span>
          </a>
        </div>

        <nav className="knowledge-source-nav" aria-label="Navigation principale">
          <a href="/chat">
            <ChatIcon />
            <span>Chat</span>
          </a>
          <a href="/upload">
            <PlusIcon />
            <span>Ajouter</span>
          </a>
          <a className="active" href="/dashboard">
            <RefreshIcon />
            <span>Connaissances</span>
          </a>
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

      <main className="knowledge-source-main knowledge-source-dashboard-main">
        <section className="knowledge-v2-dashboard">
            <header className="knowledge-v2-dashboard-head">
              <div className="knowledge-v2-dashboard-title-row">
                <h1>Connaissances</h1>
                <div className="knowledge-v2-dashboard-toggle-row">
                  <div className="knowledge-v2-dashboard-segmented" aria-label="Périmètre">
                    <button className={scopeMode === "personal" ? "active" : ""} onClick={() => updateScopeMode("personal")}>
                      Personnel
                    </button>
                    <button className={scopeMode === "company" ? "active" : ""} onClick={() => updateScopeMode("company")}>
                      Entreprise
                    </button>
                  </div>
                  <div className="knowledge-v2-dashboard-segmented" aria-label="Vue">
                    <button className={dashboardViewMode === "list" ? "active" : ""} onClick={() => updateDashboardViewMode("list")}>
                      <ListIconSmall />
                      <span>Vue liste</span>
                    </button>
                    <button className={dashboardViewMode === "graph" ? "active" : ""} onClick={() => updateDashboardViewMode("graph")}>
                      <NetworkIcon />
                      <span>Vue graph</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="knowledge-v2-dashboard-source-stats" aria-label="Statistiques">
                <StatDot value={knowledges.length} label="total" tone="gold" />
                <StatDot value={knowledges.filter((item) => item.processingStatus === "completed").length} label="pret" tone="green" />
                <StatDot value={knowledges.filter((item) => item.processingStatus === "processing" || item.processingStatus === "pending").length} label="en cours" tone="blue" />
              </div>
            </header>

            {dashboardViewMode === "list" ? (
            <div className="knowledge-v2-knowledge-browser">
              <div className="knowledge-v2-filter-bar">
                <div className="knowledge-v2-filter-search">
                  <SearchIcon />
                  <input
                    value={filters.search}
                    onChange={(event) => updateFilters({ search: event.target.value })}
                    placeholder="Rechercher..."
                  />
                </div>
                <div className="knowledge-v2-view-toggle">
                  <button onClick={() => updateFilters({ viewMode: "grid" })} className={filters.viewMode === "grid" ? "active" : ""} aria-label="Vue grille">
                    <GridIcon />
                  </button>
                  <button onClick={() => updateFilters({ viewMode: "list" })} className={filters.viewMode === "list" ? "active" : ""} aria-label="Vue liste">
                    <ListIcon />
                  </button>
                </div>
              </div>

              <div className="knowledge-v2-filter-row">
                <div className="knowledge-v2-type-filter">
                  <button className={filters.types.length > 0 ? "active" : ""} onClick={() => setTypeOpen((value) => !value)}>
                    <FilterIcon />
                    <span>Types</span>
                    {filters.types.length > 0 && <strong>{filters.types.length}</strong>}
                    <ChevronDownIcon />
                  </button>
                  {typeOpen && (
                    <>
                      <button className="knowledge-v2-popover-backdrop" aria-label="Fermer les types" onClick={() => setTypeOpen(false)} />
                      <div className="knowledge-v2-type-menu">
                        <div>
                          <span>Types de contenu</span>
                          {filters.types.length > 0 && <button onClick={() => updateFilters({ types: [] })}>Effacer</button>}
                        </div>
                        {typeOptions.map((type) => (
                          <button key={type.value} onClick={() => toggleType(type.value)} className={filters.types.includes(type.value) ? "active" : ""}>
                            <span style={{ backgroundColor: `${type.color}15` }}>
                              <i style={{ backgroundColor: type.color }} />
                            </span>
                            <em>{type.label}</em>
                            {filters.types.includes(type.value) && <CheckIcon />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <select value={filters.status ?? "all"} onChange={(event) => updateFilters({ status: event.target.value === "all" ? null : (event.target.value as ProcessingStatus) })}>
                  <option value="all">Tous les statuts</option>
                  <option value="completed">Terminé</option>
                  <option value="processing">En cours</option>
                  <option value="pending">En attente</option>
                  <option value="error">Erreur</option>
                </select>
                <select value={filters.sort} onChange={(event) => updateFilters({ sort: event.target.value as Filters["sort"] })}>
                  <option value="recent">Plus récent</option>
                  <option value="oldest">Plus ancien</option>
                  <option value="title">Titre A-Z</option>
                  <option value="size">Taille</option>
                </select>
                <span className="knowledge-v2-result-count">
                  {filtered.length !== knowledges.length ? `${filtered.length} sur ${knowledges.length}` : knowledges.length} connaissances
                </span>
              </div>

              {filters.types.length > 0 && (
                <div className="knowledge-v2-active-filters">
                  <span>Filtres actifs:</span>
                  {filters.types.map((type) => {
                    const config = typeOptions.find((option) => option.value === type);
                    return (
                      <button key={type} style={{ backgroundColor: `${config?.color}15`, color: config?.color }} onClick={() => toggleType(type)}>
                        {config?.label}
                        <CloseIcon />
                      </button>
                    );
                  })}
                  <button onClick={() => updateFilters({ types: [] })}>Tout effacer</button>
                </div>
              )}

              <div className="knowledge-v2-dashboard-scroll">
                {filtered.length === 0 ? (
                  <EmptyKnowledgeState hasFilters={!!filters.search || filters.types.length > 0 || !!filters.status} onClear={() => updateFilters({ search: "", types: [], status: null })} />
                ) : filters.viewMode === "grid" ? (
                  <div className="knowledge-v2-source-grid">
                    {filtered.map((item) =>
                      item.processingStatus === "processing" || item.processingStatus === "pending" ? (
                        <ProcessingCard key={item.id} item={item} onDelete={() => runItemAction("Supprimer", item)} />
                      ) : (
                        <KnowledgeCard key={item.id} item={item} actionMenu={actionMenu} onActionMenu={setActionMenu} onAction={runItemAction} />
                      ),
                    )}
                  </div>
                ) : (
                  <div className="knowledge-v2-source-list">
                    {filtered.map((item) =>
                      item.processingStatus === "processing" || item.processingStatus === "pending" ? (
                        <ProcessingCard key={item.id} item={item} onDelete={() => runItemAction("Supprimer", item)} compact />
                      ) : (
                        <KnowledgeCard key={item.id} item={item} actionMenu={actionMenu} onActionMenu={setActionMenu} onAction={runItemAction} compact />
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
            ) : (
              <KnowledgeGraphPlaceholder knowledges={filtered} scopeMode={scopeMode} onOpenKnowledge={(item) => runItemAction("Voir", item)} />
            )}

            {status && (
              <div className="knowledge-v2-toast">
                <ErrorIcon />
                <p>{status}</p>
                <button onClick={() => setStatus(null)} aria-label="Fermer">
                  <CloseIcon />
                </button>
              </div>
            )}
          </section>
      </main>

      {modal && <DashboardModal modal={modal} onClose={closeModal} onAction={runAction} />}
    </div>
  );
}

function StatDot({ value, label, tone }: { value: number; label: string; tone: "gold" | "green" | "blue" }) {
  return (
    <div className="knowledge-v2-dashboard-stat-dot">
      <span className={tone} />
      <em>{value} {label}</em>
    </div>
  );
}

function KnowledgeGraphPlaceholder({
  knowledges: items,
  scopeMode,
  onOpenKnowledge,
}: {
  knowledges: KnowledgeItem[];
  scopeMode: ScopeMode;
  onOpenKnowledge: (item: KnowledgeItem) => void;
}) {
  return (
    <div className="knowledge-v2-graph-shell">
      <section className="knowledge-v2-graph-card" aria-label="Vue graph">
        <div className="knowledge-v2-graph-network" aria-hidden="true">
          {items.slice(0, 6).map((item, index) => (
            <button
              key={item.id}
              className={`knowledge-v2-graph-node node-${index}`}
              onClick={() => onOpenKnowledge(item)}
              style={{ ["--node-color" as string]: typeConfig(item.dataType).color }}
              aria-label={`Ouvrir ${item.title}`}
            >
              <TypeIcon type={item.dataType} />
            </button>
          ))}
          <span className="knowledge-v2-graph-edge edge-0" />
          <span className="knowledge-v2-graph-edge edge-1" />
          <span className="knowledge-v2-graph-edge edge-2" />
          <span className="knowledge-v2-graph-edge edge-3" />
        </div>
        <div className="knowledge-v2-graph-caption">
          <NetworkIcon />
          <div>
            <strong>Vue graph</strong>
            <span>{scopeMode === "personal" ? "Connaissances personnelles" : "Connaissances entreprise"}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function KnowledgeCard({
  item,
  compact,
  actionMenu,
  onActionMenu,
  onAction,
}: {
  item: KnowledgeItem;
  compact?: boolean;
  actionMenu: string | null;
  onActionMenu: (id: string | null) => void;
  onAction: (action: string, item: KnowledgeItem) => void;
}) {
  const config = typeConfig(item.dataType);
  const isOpen = actionMenu === item.id;
  const title = item.groupTitle ?? item.title;

  return (
    <article className={`knowledge-v2-source-card ${compact ? "compact" : ""}`}>
      <button className="knowledge-v2-source-card-main" onClick={() => onAction("Voir", item)}>
        <span className="knowledge-v2-source-icon" style={{ background: item.itemCount ? "linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(217, 119, 6, 0.15))" : `${config.color}20`, color: item.itemCount ? "#EAB308" : config.color }}>
          {item.itemCount ? <FolderIcon /> : <TypeIcon type={item.dataType} />}
        </span>
        <div>
          <div>
            <h3>{title}</h3>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onActionMenu(isOpen ? null : item.id);
              }}
              aria-label="Options"
            >
              <MoreIcon />
            </button>
          </div>
          <p>{item.itemCount && item.itemCount > 1 ? `${item.itemCount} fichiers dans ce groupe` : item.summary}</p>
          {!compact && <hr />}
          <div className="knowledge-v2-source-meta">
            <span>
              <CalendarIcon />
              {formatDate(item.createdAt)}
            </span>
            <span>
              <TypeIcon type={item.dataType} />
              {item.itemCount && item.itemCount > 1 ? `${item.itemCount} fichiers` : "1 document"}
            </span>
          </div>
          {item.ontologyCategory && <span className="knowledge-v2-ontology"><TreeIcon />{item.ontologyCategory}</span>}
        </div>
      </button>
      {!compact && (
        <div className="knowledge-v2-source-card-actions">
          <button type="button" onClick={() => onAction("Interroger", item)}>
            <ChatIcon />
            <span>Interroger</span>
          </button>
          <button type="button" onClick={() => onAction("Copier le lien", item)}>
            <LinkIcon />
            <span>Copier le lien</span>
          </button>
        </div>
      )}
      {isOpen && (
        <>
          <button className="knowledge-v2-popover-backdrop" aria-label="Fermer le menu" onClick={() => onActionMenu(null)} />
          <div className="knowledge-v2-card-menu">
            {["Voir", "Modifier", "Associer à une autre connaissance", "Remplacer le fichier", "Historique des versions", "Chat", "Partager", "Télécharger", "Supprimer"].map((action) => (
              <button key={action} onClick={() => onAction(action, item)}>
                <span>{menuIcon(action)}</span>
                <em>{action}</em>
              </button>
            ))}
          </div>
        </>
      )}
    </article>
  );
}

function ProcessingCard({ item, onDelete, compact }: { item: KnowledgeItem; onDelete: () => void; compact?: boolean }) {
  const config = typeConfig(item.dataType);
  return (
    <article className={`knowledge-v2-processing-card ${compact ? "compact" : ""}`}>
      <div>
        <span style={{ backgroundColor: `${config.color}18`, color: config.color }}>
          <TypeIcon type={item.dataType} />
        </span>
        <div>
          <h3>{item.title || "Nouveau contenu"}</h3>
          <small>{item.processingStatus === "pending" ? "Préparation de l'analyse" : "Analyse IA en cours"}</small>
        </div>
        <button onClick={onDelete} aria-label="Supprimer">
          <MoreIcon />
        </button>
      </div>
      {!compact && (
        <>
          <hr />
          <p>Texte complet, tags sémantiques et citations locales.</p>
          <div className="knowledge-v2-processing-progress">
            <span />
          </div>
        </>
      )}
    </article>
  );
}

function EmptyKnowledgeState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <section className="knowledge-v2-empty-knowledge">
      <FileTextIcon />
      <h2>{hasFilters ? "Aucun résultat pour ces filtres" : "Vous n'avez pas encore de connaissances. Ajoutez du contenu pour commencer."}</h2>
      {hasFilters && <button onClick={onClear}>Effacer les filtres</button>}
    </section>
  );
}

function DashboardModal({
  modal,
  onClose,
  onAction,
}: {
  modal: { kind: string; item: KnowledgeItem };
  onClose: () => void;
  onAction: (id: string, input?: Record<string, unknown>) => Promise<unknown>;
}) {
  const [activeTab, setActiveTab] = useState(getDetailTabs(modal.item)[0]);
  const [editTitle, setEditTitle] = useState(modal.item.title);
  const [editSummary, setEditSummary] = useState(modal.item.summary);
  const [editTags, setEditTags] = useState<string[]>(modal.item.tags ?? (modal.item.ontologyCategory ? [modal.item.ontologyCategory] : []));
  const [newTag, setNewTag] = useState("");
  const [isPrivate, setIsPrivate] = useState(modal.item.isPrivate ?? false);
  const [showDiff, setShowDiff] = useState(false);
  const [associateSearch, setAssociateSearch] = useState("");
  const [associateTarget, setAssociateTarget] = useState<KnowledgeItem | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [replaceReason, setReplaceReason] = useState("");
  const title = modal.kind === "Voir" && modal.item.itemCount ? modal.item.groupTitle ?? modal.item.title : modal.kind;
  const isGroupViewer = modal.kind === "Voir" && !!modal.item.itemCount;
  const isDetailViewer = modal.kind === "Voir" && !modal.item.itemCount;
  const isEditor = modal.kind === "Modifier";
  const isAssociate = modal.kind === "Associer à une autre connaissance";
  const isReplace = modal.kind === "Remplacer le fichier";
  const isVersions = modal.kind === "Historique des versions";

  function submit(actionId: string, payload: Record<string, unknown> = {}) {
    void onAction(actionId, { resourceId: modal.item.id, payload: { title: modal.item.title, type: modal.item.dataType, ...payload } });
    onClose();
  }

  const relatedItems = knowledges.filter((item) => item.id !== modal.item.id).slice(0, 4);
  const pendingChanges = [
    editTitle !== modal.item.title ? { label: "Titre", oldValue: modal.item.title, newValue: editTitle } : null,
    editSummary !== modal.item.summary ? { label: "Résumé", oldValue: modal.item.summary, newValue: editSummary } : null,
    editTags.join(",") !== (modal.item.tags ?? (modal.item.ontologyCategory ? [modal.item.ontologyCategory] : [])).join(",")
      ? { label: "Tags", oldValue: (modal.item.tags ?? []).join(", "), newValue: editTags.join(", ") }
      : null,
    isPrivate !== (modal.item.isPrivate ?? false) ? { label: "Visibilité", oldValue: modal.item.isPrivate ? "Privé" : "Partagé", newValue: isPrivate ? "Privé" : "Partagé" } : null,
  ].filter(Boolean) as Array<{ label: string; oldValue: string; newValue: string }>;

  function addTag() {
    const trimmed = newTag.trim();
    if (!trimmed || editTags.includes(trimmed)) return;
    setEditTags((value) => [...value, trimmed]);
    setNewTag("");
  }

  function saveEditor() {
    if (pendingChanges.length > 2 && !showDiff) {
      setShowDiff(true);
      return;
    }
    submit("knowledge_ai.knowledge.update", {
      updates: { title: editTitle, summary: editSummary, tags: editTags, isPrivate },
      changes: pendingChanges,
      reason: `Edition via interface web - ${pendingChanges.length} modification(s)`,
    });
  }

  return (
    <div className="knowledge-v2-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="knowledge-v2-source-modal-panel source-like">
        {isGroupViewer && (
          <>
            <button className="knowledge-v2-source-close" onClick={onClose} aria-label="Fermer"><CloseIcon /></button>
            <div className="knowledge-v2-group-hero">
              <div><FolderIcon /></div>
              <h2>{modal.item.groupTitle ?? modal.item.title}</h2>
              <p>{modal.item.summary}</p>
              <div className="knowledge-v2-modal-chips centered">
                <span><FileTextIcon />{modal.item.itemCount} fichiers</span>
                <span><CalendarIcon />{formatLongDate(modal.item.createdAt)}</span>
              </div>
            </div>
            <div className="knowledge-v2-source-modal-body soft">
              {groupFiles(modal.item).map((file, index) => (
                <button className="knowledge-v2-knowledge-row" key={file.name} onClick={() => submit("knowledge_ai.knowledge.get", { fileName: file.name })}>
                  <span style={{ backgroundColor: `${typeConfig(file.type).color}18`, color: typeConfig(file.type).color }}>
                    <TypeIcon type={file.type} />
                  </span>
                  <div>
                    <strong>{file.name}</strong>
                    <small>{formatLongDate(index === 0 ? modal.item.createdAt : "2026-06-13")}</small>
                  </div>
                  <ChevronRightIcon />
                </button>
              ))}
            </div>
            <div className="knowledge-v2-source-modal-actions sticky">
              <button onClick={() => submit("knowledge_ai.viewer.action", { action: "copy-group-link" })}><LinkIcon />Copier le lien</button>
              <button onClick={() => submit("knowledge_ai.conversation.context.set", { groupId: modal.item.groupId })}><ChatIcon />Interroger</button>
            </div>
          </>
        )}

        {isDetailViewer && (
          <>
            <div className="knowledge-v2-modal-head source-head">
              <div className="knowledge-v2-modal-head-title">
                <span style={{ backgroundColor: `${typeConfig(modal.item.dataType).color}18`, color: typeConfig(modal.item.dataType).color }}><TypeIcon type={modal.item.dataType} /></span>
                <div>
                  <h2>{modal.item.title}</h2>
                  <p>{typeConfig(modal.item.dataType).label} · {formatLongDate(modal.item.createdAt)}</p>
                </div>
              </div>
              <button className="nav-icon-btn nav-icon-btn-small" onClick={onClose} aria-label="Fermer"><CloseIcon /></button>
            </div>
            <div className="knowledge-v2-source-modal-body viewer">
              <div className="knowledge-v2-modal-tabs ios">
                {getDetailTabs(modal.item).map((tab) => (
                <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => { setActiveTab(tab); void onAction("knowledge_ai.viewer.action", { resourceId: modal.item.id, payload: { tab } }); }}>
                  {tab}
                </button>
              ))}
              </div>
              <DetailTabContent item={modal.item} tab={activeTab} onAction={onAction} />
            </div>
          </>
        )}

        {isEditor && (
          <>
            <div className="knowledge-v2-modal-head source-head">
              <div className="knowledge-v2-modal-head-title">
                <span className="gold"><EditIcon /></span>
                <div>
                  <h2>Modifier la connaissance</h2>
                  <p>{pendingChanges.length} modification{pendingChanges.length > 1 ? "s" : ""}</p>
                </div>
              </div>
              <button className="nav-icon-btn nav-icon-btn-small" onClick={onClose} aria-label="Fermer"><CloseIcon /></button>
            </div>
            <div className="knowledge-v2-source-modal-body">
              {showDiff ? (
                <div className="knowledge-v2-diff-list">
                  <div className="knowledge-v2-section-title"><ErrorIcon />Récapitulatif des modifications</div>
                  {pendingChanges.map((change) => (
                    <div className="knowledge-v2-diff-row" key={change.label}>
                      <div><strong>{change.label}</strong><span>Modifié</span></div>
                      {change.oldValue && <p><em>-</em>{change.oldValue}</p>}
                      {change.newValue && <p><em>+</em>{change.newValue}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="knowledge-v2-section-title"><ErrorIcon />Informations générales</div>
                  <label className="knowledge-v2-field source-field"><span>Titre</span><input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} /></label>
                  <label className="knowledge-v2-field source-field"><span>Résumé</span><textarea rows={3} value={editSummary} onChange={(event) => setEditSummary(event.target.value)} /></label>
                  <div className="knowledge-v2-visibility-row">
                    <div><LockIcon /><span>{isPrivate ? "Privé (moi seul)" : "Partagé avec l'équipe"}</span></div>
                    <button className={isPrivate ? "active" : ""} onClick={() => setIsPrivate((value) => !value)}><span /></button>
                  </div>
                  <div className="knowledge-v2-section-title"><TreeIcon />Tags</div>
                  <div className="knowledge-v2-tag-editor">
                    {editTags.map((tag) => (
                      <button key={tag} onClick={() => setEditTags((value) => value.filter((item) => item !== tag))}>{tag}<CloseIcon /></button>
                    ))}
                    <label><input value={newTag} onChange={(event) => setNewTag(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} placeholder="Ajouter..." /><button type="button" onClick={addTag}><PlusIcon /></button></label>
                  </div>
                  {modal.item.semanticTags && (
                    <div className="knowledge-v2-semantic-tags">
                      <span>Tags sémantiques (IA locale)</span>
                      <div>{modal.item.semanticTags.map((tag) => <em key={tag}>{tag}</em>)}</div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="knowledge-v2-source-modal-actions sticky">
              <button onClick={() => showDiff ? setShowDiff(false) : onClose()}>{showDiff ? "Retour" : "Annuler"}</button>
              <button disabled={pendingChanges.length === 0} onClick={saveEditor}><SaveIcon />{showDiff ? "Confirmer" : "Enregistrer"}</button>
            </div>
          </>
        )}

        {isAssociate && (
          <>
            <div className="knowledge-v2-modal-head source-head">
              <div className="knowledge-v2-modal-head-title">
                <span className="gold"><LinkIcon /></span>
                <h2>Associer à...</h2>
              </div>
              <button className="nav-icon-btn nav-icon-btn-small" onClick={onClose} aria-label="Fermer"><CloseIcon /></button>
            </div>
            <div className="knowledge-v2-associate-search">
              <SearchIcon />
              <input value={associateSearch} onChange={(event) => setAssociateSearch(event.target.value)} placeholder="Rechercher une connaissance..." />
              {associateSearch && <button onClick={() => setAssociateSearch("")}><CloseIcon /></button>}
            </div>
            <div className="knowledge-v2-source-modal-body soft">
              {relatedItems
                .filter((item) => !associateSearch || `${item.title} ${item.summary}`.toLowerCase().includes(associateSearch.toLowerCase()))
                .map((item) => (
                  <button className="knowledge-v2-knowledge-row" key={item.id} onClick={() => modal.item.groupId ? setAssociateTarget(item) : submit("knowledge_ai.knowledge.associate", { targetId: item.id })}>
                    <span style={{ backgroundColor: `${typeConfig(item.dataType).color}18`, color: typeConfig(item.dataType).color }}><TypeIcon type={item.dataType} /></span>
                    <div><strong>{item.groupTitle ?? item.title}</strong><small>{typeConfig(item.dataType).label} · {formatLongDate(item.createdAt)}</small></div>
                    <ChevronRightIcon />
                  </button>
              ))}
            </div>
            {associateTarget && (
              <div className="knowledge-v2-confirm-layer">
                <div>
                  <h3>Quitter le groupe actuel ?</h3>
                  <p>Cette connaissance va quitter son groupe actuel pour rejoindre un nouveau groupe avec la connaissance sélectionnée.</p>
                  <div><button onClick={() => setAssociateTarget(null)}>Annuler</button><button onClick={() => submit("knowledge_ai.knowledge.associate", { targetId: associateTarget.id, leaveCurrentGroup: true })}>Continuer</button></div>
                </div>
              </div>
            )}
          </>
        )}

        {isReplace && (
          <>
            <div className="knowledge-v2-modal-head source-head">
              <div className="knowledge-v2-modal-head-title">
                <span className="gold"><RefreshIcon /></span>
                <h2>Remplacer le fichier</h2>
              </div>
              <button className="nav-icon-btn nav-icon-btn-small" onClick={onClose} aria-label="Fermer"><CloseIcon /></button>
            </div>
            <div className="knowledge-v2-source-modal-body">
              <div className="knowledge-v2-section-title">Fichier actuel</div>
              <div className="knowledge-v2-current-file source-current"><FileTextIcon /><div><strong>{modal.item.title}</strong><span>{typeConfig(modal.item.dataType).label}</span></div></div>
              <div className="knowledge-v2-section-title">Nouveau fichier</div>
              <label className={`knowledge-v2-drop-zone source-drop ${selectedFileName ? "selected" : ""}`}>
                {selectedFileName ? <CheckIcon /> : <UploadIcon />}
                <span>{selectedFileName || "Glissez-déposez un fichier ici"}</span>
                <small>{selectedFileName ? "Prêt à remplacer" : "ou cliquez pour parcourir"}</small>
                <input type="file" onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? "")} />
              </label>
              <button className="knowledge-v2-file-browser" onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: modal.item.id, payload: { action: "open-file-picker" } })}><FolderIcon />Choisir un fichier<span>{typeConfig(modal.item.dataType).label}</span></button>
              <label className="knowledge-v2-field source-field"><span>Raison du changement <em>(optionnel)</em></span><input value={replaceReason} onChange={(event) => setReplaceReason(event.target.value)} placeholder="Ex: Mise à jour version 2.0" /></label>
              <p className="knowledge-v2-muted-note">Visible dans l'historique des versions</p>
            </div>
            <div className="knowledge-v2-source-modal-actions sticky">
              <button onClick={onClose}>Annuler</button>
              <button disabled={!selectedFileName} onClick={() => submit("knowledge_ai.knowledge.replace_file", { fileName: selectedFileName, reason: replaceReason })}><RefreshIcon />Remplacer le fichier</button>
            </div>
          </>
        )}

        {isVersions && (
          <>
            <div className="knowledge-v2-modal-head source-head">
              <div className="knowledge-v2-modal-head-title">
                <span className="gold"><HistoryIcon /></span>
                <h2>Historique des versions</h2>
              </div>
              <button className="nav-icon-btn nav-icon-btn-small" onClick={onClose} aria-label="Fermer"><CloseIcon /></button>
            </div>
            <div className="knowledge-v2-source-modal-body">
              <div className="knowledge-v2-version-current">
                <span><CheckIcon />Version actuelle</span>
                <div><FileTextIcon /><div><strong>{modal.item.title}</strong><small>Modifié {formatRelativeDate(modal.item.updatedAt ?? modal.item.createdAt)}</small></div></div>
              </div>
              <div className="knowledge-v2-empty-version source-empty">
              <HistoryIcon />
              <strong>Aucune version précédente</strong>
              <p>L'historique des versions sera disponible après le premier remplacement de fichier.</p>
            </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DetailTabContent({ item, tab, onAction }: { item: KnowledgeItem; tab: string; onAction: (id: string, input?: Record<string, unknown>) => Promise<unknown> }) {
  if (item.dataType === "video" || item.dataType === "youtube") {
    return <VideoDetailTab item={item} tab={tab} onAction={onAction} />;
  }
  if (item.dataType === "audio") {
    return <AudioDetailTab item={item} tab={tab} onAction={onAction} />;
  }
  if (item.dataType === "linkedin" || item.dataType === "twitter") {
    return <SocialDetailTab item={item} tab={tab} onAction={onAction} />;
  }
  if (item.dataType === "email") {
    return <EmailDetailTab item={item} tab={tab} onAction={onAction} />;
  }
  if (tab === "Document" || tab === "Aperçu") {
    return (
      <div className="knowledge-v2-viewer-pane">
        <div className="knowledge-v2-viewer-toolbar">
          <button onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "zoom-out" } })}><ZoomOutIcon /></button>
          <span>100%</span>
          <button onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "zoom-in" } })}><ZoomInIcon /></button>
          <button onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "download" } })}><DownloadIcon />Télécharger</button>
        </div>
        <div className="knowledge-v2-viewer-placeholder"><FileTextIcon /><strong>Prévisualisation non disponible</strong><p>Le fichier sera rendu via le service Connaissance après connexion du stockage Supabase dédié.</p></div>
      </div>
    );
  }
  if (tab === "Données") {
    return <div className="knowledge-v2-viewer-pane"><div className="knowledge-v2-table-preview"><div><span>Colonne A</span><span>Colonne B</span><span>Colonne C</span></div><div><span>Production</span><span>Site 1</span><span>42</span></div><div><span>Maintenance</span><span>Site 2</span><span>17</span></div></div></div>;
  }
  if (tab === "Automatisation") {
    return <AutomationPreview item={item} onAction={onAction} source="detail-viewer" />;
  }
  if (tab === "Métadonnées") {
    return <div className="knowledge-v2-viewer-pane"><div className="knowledge-v2-metadata-list"><span>Type</span><strong>{typeConfig(item.dataType).label}</strong><span>Créé</span><strong>{formatLongDate(item.createdAt)}</strong><span>Catégorie</span><strong>{item.ontologyCategory ?? "Non classé"}</strong></div></div>;
  }
  return (
    <div className="knowledge-v2-viewer-pane">
      <div className="knowledge-v2-viewer-text">
        <button onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "copy-text" } })}><CopyIcon />Copier le texte</button>
        <article><h3>{item.title}</h3><p>{item.summary}</p><p>Les citations, tags sémantiques et extraits complets seront alimentés par le pipeline local-only du service Connaissance.</p></article>
      </div>
    </div>
  );
}

function getDetailTabs(item: KnowledgeItem) {
  if (item.dataType === "video" || item.dataType === "youtube") return ["Résumé", "Étapes", "Expertise", "Ressources", "Timeline", "Automatisation"];
  if (item.dataType === "audio") return ["Résumé", "Besoins", "Tâches", "Transcription", "Automatisation"];
  if (item.dataType === "email") return ["Conversation", "Résumé IA", "Automatisation"];
  if (item.dataType === "pdf") return ["Document", "Résumé", "Texte OCR", "Automatisation"];
  if (item.dataType === "image") return ["Aperçu", "Résumé", "Automatisation"];
  if (item.dataType === "spreadsheet" || item.dataType === "csv") return ["Données", "Résumé", "Automatisation"];
  if (item.dataType === "web_page" || item.dataType === "linkedin" || item.dataType === "twitter") return ["Contenu", "Automatisation"];
  return ["Contenu", "Résumé", "Automatisation"];
}

function VideoDetailTab({ item, tab, onAction }: { item: KnowledgeItem; tab: string; onAction: (id: string, input?: Record<string, unknown>) => Promise<unknown> }) {
  const timeline = [
    { time: "00:00", title: "Objectif", text: "Identifier les contrôles terrain à conserver dans le contexte projet." },
    { time: "02:14", title: "Inspection", text: "Lecture des risques, outillage et conditions d'intervention." },
    { time: "04:32", title: "Ressources", text: "Documents et procédures à rattacher à la base de connaissances." },
  ];
  if (tab === "Automatisation") return <AutomationPreview item={item} onAction={onAction} source="video" />;
  return (
    <div className="knowledge-v2-special-viewer">
      <div className="knowledge-v2-video-player">
        <div className="knowledge-v2-video-screen">
          <button onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "video-play-pause" } })} aria-label="Lecture vidéo">
            <PlayIcon />
          </button>
          <span>Lecteur vidéo local</span>
        </div>
        <div className="knowledge-v2-media-controls">
          <input aria-label="Timeline vidéo" type="range" min="0" max="292" defaultValue="76" onChange={(event) => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "seek-video", seconds: event.currentTarget.value } })} />
          <div><span>1:16</span><span>4:52</span></div>
          <div className="knowledge-v2-control-row">
            <button onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "skip-back", seconds: 10 } })}>-10s</button>
            <button className="primary" onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "play" } })}><PlayIcon />Lire</button>
            <button onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "skip-forward", seconds: 10 } })}>+10s</button>
          </div>
        </div>
      </div>
      {tab === "Résumé" && (
        <div className="knowledge-v2-insight-grid">
          <SourceLikeCard title="Objectif" tone="blue"><p>{item.summary}</p></SourceLikeCard>
          <SourceLikeCard title="Résultat" tone="green"><p>Les points critiques sont prêts à être cités dans le chat local-only.</p></SourceLikeCard>
          <SourceLikeCard title="Durée" tone="gold"><p>4 min 52 · transcription et chapitrage traités par le runtime local.</p></SourceLikeCard>
        </div>
      )}
      {tab === "Étapes" && (
        <div className="knowledge-v2-step-list">
          {["Préparer le périmètre", "Contrôler l'installation", "Valider les ressources", "Créer les actions de suivi"].map((step, index) => (
            <button key={step} onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "open-step", step } })}>
              <span>{index + 1}</span><div><strong>{step}</strong><small>Étape extraite depuis la vidéo et disponible pour citation.</small></div><ChevronRightIcon />
            </button>
          ))}
        </div>
      )}
      {tab === "Expertise" && (
        <div className="knowledge-v2-insight-grid">
          <SourceLikeCard title="Bonnes pratiques" tone="green"><p>Conserver l'ordre de contrôle, documenter chaque écart et relier la preuve au projet.</p></SourceLikeCard>
          <SourceLikeCard title="Points de vigilance" tone="red"><p>Ne pas automatiser une décision tant que la source vidéo n'est pas validée.</p></SourceLikeCard>
          <SourceLikeCard title="Dépannage" tone="blue"><p>Comparer la timeline vidéo avec les documents du groupe avant génération d'action.</p></SourceLikeCard>
        </div>
      )}
      {tab === "Ressources" && (
        <div className="knowledge-v2-resource-list">
          {["Checklist intervention.pdf", "Procédure sécurité", "Lien source vidéo"].map((resource) => (
            <button key={resource} onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "open-resource", resource } })}>
              <LinkIcon /><span>{resource}</span><ChevronRightIcon />
            </button>
          ))}
        </div>
      )}
      {tab === "Timeline" && (
        <div className="knowledge-v2-timeline-list">
          {timeline.map((entry) => (
            <button key={entry.time} onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "seek-video", timestamp: entry.time } })}>
              <span>{entry.time}</span><div><strong>{entry.title}</strong><p>{entry.text}</p></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AudioDetailTab({ item, tab, onAction }: { item: KnowledgeItem; tab: string; onAction: (id: string, input?: Record<string, unknown>) => Promise<unknown> }) {
  if (tab === "Automatisation") return <AutomationPreview item={item} onAction={onAction} source="audio" />;
  return (
    <div className="knowledge-v2-audio-viewer">
      <div className="knowledge-v2-audio-head">
        <div className="knowledge-v2-audio-mark"><AudioIcon /></div>
        <div><h3>{item.title}</h3><p>28 min · 4 intervenants · transcription locale</p></div>
      </div>
      <div className="knowledge-v2-audio-player">
        <input aria-label="Timeline audio" type="range" min="0" max="1680" defaultValue="420" onChange={(event) => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "seek-audio", seconds: event.currentTarget.value } })} />
        <div><span>7:00</span><span>28:00</span></div>
        <div className="knowledge-v2-control-row">
          <button onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "skip-back", seconds: 15 } })}>-15s</button>
          <button className="primary" onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "play-audio" } })}><PlayIcon />Lire</button>
          {[0.75, 1, 1.25, 1.5, 2].map((speed) => <button key={speed} onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "speed", speed } })}>{speed}x</button>)}
        </div>
      </div>
      {tab === "Résumé" && (
        <div className="knowledge-v2-insight-grid">
          <SourceLikeCard title="Notes de réunion" tone="gold"><p>{item.summary}</p></SourceLikeCard>
          <SourceLikeCard title="Participants" tone="blue"><p>Nicolas, équipe opérationnelle, client entreprise, responsable production.</p></SourceLikeCard>
          <SourceLikeCard title="Points en suspens" tone="red"><p>Validation du calendrier et rattachement des annexes au projet client.</p></SourceLikeCard>
        </div>
      )}
      {tab === "Besoins" && (
        <div className="knowledge-v2-step-list compact">
          {["Clarifier le périmètre d'intégration", "Comparer les sources projet", "Générer un plan d'action local-only"].map((need) => (
            <button key={need} onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "open-need", need } })}><TargetIcon /><div><strong>{need}</strong><small>Besoin détecté dans la transcription.</small></div></button>
          ))}
        </div>
      )}
      {tab === "Tâches" && (
        <div className="knowledge-v2-task-list">
          {["Créer le projet dédié", "Associer les pièces jointes", "Préparer la synthèse client"].map((task, index) => (
            <button key={task} onClick={() => void onAction("knowledge_ai.automation.run", { resourceId: item.id, payload: { task } })}><span>{index + 1}</span><strong>{task}</strong><small>Assigner</small></button>
          ))}
        </div>
      )}
      {tab === "Transcription" && (
        <div className="knowledge-v2-transcript">
          <button onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "copy-transcription" } })}><CopyIcon />Copier</button>
          {["Speaker 1", "Speaker 2", "Speaker 3"].map((speaker, index) => (
            <article key={speaker}><span>{speaker}</span><p>{index === 0 ? "On doit garder le contexte projet et éviter tout appel IA externe." : index === 1 ? "Les actions doivent être visibles dans Bridge, mais le produit reste dans son service." : "Chaque extrait doit pouvoir être cité dans le chat."}</p></article>
          ))}
        </div>
      )}
    </div>
  );
}

function SocialDetailTab({ item, tab, onAction }: { item: KnowledgeItem; tab: string; onAction: (id: string, input?: Record<string, unknown>) => Promise<unknown> }) {
  if (tab === "Automatisation") return <AutomationPreview item={item} onAction={onAction} source="social" />;
  return (
    <div className="knowledge-v2-social-viewer">
      <div className="knowledge-v2-social-head">
        <span style={{ backgroundColor: `${typeConfig(item.dataType).color}18`, color: typeConfig(item.dataType).color }}><TypeIcon type={item.dataType} /></span>
        <div><h3>{typeConfig(item.dataType).label}</h3><p>{formatLongDate(item.createdAt)}</p></div>
        <button onClick={() => void onAction("knowledge_ai.web_source.open", { resourceId: item.id, payload: { action: "open-post" } })}><LinkIcon />Voir le post</button>
      </div>
      <SourceLikeCard title="Résumé IA" tone="gold"><p>{item.summary}</p></SourceLikeCard>
      <div className="knowledge-v2-author-card">
        <span>NC</span><div><strong>Nicolas Cleton</strong><small>Yaka · stratégie IA locale</small></div>
      </div>
      <SourceLikeCard title="Publication" tone="blue">
        <p>Transformer une base de connaissances en produit utilisable demande une UI fidèle, une architecture service indépendante et un runtime local-only. Le Bridge orchestre, le service produit reste lisible.</p>
      </SourceLikeCard>
      <div className="knowledge-v2-engagement-row">
        {[
          ["J'aime", "128"],
          ["Commentaires", "24"],
          ["Partages", "9"],
        ].map(([label, value]) => <span key={label}><strong>{value}</strong>{label}</span>)}
      </div>
      <div className="knowledge-v2-modal-chips">
        {(item.semanticTags ?? []).map((tag) => <span key={tag}><TreeIcon />{tag}</span>)}
      </div>
    </div>
  );
}

function EmailDetailTab({ item, tab, onAction }: { item: KnowledgeItem; tab: string; onAction: (id: string, input?: Record<string, unknown>) => Promise<unknown> }) {
  const messages = [
    { from: "client@example.test", date: "14 juin 2026, 09:12", content: "Bonjour, pouvez-vous confirmer le périmètre et les prochaines étapes ?" },
    { from: "nicolas@yaka.test", date: "14 juin 2026, 10:04", content: "Oui, je prépare le contexte projet et les pièces jointes dans Connaissance." },
    { from: "client@example.test", date: "14 juin 2026, 10:32", content: "Parfait, merci de rattacher aussi le brief et la capture technique." },
  ];
  if (tab === "Automatisation") return <AutomationPreview item={item} onAction={onAction} source="email" />;
  return (
    <div className="knowledge-v2-email-viewer">
      <div className="knowledge-v2-email-head">
        <span><EmailIcon /></span>
        <div><h3>{item.title}</h3><p>{messages.length} messages · 2 participants · 2 pièces jointes</p></div>
      </div>
      {tab === "Résumé IA" ? (
        <>
          <SourceLikeCard title="Résumé de la conversation" tone="blue"><p>{item.summary}</p></SourceLikeCard>
          <SourceLikeCard title="Informations" tone="gold"><p>De client@example.test vers nicolas@yaka.test · reçu par Bridge OAuth.</p></SourceLikeCard>
          <div className="knowledge-v2-modal-chips">{[...(item.tags ?? []), ...(item.semanticTags ?? [])].map((tag) => <span key={tag}>{tag}</span>)}</div>
        </>
      ) : (
        <>
          <div className="knowledge-v2-email-toolbar">
            <button onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "toggle-thread" } })}><ChevronDownIcon />Tout développer</button>
            <button onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "copy-email-thread" } })}><CopyIcon />Copier</button>
          </div>
          <div className="knowledge-v2-email-thread">
            {messages.map((message, index) => (
              <article key={`${message.from}-${message.date}`}>
                <button onClick={() => void onAction("knowledge_ai.viewer.action", { resourceId: item.id, payload: { action: "toggle-message", index } })}>
                  <div><strong>{message.from}</strong><small>{message.date}</small></div><ChevronDownIcon />
                </button>
                <p>{message.content}</p>
              </article>
            ))}
          </div>
          <div className="knowledge-v2-attachment-grid">
            {["brief-client.pdf", "capture-technique.png"].map((attachment) => (
              <button key={attachment} onClick={() => void onAction("knowledge_ai.knowledge.get", { resourceId: item.id, payload: { attachment } })}><FileTextIcon /><span>{attachment}</span><small>Prêt</small></button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SourceLikeCard({ title, tone, children }: { title: string; tone: "blue" | "green" | "gold" | "red"; children: ReactNode }) {
  return <article className={`knowledge-v2-source-cardlet ${tone}`}><h3>{title}</h3>{children}</article>;
}

function AutomationPreview({ item, onAction, source }: { item: KnowledgeItem; onAction: (id: string, input?: Record<string, unknown>) => Promise<unknown>; source: string }) {
  const [modificationToken, setModificationToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [contentSelection, setContentSelection] = useState({
    content: true,
    summary: true,
    meetingNotes: item.dataType === "audio",
    clientNeeds: item.dataType === "audio",
    taskList: item.dataType === "audio",
    transcription: item.dataType === "audio",
  });
  const [workflowStates, setWorkflowStates] = useState<Record<string, "idle" | "loading" | "success" | "error">>({});
  const [googleState, setGoogleState] = useState<"disconnected" | "pending" | "connected" | "syncing">("disconnected");
  const [spreadsheetSearch, setSpreadsheetSearch] = useState("");
  const [selectedSheet, setSelectedSheet] = useState<{ id: string; name: string; url: string } | null>(null);
  const [replaceCandidate, setReplaceCandidate] = useState<{ id: string; name: string; url: string } | null>(null);
  const [showAppsScript, setShowAppsScript] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const isAudioContent = item.dataType === "audio";
  const isSpreadsheetContent = item.dataType === "spreadsheet" || item.dataType === "csv";
  const hasExistingContent = Boolean(item.summary);
  const workflows = [
    { id: "brief-client", name: "Envoyer vers brief client", description: "Préparer un payload pour le workflow client", color: "#D97706" },
    { id: "task-sync", name: "Créer les tâches", description: "Transformer les extraits sélectionnés en actions Bridge", color: "#57534E" },
    { id: "notify-team", name: "Notifier l'équipe", description: "Publier un event Connaissance pour le service", color: "#2563EB" },
  ];
  const availableSpreadsheets = [
    { id: "bridge-sheet-ops", name: "Suivi production", url: "bridge://knowledge_ai/google_sheets/bridge-sheet-ops", fileType: "Google Sheets" },
    { id: "bridge-sheet-budget", name: "Budget operations Q2", url: "bridge://knowledge_ai/google_sheets/bridge-sheet-budget", fileType: "Google Sheets" },
    { id: "bridge-sheet-maintenance", name: "Maintenance sites", url: "bridge://knowledge_ai/google_sheets/bridge-sheet-maintenance", fileType: "Excel" },
  ].filter((sheet) => sheet.name.toLowerCase().includes(spreadsheetSearch.trim().toLowerCase()));

  async function runAutomation(operation: string, payload: Record<string, unknown> = {}) {
    const result = await onAction("knowledge_ai.automation.run", {
      resourceId: item.id,
      payload: { operation, source, title: item.title, dataType: item.dataType, ...payload },
    });
    setStatus("Action Bridge acceptée");
    return result;
  }

  async function runGoogleSheets(operation: string, payload: Record<string, unknown> = {}) {
    const result = await onAction("knowledge_ai.upload.google_sheets", {
      resourceId: item.id,
      payload: { operation, source, title: item.title, ...payload },
    });
    setStatus("Action Google Sheets envoyée au Bridge");
    return result;
  }

  async function generateToken() {
    await runAutomation("modification_token.generate");
    setModificationToken(`brg_${item.id.replace(/[^a-z0-9]/gi, "").slice(0, 10)}_${Date.now().toString(36)}`);
  }

  async function revokeToken() {
    await runAutomation("modification_token.revoke");
    setModificationToken(null);
  }

  async function copyToken() {
    if (!modificationToken) return;
    await navigator.clipboard?.writeText(modificationToken);
    await runAutomation("modification_token.copy");
    setTokenCopied(true);
    window.setTimeout(() => setTokenCopied(false), 1800);
  }

  async function triggerWorkflow(workflow: (typeof workflows)[number]) {
    setWorkflowStates((current) => ({ ...current, [workflow.id]: "loading" }));
    try {
      await runAutomation("workflow.trigger", {
        workflowId: workflow.id,
        contentSelection,
      });
      setWorkflowStates((current) => ({ ...current, [workflow.id]: "success" }));
      window.setTimeout(() => setWorkflowStates((current) => ({ ...current, [workflow.id]: "idle" })), 2400);
    } catch {
      setWorkflowStates((current) => ({ ...current, [workflow.id]: "error" }));
    }
  }

  async function connectGoogleSheets() {
    await runGoogleSheets("bridge_oauth.connect");
    setGoogleState("pending");
  }

  async function selectSpreadsheet(sheet: { id: string; name: string; url: string }) {
    await runGoogleSheets("spreadsheet.select", { spreadsheetId: sheet.id, spreadsheetName: sheet.name, spreadsheetUrl: sheet.url });
    setSelectedSheet(sheet);
    setReplaceCandidate(null);
    setGoogleState("connected");
  }

  async function syncGoogleSheets() {
    if (!selectedSheet) return;
    setGoogleState("syncing");
    await runGoogleSheets("spreadsheet.sync", { spreadsheetId: selectedSheet.id });
    setGoogleState("connected");
  }

  async function disconnectGoogleSheets() {
    await runGoogleSheets("spreadsheet.disconnect", { spreadsheetId: selectedSheet?.id });
    setSelectedSheet(null);
    setGoogleState("disconnected");
  }

  return (
    <div className="knowledge-v2-viewer-pane">
      <div className="knowledge-v2-automation-source">
        <AutomationSection
          icon={<KeyIcon />}
          title="Modification externe (API)"
          description="Permet à N8N, Zapier, etc. de modifier cette connaissance via Bridge"
          tone="gold"
        >
          {modificationToken ? (
            <div className="knowledge-v2-token-block">
              <div className="knowledge-v2-token-value">
                <LinkIcon />
                <code>{modificationToken}</code>
              </div>
              <button type="button" onClick={() => void copyToken()} aria-label="Copier le token">
                {tokenCopied ? <CheckCircleIcon /> : <CopyIcon />}
              </button>
              <div className="knowledge-v2-automation-pills">
                <span><CheckCircleIcon />Modification activée</span>
                <button type="button" onClick={() => void generateToken()}><RefreshIcon />Régénérer</button>
                <button type="button" className="danger" onClick={() => void revokeToken()}><TrashIcon />Révoquer</button>
              </div>
              <div className="knowledge-v2-endpoint-note">
                <small>Endpoint API :</small>
                <code>PATCH /api/bridge/knowledge-ai/modify</code>
                <button type="button" onClick={() => void runAutomation("docs.open", { target: "api-modification" })}>Voir la documentation <ExternalLinkIcon /></button>
              </div>
            </div>
          ) : (
            <div className="knowledge-v2-automation-empty">
              <KeyIcon />
              <p>Aucun token de modification actif</p>
              <button type="button" onClick={() => void generateToken()}><KeyIcon />Activer la modification externe</button>
            </div>
          )}
        </AutomationSection>

        {isSpreadsheetContent && (
          <AutomationSection
            icon={<SheetIcon />}
            title="Google Sheets"
            description="Synchronisation automatique avec un tableur Google via OAuth Bridge"
            tone="stone"
          >
            {googleState === "disconnected" && (
              <div className="knowledge-v2-automation-empty">
                <SheetIcon />
                <p>Connecter un Google Sheet pour synchroniser les données</p>
                <button type="button" className="secondary" onClick={() => void connectGoogleSheets()}><SheetIcon />Connecter Google Sheets</button>
              </div>
            )}

            {googleState === "pending" && (
              <div className="knowledge-v2-gsheet-flow">
                <div className="knowledge-v2-gsheet-account">
                  <CheckCircleIcon />
                  <div>
                    <strong>Compte Google connecté</strong>
                    <small>OAuth géré par Bridge, sans auth Supabase directe côté client</small>
                  </div>
                </div>
                <label className="knowledge-v2-gsheet-search">
                  <SearchIcon />
                  <input value={spreadsheetSearch} onChange={(event) => setSpreadsheetSearch(event.target.value)} placeholder="Rechercher un fichier..." />
                  <button type="button" onClick={() => void runGoogleSheets("spreadsheet.search", { query: spreadsheetSearch })}>Chercher</button>
                </label>
                <div className="knowledge-v2-gsheet-list">
                  {availableSpreadsheets.map((sheet) => (
                    <button
                      key={sheet.id}
                      type="button"
                      onClick={() => {
                        if (hasExistingContent) setReplaceCandidate(sheet);
                        else void selectSpreadsheet(sheet);
                      }}
                    >
                      <SheetIcon />
                      <span><strong>{sheet.name}</strong><small>{sheet.fileType}</small></span>
                      <ChevronRightIcon />
                    </button>
                  ))}
                </div>
                <button type="button" className="knowledge-v2-gsheet-cancel" onClick={() => void disconnectGoogleSheets()}><UnlinkIcon />Annuler la connexion</button>
              </div>
            )}

            {(googleState === "connected" || googleState === "syncing") && selectedSheet && (
              <div className="knowledge-v2-gsheet-flow">
                <div className="knowledge-v2-gsheet-account">
                  <CheckCircleIcon />
                  <div>
                    <strong>{selectedSheet.name}</strong>
                    <small>Compte Google via Bridge</small>
                  </div>
                  <button type="button" aria-label="Ouvrir le Google Sheet" onClick={() => void runGoogleSheets("spreadsheet.open", { spreadsheetId: selectedSheet.id })}><ExternalLinkIcon /></button>
                </div>
                <div className="knowledge-v2-sync-note">
                  <ClockIcon />
                  <div>
                    <strong>Synchronisation automatique activée</strong>
                    <p>Les modifications du Google Sheet déclencheront une action service côté Bridge.</p>
                  </div>
                </div>
                <div className="knowledge-v2-gsheet-actions">
                  <button type="button" onClick={() => void syncGoogleSheets()} disabled={googleState === "syncing"}>
                    <RefreshIcon />{googleState === "syncing" ? "Actualisation en cours..." : "Actualiser maintenant"}
                  </button>
                  <button type="button" onClick={() => setShowAppsScript(true)}><CodeIcon />Apps Script</button>
                  <button type="button" className="danger" onClick={() => void disconnectGoogleSheets()}><UnlinkIcon />Annuler la connexion</button>
                </div>
              </div>
            )}
          </AutomationSection>
        )}

        <AutomationSection
          icon={<FileTextIcon />}
          title="Contenu à envoyer"
          description="Le titre, la description et les tags sont toujours envoyés"
          tone="plain"
        >
          <div className="knowledge-v2-content-selection">
            <ContentToggle checked={contentSelection.content} label="Contenu principal" description="Texte complet de la connaissance" icon={<FileTextIcon />} onClick={() => setContentSelection((current) => ({ ...current, content: !current.content }))} />
            {isAudioContent && (
              <>
                <ContentToggle checked={contentSelection.meetingNotes} label="Notes de réunion" description="Points clés et décisions" icon={<EmailIcon />} onClick={() => setContentSelection((current) => ({ ...current, meetingNotes: !current.meetingNotes }))} />
                <ContentToggle checked={contentSelection.clientNeeds} label="Besoins client" description="Besoins identifiés" icon={<TargetIcon />} onClick={() => setContentSelection((current) => ({ ...current, clientNeeds: !current.clientNeeds }))} />
                <ContentToggle checked={contentSelection.taskList} label="Liste de tâches" description="Actions à réaliser" icon={<CheckSquareIcon />} onClick={() => setContentSelection((current) => ({ ...current, taskList: !current.taskList }))} />
                <ContentToggle checked={contentSelection.transcription} label="Transcription" description="Texte complet avec speakers" icon={<FileTextIcon />} onClick={() => setContentSelection((current) => ({ ...current, transcription: !current.transcription }))} />
              </>
            )}
          </div>
        </AutomationSection>

        <AutomationSection
          icon={<WebhookIcon />}
          title="Workflows disponibles"
          description="Déclenchement manuel via actions Bridge et audit service"
          tone="plain"
        >
          <div className="knowledge-v2-workflow-list">
            {workflows.map((workflow) => {
              const state = workflowStates[workflow.id] ?? "idle";
              return (
                <button key={workflow.id} type="button" data-state={state} onClick={() => void triggerWorkflow(workflow)} disabled={state === "loading"}>
                  <span style={{ backgroundColor: `${workflow.color}20`, color: workflow.color }}>
                    {state === "loading" ? <SpinnerIcon /> : state === "success" ? <CheckCircleIcon /> : state === "error" ? <AlertCircleIcon /> : <WebhookIcon />}
                  </span>
                  <div>
                    <strong>{workflow.name}</strong>
                    <small>{state === "success" ? "Workflow déclenché avec succès" : workflow.description}</small>
                  </div>
                  <PlayIcon />
                </button>
              );
            })}
          </div>
        </AutomationSection>

        {status ? <p className="knowledge-v2-automation-status">{status}</p> : null}
      </div>

      {replaceCandidate ? (
        <div className="knowledge-v2-modal" role="dialog" aria-modal="true" aria-label="Remplacer le contenu">
          <div className="knowledge-v2-replace-warning">
            <div className="knowledge-v2-replace-warning-head">
              <AlertCircleIcon />
              <div><h2>Remplacer le contenu ?</h2><p>Cette action est irréversible</p></div>
            </div>
            <p>Cette connaissance contient déjà du contenu. En synchronisant avec <strong>{replaceCandidate.name}</strong>, le contenu actuel sera <strong>définitivement remplacé</strong>.</p>
            <div className="knowledge-v2-replace-sheet"><SheetIcon /><span>{replaceCandidate.name}</span></div>
            <div className="knowledge-v2-replace-actions">
              <button type="button" onClick={() => setReplaceCandidate(null)}>Annuler</button>
              <button type="button" onClick={() => void selectSpreadsheet(replaceCandidate)}>Remplacer le contenu</button>
            </div>
          </div>
        </div>
      ) : null}

      {showAppsScript && selectedSheet ? (
        <AppsScriptBridgeModal
          sheetName={selectedSheet.name}
          knowledgeId={item.id}
          onClose={() => setShowAppsScript(false)}
          onCopy={() => void runGoogleSheets("apps_script.copy", { spreadsheetId: selectedSheet.id })}
        />
      ) : null}
    </div>
  );
}

function AutomationSection({ icon, title, description, tone, children }: { icon: ReactNode; title: string; description: string; tone: "gold" | "stone" | "plain"; children: ReactNode }) {
  return (
    <section className={`knowledge-v2-automation-card ${tone}`}>
      <header>
        <span>{icon}</span>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </header>
      <div>{children}</div>
    </section>
  );
}

function ContentToggle({ checked, label, description, icon, onClick }: { checked: boolean; label: string; description: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="knowledge-v2-content-toggle" data-checked={checked} onClick={onClick}>
      <span>{checked ? <CheckIcon /> : null}</span>
      <i>{icon}</i>
      <div><strong>{label}</strong><small>{description}</small></div>
    </button>
  );
}

function AppsScriptBridgeModal({ sheetName, knowledgeId, onClose, onCopy }: { sheetName: string; knowledgeId: string; onClose: () => void; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  const appsScript = `// === CONNAISSANCE - Google Sheets Sync via Bridge ===
const BRIDGE_WEBHOOK_URL = 'https://<service-domain>/api/bridge/knowledge-ai/google-sheets/webhook';
const KNOWLEDGE_ID = '${knowledgeId}';

function onEditTrigger(e) {
  sendBridgeWebhook('edit', e);
}

function onChangeTrigger(e) {
  sendBridgeWebhook('change', e);
}

function sendBridgeWebhook(eventType, e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = sheet.getActiveSheet();
  const data = activeSheet.getDataRange().getValues();

  UrlFetchApp.fetch(BRIDGE_WEBHOOK_URL, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify({
      event_type: eventType,
      knowledge_id: KNOWLEDGE_ID,
      spreadsheet_id: sheet.getId(),
      sheet_name: activeSheet.getName(),
      changed_range: e && e.range ? e.range.getA1Notation() : null,
      data: data
    }),
    muteHttpExceptions: true
  });
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('onEditTrigger').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  ScriptApp.newTrigger('onChangeTrigger').forSpreadsheet(SpreadsheetApp.getActive()).onChange().create();
}`;

  async function copyScript() {
    await navigator.clipboard?.writeText(appsScript);
    onCopy();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="knowledge-v2-modal" role="dialog" aria-modal="true" aria-label="Configuration Apps Script">
      <div className="knowledge-v2-apps-script-modal">
        <div className="knowledge-v2-modal-head">
          <div>
            <h2>Configuration Apps Script</h2>
            <p>Activez la synchronisation temps réel pour {sheetName}</p>
          </div>
          <button className="nav-icon-btn nav-icon-btn-small" onClick={onClose} aria-label="Fermer"><CloseIcon /></button>
        </div>
        <div className="knowledge-v2-apps-script-body">
          <pre><code>{appsScript}</code></pre>
        </div>
        <div className="knowledge-v2-source-modal-actions sticky">
          <button type="button" onClick={onClose}>Fermer</button>
          <button type="button" onClick={() => void copyScript()}>{copied ? "Copié" : "Copier le script"}</button>
        </div>
      </div>
    </div>
  );
}

function groupFiles(item: KnowledgeItem): Array<{ name: string; type: KnowledgeType }> {
  if (item.id === "group-procedures") {
    return [
      { name: "Procedure accueil.pdf", type: "pdf" },
      { name: "Procedure securite.pdf", type: "pdf" },
      { name: "Checklist operations.pdf", type: "document" },
    ];
  }
  return [{ name: item.title, type: item.dataType }];
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function formatRelativeDate(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 60) return minutes <= 1 ? "à l'instant" : `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return formatLongDate(value);
}

function NavIconButton({ href, icon, tooltip, active }: { href: string; icon: ReactNode; tooltip: string; active?: boolean }) {
  return (
    <a className={`nav-icon-btn ${active ? "active" : ""}`} href={href} title={tooltip} aria-label={tooltip}>
      {icon}
    </a>
  );
}

function typeConfig(type: KnowledgeType) {
  return typeOptions.find((option) => option.value === type) ?? { value: type, label: type, color: "#6B7280" };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(value));
}

function menuIcon(action: string) {
  if (action === "Voir") return <FileTextIcon />;
  if (action === "Modifier") return <EditIcon />;
  if (action === "Associer à une autre connaissance") return <LinkIcon />;
  if (action === "Remplacer le fichier") return <RefreshIcon />;
  if (action === "Historique des versions") return <HistoryIcon />;
  if (action === "Chat") return <ChatIcon />;
  if (action === "Supprimer") return <TrashIcon />;
  return <DownloadIcon />;
}

const ChatIcon = () => <svg className="icon-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
const UploadIcon = () => <svg className="icon-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;
const DashboardIcon = () => <svg className="icon-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
const DatabaseIcon = () => <svg className="icon-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6c0 1.66-3.69 3-8.25 3S3.75 7.66 3.75 6 7.44 3 12 3s8.25 1.34 8.25 3Zm0 0v6c0 1.66-3.69 3-8.25 3s-8.25-1.34-8.25-3V6m16.5 6v6c0 1.66-3.69 3-8.25 3s-8.25-1.34-8.25-3v-6" /></svg>;
const SearchIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const AnalyticsIcon = () => <svg className="icon-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const SettingsIcon = () => <svg className="icon-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PlusIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const CloseIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const GridIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ListIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
const ListIconSmall = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
const NetworkIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM17.25 21a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM17.25 7.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM6.75 16.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM8.84 6.64l6.32 10.72M8.84 13.36l6.32-6.72" /></svg>;
const FilterIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;
const ChevronDownIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const CheckIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const ChevronRightIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const MoreIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>;
const CalendarIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M4 11h16M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" /></svg>;
const TreeIcon = () => <svg className="icon-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v6m0 0H7a3 3 0 000 6h10a3 3 0 010 6h-5m0-12h5a3 3 0 010 6H7a3 3 0 000 6h5" /></svg>;
const FolderIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 12.75V6A2.25 2.25 0 014.5 3.75h5.379c.398 0 .779.158 1.06.44l2.122 2.12H19.5A2.25 2.25 0 0121.75 8.56v9.19A2.25 2.25 0 0119.5 20H4.5a2.25 2.25 0 01-2.25-2.25v-5z" /></svg>;
const FileTextIcon = () => <svg className="icon-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ErrorIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LinkIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const EditIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>;
const RefreshIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992V4.356M3 20.944v-4.992h4.992M21.015 9.348A9 9 0 006.697 4.356M3 15.952a9 9 0 0014.318 4.992" /></svg>;
const HistoryIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m5-2a9 9 0 11-3-6.708M21 3v6h-6" /></svg>;
const DownloadIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 10.5L12 15m0 0l4.5-4.5M12 15V3" /></svg>;
const TrashIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166M4.772 5.79c.34-.059.68-.114 1.022-.165m12.448.165L17.25 19.5A2.25 2.25 0 0115.006 21H8.994A2.25 2.25 0 016.75 19.5L5.758 5.79m12.484 0A48.108 48.108 0 0012 5.25c-2.12 0-4.186.185-6.242.54m12.484 0L18 3.75A1.5 1.5 0 0016.5 2.25h-9A1.5 1.5 0 006 3.75l-.242 2.04" /></svg>;
const LockIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5A2.25 2.25 0 0019.5 19.5v-6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 12.75v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
const SaveIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3.75H6.912a2.25 2.25 0 00-1.591.659L3.659 6.071A2.25 2.25 0 003 7.662V18.75A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V6.75A2.25 2.25 0 0018.75 4.5H16.5M9 3.75v5.25h6V3.75M9 15h6" /></svg>;
const ZoomOutIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M7.5 10.5h6m5.25 0a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0z" /></svg>;
const ZoomInIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 7.5v6m-3-3h6m5.25 0a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0z" /></svg>;
const CopyIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7.5V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0120 6v7.5a2.25 2.25 0 01-2.25 2.25h-1.5M4 10.5A2.25 2.25 0 016.25 8.25h7.5A2.25 2.25 0 0116 10.5V18a2.25 2.25 0 01-2.25 2.25h-7.5A2.25 2.25 0 014 18v-7.5z" /></svg>;
const ZapIcon = () => <svg className="icon-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
const PlayIcon = () => <svg className="icon-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5.14v13.72a1 1 0 001.52.85l11.22-6.86a1 1 0 000-1.7L9.52 4.29A1 1 0 008 5.14z" /></svg>;
const AudioIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 9v6h4l5 4V5l-5 4H9zM5 9v6m14-4v2" /></svg>;
const TargetIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 15a3 3 0 100-6 3 3 0 000 6zM12 3v4m0 10v4m9-9h-4M7 12H3" /></svg>;
const EmailIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l8.29 5.526a1.25 1.25 0 001.42 0L21 8M5.25 5h13.5A2.25 2.25 0 0121 7.25v9.5A2.25 2.25 0 0118.75 19H5.25A2.25 2.25 0 013 16.75v-9.5A2.25 2.25 0 015.25 5z" /></svg>;
const KeyIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 7.5a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0zM10.5 12.75L21 23.25m-3.75-3.75L19.5 17.25m-4.5-.75 2.25-2.25" /></svg>;
const CheckCircleIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const AlertCircleIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SheetIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.5 4.5h15v15h-15v-15zm0 5h15m-10 10v-15m5 15v-15M4.5 14.5h15" /></svg>;
const WebhookIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 6.75a3 3 0 105.5 1.66l3.02 1.67m-8.52-3.33 3.02 1.66M16.5 10.5a3 3 0 10-1.36 5.14l-2.28 2.1m3.64-7.24-2.28 2.1M8.25 17.25a3 3 0 105.5 1.66" /></svg>;
const ExternalLinkIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H18m0 0v4.5M18 6l-7.5 7.5M6 7.5v10.5h10.5" /></svg>;
const UnlinkIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 12H6a4.5 4.5 0 010-9h3a4.5 4.5 0 014.24 3M16.5 12H18a4.5 4.5 0 000-9h-3a4.5 4.5 0 00-4.24 3M4 20 20 4" /></svg>;
const ClockIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CodeIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 15.75 4.5 12l3.75-3.75m7.5 0L19.5 12l-3.75 3.75M14.25 4.5l-4.5 15" /></svg>;
const CheckSquareIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12.75 11.25 15 15 9.75M4.5 6.75A2.25 2.25 0 016.75 4.5h10.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25V6.75z" /></svg>;
const SpinnerIcon = () => <svg className="icon-4 knowledge-v2-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3a9 9 0 109 9" /></svg>;

function TypeIcon({ type }: { type: KnowledgeType }) {
  if (type === "video" || type === "youtube") return <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
  if (type === "audio") return <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-12 1.5a6 6 0 006 6m0 0v3.75m-3.75 0h7.5M12 15.75a3 3 0 003-3V6.75a3 3 0 10-6 0v6a3 3 0 003 3z" /></svg>;
  if (type === "image") return <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  if (type === "spreadsheet" || type === "csv") return <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
  if (type === "web_page" || type === "linkedin" || type === "twitter") return <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>;
  return <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}
