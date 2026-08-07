"use client";

import { useEffect, useRef, useState } from "react";

export type ShortcutMode = "rag" | "llm";

export interface ConnaissanceShortcut {
  id: string;
  name: string;
  prompt: string;
  icon?: string;
  mode?: ShortcutMode;
  model?: string;
  usageCount?: number;
  isDefault?: boolean;
}

const availableIcons = [
  { id: "sparkles", label: "Sparkles" },
  { id: "lightbulb", label: "Idée" },
  { id: "translate", label: "Traduire" },
  { id: "brain", label: "Brainstorm" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "document", label: "Document" },
  { id: "email", label: "Email" },
  { id: "search", label: "Recherche" },
  { id: "star", label: "Favori" },
  { id: "bolt", label: "Rapide" },
];

export function ShortcutsBar({
  shortcuts,
  onSelectShortcut,
  onEditShortcuts,
}: {
  shortcuts: ConnaissanceShortcut[];
  onSelectShortcut: (shortcut: ConnaissanceShortcut) => void;
  onEditShortcuts: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const check = () => {
      setShowLeftFade(node.scrollLeft > 10);
      setShowRightFade(node.scrollLeft < node.scrollWidth - node.clientWidth - 10);
    };
    check();
    node.addEventListener("scroll", check);
    window.addEventListener("resize", check);
    return () => {
      node.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [shortcuts.length]);

  if (shortcuts.length === 0) {
    return (
      <div className="knowledge-v2-shortcuts-empty">
        <button onClick={onEditShortcuts}>
          <PlusTinyIcon />
          <span>Ajouter un raccourci</span>
        </button>
      </div>
    );
  }

  return (
    <div className="knowledge-v2-shortcuts-bar">
      <div className="knowledge-v2-shortcuts-scroll-wrap">
        {showLeftFade && <div className="knowledge-v2-shortcuts-fade left" />}
        <div ref={scrollRef} className="knowledge-v2-shortcuts-scroll">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelectShortcut(shortcut)}
              className="knowledge-v2-shortcut-pill"
            >
              {shortcut.icon && <ShortcutIcon icon={shortcut.icon} />}
              <span>{shortcut.name}</span>
            </button>
          ))}
        </div>
        {showRightFade && <div className="knowledge-v2-shortcuts-fade right" />}
      </div>
      <button
        className="knowledge-v2-shortcuts-edit"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onEditShortcuts}
        title="Modifier les raccourcis"
        aria-label="Modifier les raccourcis"
      >
        <EditIcon />
      </button>
    </div>
  );
}

export function SlashCommandMenu({
  isOpen,
  filter,
  shortcuts,
  onClose,
  onSelectShortcut,
  onCreateShortcut,
}: {
  isOpen: boolean;
  filter: string;
  shortcuts: ConnaissanceShortcut[];
  onClose: () => void;
  onSelectShortcut: (shortcut: ConnaissanceShortcut) => void;
  onCreateShortcut: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const filteredShortcuts = filter
    ? shortcuts.filter((shortcut) =>
        `${shortcut.name} ${shortcut.prompt}`.toLowerCase().includes(filter.toLowerCase()),
      )
    : shortcuts;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) onClose();
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={menuRef} className="knowledge-v2-slash-menu">
      <div className="knowledge-v2-slash-head">
        <span>Raccourcis</span>
        <button onClick={onClose} aria-label="Fermer les raccourcis">
          <CloseTinyIcon />
        </button>
      </div>
      <div className="knowledge-v2-slash-list">
        {filteredShortcuts.length === 0 ? (
          <div className="knowledge-v2-slash-empty">
            {filter ? `Aucun raccourci trouvé pour "${filter}"` : "Aucun raccourci disponible"}
          </div>
        ) : (
          filteredShortcuts.map((shortcut) => (
            <button
              key={shortcut.id}
              onClick={() => {
                onSelectShortcut(shortcut);
                onClose();
              }}
            >
              <span>
                <ShortcutIcon icon={shortcut.icon ?? "sparkles"} />
              </span>
              <div>
                <strong>{shortcut.name}</strong>
                <small>{shortcut.prompt}</small>
              </div>
            </button>
          ))
        )}
      </div>
      <button
        className="knowledge-v2-slash-create"
        onClick={() => {
          onCreateShortcut();
          onClose();
        }}
      >
        <span>
          <PlusTinyIcon />
        </span>
        <strong>Créer un raccourci</strong>
      </button>
    </div>
  );
}

