"use client";

import { useState } from "react";
import { legacyModelOptions, modelOptions, shortcutIcons, shortcuts, type ShortcutItem } from "@/data/feature-catalog";
import { callBridgeAction } from "@/lib/bridge-actions";
import { ServiceIcon } from "@/components/ServiceIcon";

interface ShortcutManagerModalProps {
  open: boolean;
  onClose: () => void;
}

type ViewMode = "list" | "edit" | "create";

export function ShortcutManagerModal({ open, onClose }: ShortcutManagerModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [items, setItems] = useState<ShortcutItem[]>(shortcuts);
  const [editing, setEditing] = useState<ShortcutItem | null>(null);
  const [status, setStatus] = useState("Les 4 premiers raccourcis sont affichés dans le chat. Utilisez les flèches pour changer l'ordre.");
  const [form, setForm] = useState({
    name: "",
    prompt: "",
    icon: "sparkles",
    mode: "rag",
    model: modelOptions[0].id,
  });

  if (!open) return null;

  function editShortcut(shortcut: ShortcutItem) {
    setEditing(shortcut);
    setForm({ name: shortcut.name, prompt: shortcut.prompt, icon: shortcut.icon, mode: "rag", model: modelOptions[0].id });
    setViewMode("edit");
  }

  async function run(action: string, payload: Record<string, unknown> = {}, resourceId = editing?.id) {
    setStatus(`${action}...`);
    const result = await callBridgeAction(shortcutActionId(action), {
      resourceId,
      payload,
    });
    setStatus(result.ok ? `${action} enregistré via Bridge` : result.error ?? "Action Bridge indisponible");
  }

  async function save() {
    if (!form.name.trim() || !form.prompt.trim()) return;
    if (viewMode === "create") {
      const next = { id: `shortcut-${Date.now()}`, name: form.name, prompt: form.prompt, icon: form.icon };
      setItems((value) => [...value, next]);
      await run("Créer un raccourci", next, next.id);
    } else if (editing) {
      const next = { ...editing, name: form.name, prompt: form.prompt, icon: form.icon };
      setItems((value) => value.map((item) => item.id === editing.id ? next : item));
      await run("Modifier le raccourci", next, next.id);
    }
    setViewMode("list");
    setEditing(null);
  }

  async function remove(id: string) {
    setItems((value) => value.filter((item) => item.id !== id));
    await run("Supprimer ce raccourci ?", { id }, id);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    void run(direction < 0 ? "Monter" : "Descendre", { orderedIds: next.map((item) => item.id) });
  }

  return (
    <div className="service-modal" role="dialog" aria-modal="true">
      <div className="service-modal-panel shortcut-modal">
        <div className="service-sidebar-header">
          <button className="service-icon-button" type="button" onClick={() => viewMode === "list" ? onClose() : setViewMode("list")} aria-label="Retour">
            <ServiceIcon name={viewMode === "list" ? "close" : "link"} size={14} />
          </button>
          <strong>{viewMode === "list" ? "Mes raccourcis" : viewMode === "edit" ? "Modifier le raccourci" : "Nouveau raccourci"}</strong>
          <button className="service-icon-button" type="button" aria-label="Ajouter un raccourci" onClick={() => {
            setForm({ name: "", prompt: "", icon: "sparkles", mode: "rag", model: modelOptions[0].id });
            setViewMode("create");
          }}>
            <ServiceIcon name="plus" size={14} />
          </button>
        </div>

        {viewMode === "list" ? (
          <>
            <p className="chat-context">{status}</p>
            <div className="service-list">
              {items.length === 0 ? <p className="service-muted">Aucun raccourci</p> : null}
              {items.map((shortcut, index) => (
                <article className="shortcut-row" key={shortcut.id}>
                  <span className="upload-icon"><ServiceIcon name={shortcut.icon} /></span>
                  <div>
                    <strong>{shortcut.name}</strong>
                    <p>{shortcut.prompt}</p>
                  </div>
                  <div className="viewer-actions">
                    <button type="button" onClick={() => move(index, -1)}>↑</button>
                    <button type="button" onClick={() => move(index, 1)}>↓</button>
                    <button type="button" onClick={() => editShortcut(shortcut)}>Modifier</button>
                    <button type="button" onClick={() => void remove(shortcut.id)}>Supprimer</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <>
            <label className="modal-section">
              <span>Titre du raccourci</span>
              <input className="service-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex: Résumé réunion" />
            </label>
            <label className="modal-section">
              <span>Texte du prompt</span>
              <textarea className="service-textarea" value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} placeholder="Ce texte sera inséré quand vous cliquez sur le raccourci" />
            </label>
            <div className="modal-section">
              <span>Icône</span>
              <div className="shortcut-icon-grid">
                {shortcutIcons.map((icon) => (
                  <button key={icon.id} type="button" data-active={form.icon === icon.id} onClick={() => setForm({ ...form, icon: icon.id })}>
                    <ServiceIcon name={icon.id} size={16} />
                    {icon.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="modal-section">
              <span>Modèle à utiliser</span>
              <select className="service-input" value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })}>
                {modelOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </label>
            <details className="service-panel subtle-panel">
              <summary>Autres modèles · Autre modèle</summary>
              <div className="service-list">
                {legacyModelOptions.map((option) => (
                  <div className="service-row" key={option.id}>
                    <span>{option.label} - {option.detail}</span>
                    <span className="service-badge">bloqué local-only</span>
                  </div>
                ))}
              </div>
            </details>
            <section className="service-panel subtle-panel">
              <h2>Aperçu</h2>
              <button type="button" className="service-button">
                <ServiceIcon name={form.icon} size={15} />
                {form.name || "Créer un raccourci"}
              </button>
            </section>
            <div className="service-modal-actions">
              <button type="button" onClick={() => setViewMode("list")}>Annuler</button>
              <button className="service-button" type="button" onClick={() => void save()}>
                {viewMode === "create" ? "Créer un raccourci" : "Enregistrer"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function shortcutActionId(action: string) {
  if (action === "Créer un raccourci") return "knowledge_ai.shortcut.create";
  if (action === "Modifier le raccourci") return "knowledge_ai.shortcut.update";
  if (action === "Supprimer ce raccourci ?") return "knowledge_ai.shortcut.delete";
  if (action === "Monter" || action === "Descendre") return "knowledge_ai.shortcut.reorder";
  return "knowledge_ai.shortcut.track_usage";
}