export function ShortcutsManagerModal({
  isOpen,
  shortcuts,
  onClose,
  onUpdateShortcuts,
  onSaveShortcut,
  onCreateShortcut,
  onDeleteShortcut,
}: {
  isOpen: boolean;
  shortcuts: ConnaissanceShortcut[];
  onClose: () => void;
  onUpdateShortcuts: (shortcuts: ConnaissanceShortcut[]) => void;
  onSaveShortcut: (shortcut: ConnaissanceShortcut, shortcuts: ConnaissanceShortcut[]) => void;
  onCreateShortcut: (shortcut: Omit<ConnaissanceShortcut, "id">) => void;
  onDeleteShortcut: (id: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"list" | "edit" | "create">("list");
  const [localShortcuts, setLocalShortcuts] = useState<ConnaissanceShortcut[]>([]);
  const [editingShortcut, setEditingShortcut] = useState<ConnaissanceShortcut | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrompt, setFormPrompt] = useState("");
  const [formIcon, setFormIcon] = useState("sparkles");
  const [formMode, setFormMode] = useState<ShortcutMode>("rag");

  useEffect(() => {
    setLocalShortcuts([...shortcuts]);
  }, [shortcuts]);

  useEffect(() => {
    if (!isOpen) {
      setViewMode("list");
      setEditingShortcut(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= localShortcuts.length) return;
    const next = [...localShortcuts];
    [next[index], next[target]] = [next[target], next[index]];
    setLocalShortcuts(next);
    onUpdateShortcuts(next);
  }

  function editShortcut(shortcut: ConnaissanceShortcut) {
    setEditingShortcut(shortcut);
    setFormName(shortcut.name);
    setFormPrompt(shortcut.prompt);
    setFormIcon(shortcut.icon ?? "sparkles");
    setFormMode(shortcut.mode ?? "rag");
    setViewMode("edit");
  }

  function createShortcut() {
    setEditingShortcut(null);
    setFormName("");
    setFormPrompt("");
    setFormIcon("sparkles");
    setFormMode("rag");
    setViewMode("create");
  }

  function save() {
    if (!formName.trim() || !formPrompt.trim()) return;
    if (viewMode === "create") {
      onCreateShortcut({
        name: formName.trim(),
        prompt: formPrompt.trim(),
        icon: formIcon,
        mode: formMode,
        isDefault: false,
      });
    } else if (editingShortcut) {
      const next = localShortcuts.map((shortcut) =>
        shortcut.id === editingShortcut.id
          ? { ...shortcut, name: formName.trim(), prompt: formPrompt.trim(), icon: formIcon, mode: formMode }
          : shortcut,
      );
      const saved = next.find((shortcut) => shortcut.id === editingShortcut.id);
      setLocalShortcuts(next);
      if (saved) onSaveShortcut(saved, next);
    }
    setViewMode("list");
    setEditingShortcut(null);
  }

  return (
    <div className="knowledge-v2-shortcuts-modal" role="dialog" aria-modal="true">
      <div className="knowledge-v2-shortcuts-backdrop" onClick={onClose} />
      <div className="knowledge-v2-shortcuts-panel">
        <div className="knowledge-v2-shortcuts-modal-head">
          <div>
            {viewMode !== "list" && (
              <button onClick={() => setViewMode("list")} aria-label="Retour">
                <ChevronLeftTinyIcon />
              </button>
            )}
            <h2>{viewMode === "list" ? "Mes raccourcis" : viewMode === "edit" ? "Modifier le raccourci" : "Nouveau raccourci"}</h2>
          </div>
          <div>
            {viewMode === "list" && (
              <button onClick={createShortcut} aria-label="Créer un raccourci">
                <PlusTinyIcon />
              </button>
            )}
            <button onClick={onClose} aria-label="Fermer">
              <CloseTinyIcon />
            </button>
          </div>
        </div>

        <div className="knowledge-v2-shortcuts-modal-body">
          {viewMode === "list" ? (
            <>
              <div className="knowledge-v2-shortcuts-info">
                <InfoIcon />
                <p>Les 4 premiers raccourcis sont affichés dans le chat. Utilisez les flèches pour changer l'ordre.</p>
              </div>
              {localShortcuts.length === 0 ? (
                <div className="knowledge-v2-shortcuts-empty-state">
                  <BoltIcon />
                  <p>Aucun raccourci</p>
                  <button onClick={createShortcut}>Créer un raccourci</button>
                </div>
              ) : (
                <div className="knowledge-v2-shortcuts-manager-list">
                  {localShortcuts.map((shortcut, index) => (
                    <div key={shortcut.id} className="knowledge-v2-shortcuts-manager-row">
                      <div className="knowledge-v2-shortcuts-reorder">
                        <button onClick={() => move(index, -1)} disabled={index === 0} aria-label="Monter">
                          <ChevronUpTinyIcon />
                        </button>
                        <button onClick={() => move(index, 1)} disabled={index === localShortcuts.length - 1} aria-label="Descendre">
                          <ChevronDownTinyIcon />
                        </button>
                      </div>
                      <span className={index < 4 ? "visible" : ""}>{index < 4 ? index + 1 : <HiddenIcon />}</span>
                      <i>
                        <ShortcutIcon icon={shortcut.icon ?? "sparkles"} />
                      </i>
                      <div>
                        <strong>{shortcut.name}</strong>
                        <small>{shortcut.prompt}</small>
                      </div>
                      <button onClick={() => editShortcut(shortcut)} aria-label="Modifier">
                        <EditIcon />
                      </button>
                      <button className="danger" onClick={() => onDeleteShortcut(shortcut.id)} aria-label="Supprimer">
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="knowledge-v2-shortcuts-form">
              <label>
                <span>Titre du raccourci</span>
                <input value={formName} onChange={(event) => setFormName(event.target.value)} placeholder="Ex: Résumé réunion" />
              </label>
              <label>
                <span>Texte du prompt</span>
                <textarea value={formPrompt} onChange={(event) => setFormPrompt(event.target.value)} rows={4} placeholder="Ce texte sera inséré quand vous cliquez sur le raccourci" />
              </label>
              {viewMode === "create" && (
                <div>
                  <span>Modèle à utiliser</span>
                  <div className="knowledge-v2-shortcuts-mode-grid">
                    <button onClick={() => setFormMode("rag")} className={formMode === "rag" ? "active" : ""}>
                      <BrainTinyIcon />
                      <span>Connaissance Pro</span>
                    </button>
                    <button onClick={() => setFormMode("llm")} className={formMode === "llm" ? "active" : ""}>
                      <SparklesTinyIcon />
                      <span>LLM Direct</span>
                    </button>
                  </div>
                </div>
              )}
              <div>
                <span>Icône</span>
                <div className="knowledge-v2-shortcuts-icon-grid">
                  {availableIcons.map((icon) => (
                    <button key={icon.id} onClick={() => setFormIcon(icon.id)} className={formIcon === icon.id ? "active" : ""}>
                      <ShortcutIcon icon={icon.id} />
                      <span>{icon.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="knowledge-v2-shortcuts-preview">
                <span>Aperçu</span>
                <button>
                  <ShortcutIcon icon={formIcon} />
                  <span>{formName || "Nouveau raccourci"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {viewMode !== "list" && (
          <div className="knowledge-v2-shortcuts-modal-actions">
            <button onClick={() => setViewMode("list")}>Annuler</button>
            <button onClick={save} disabled={!formName.trim() || !formPrompt.trim()}>
              {viewMode === "create" ? "Créer un raccourci" : "Enregistrer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ShortcutIcon({ icon }: { icon: string }) {
  if (icon === "lightbulb") return <LightbulbIcon />;
  if (icon === "translate") return <TranslateIcon />;
  if (icon === "brain") return <BrainTinyIcon />;
  if (icon === "linkedin") return <LinkedinIcon />;
  if (icon === "document") return <DocumentIcon />;
  if (icon === "email") return <EmailIcon />;
  if (icon === "search") return <SearchTinyIcon />;
  if (icon === "star") return <StarIcon />;
  if (icon === "bolt") return <BoltIcon />;
  return <SparklesTinyIcon />;
}

const SparklesTinyIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" /><path d="M19 13l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" /></svg>;
const LightbulbIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 21h6M12 3a6 6 0 00-6 6c0 3 2 4 2 7h8c0-3 2-4 2-7a6 6 0 00-6-6z" /></svg>;
const TranslateIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2v3M22 22l-5-10-5 10M14 18h6" /></svg>;
const BrainTinyIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 4.5a2.5 2.5 0 00-4.96-.46 2.5 2.5 0 00-1.98 3 2.5 2.5 0 00-1.32 4.24 3 3 0 00.34 5.58 2.5 2.5 0 002.96 3.08A2.5 2.5 0 0012 19.5V4.5z" /><path d="M12 4.5a2.5 2.5 0 014.96-.46 2.5 2.5 0 011.98 3 2.5 2.5 0 011.32 4.24 3 3 0 01-.34 5.58 2.5 2.5 0 01-2.96 3.08A2.5 2.5 0 0112 19.5" /></svg>;
const LinkedinIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" /></svg>;
const DocumentIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>;
const EmailIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6l-10 7L2 6" /></svg>;
const SearchTinyIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>;
const StarIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const BoltIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>;
const EditIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const PlusTinyIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>;
const CloseTinyIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>;
const ChevronLeftTinyIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6" /></svg>;
const ChevronUpTinyIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 15l-6-6-6 6" /></svg>;
const ChevronDownTinyIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>;
const HiddenIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" /></svg>;
const TrashIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>;
const InfoIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>;
