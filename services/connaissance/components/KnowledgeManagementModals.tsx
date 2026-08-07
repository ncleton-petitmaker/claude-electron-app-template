"use client";

import { versionHistory, type KnowledgeItem } from "@/data/feature-catalog";
import { callBridgeAction } from "@/lib/bridge-actions";
import { ServiceIcon } from "@/components/ServiceIcon";

export type KnowledgeModalKind = "edit" | "associate" | "replace" | "versions" | null;

interface KnowledgeManagementModalsProps {
  item: KnowledgeItem | null;
  kind: KnowledgeModalKind;
  onClose: () => void;
  onStatus: (status: string) => void;
}

export function KnowledgeManagementModals({ item, kind, onClose, onStatus }: KnowledgeManagementModalsProps) {
  if (!item || !kind) return null;

  async function run(action: string, input: Record<string, unknown> = {}) {
    onStatus(`${action} : ${item?.title ?? ""}`);
    const result = await callBridgeAction(knowledgeModalActionId(action), {
      resourceId: item?.id,
      payload: input,
    });
    onStatus(result.ok ? `${action} pret via Bridge` : result.error ?? "Action Bridge indisponible");
    onClose();
  }

  return (
    <div className="service-modal" role="dialog" aria-modal="true">
      <div className="service-modal-panel">
        <div className="service-sidebar-header">
          <span />
          <strong>{modalTitle(kind)}</strong>
          <button className="service-icon-button" type="button" onClick={onClose} aria-label="Fermer">
            <ServiceIcon name="close" size={14} />
          </button>
        </div>

        {kind === "edit" ? (
          <>
            <section className="modal-section">
              <h3>Informations générales</h3>
              <input className="service-input" defaultValue={item.title} aria-label="Titre" />
              <textarea className="service-textarea" defaultValue={item.summary} aria-label="Resume" />
            </section>
            <section className="modal-section">
              <h3>Tags</h3>
              <input className="service-input" defaultValue={item.tags.join(", ")} aria-label="Tags" />
              <input className="service-input" placeholder="Ajouter..." aria-label="Ajouter un tag" />
            </section>
            <div className="service-modal-actions">
              <button type="button" onClick={onClose}>Annuler</button>
              <button className="service-button" type="button" onClick={() => void run("Modifier")}>Enregistrer</button>
            </div>
          </>
        ) : null}

        {kind === "associate" ? (
          <>
            <p className="service-muted">Associer à une autre connaissance ou à un groupe existant. Association en cours...</p>
            <select className="service-input" defaultValue="g1" aria-label="Connaissance cible">
              <option value="g1">Groupe de connaissances onboarding</option>
              <option value="k1">Procedure installation locale</option>
            </select>
            <div className="service-modal-actions">
              <button type="button" onClick={onClose}>Annuler</button>
              <button className="service-button" type="button" onClick={() => void run("Associer à une autre connaissance")}>Associer</button>
            </div>
          </>
        ) : null}

        {kind === "replace" ? (
          <>
            <p className="service-muted">Remplacer le contenu ? Cette action est irréversible. Cette connaissance contient déjà du contenu. En synchronisant avec un nouveau fichier, le contenu sera définitivement remplacé.</p>
            <p className="service-muted">Fichier actuel · Prêt à remplacer · Remplacement en cours...</p>
            <input className="service-input" type="file" aria-label="Nouveau fichier" />
            <textarea className="service-textarea" placeholder="Raison du changement (optionnel) Ex: Mise à jour version 2.0" />
            <div className="service-modal-actions">
              <button type="button" onClick={onClose}>Annuler</button>
              <button className="service-button" type="button" onClick={() => void run("Remplacer le fichier")}>Remplacer le fichier</button>
            </div>
          </>
        ) : null}

        {kind === "versions" ? (
          <>
            <div className="service-list">
              {versionHistory.map((version) => (
                <div className="service-row" key={version.id}>
                  <span>
                    <strong>{version.label}</strong>
                    <small>{version.detail} - {version.date}</small>
                  </span>
                  <button type="button" onClick={() => void run("Restaurer cette version ?", { versionId: version.id })}>
                    Restaurer
                  </button>
                </div>
              ))}
            </div>
            <div className="service-modal-actions">
              <button type="button" onClick={onClose}>Annuler</button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function knowledgeModalActionId(action: string) {
  if (action === "Modifier") return "knowledge_ai.knowledge.update";
  if (action === "Associer à une autre connaissance") return "knowledge_ai.knowledge.associate";
  if (action === "Remplacer le fichier") return "knowledge_ai.knowledge.replace_file";
  if (action === "Restaurer cette version ?") return "knowledge_ai.knowledge.version.restore";
  return "knowledge_ai.knowledge.get";
}

function modalTitle(kind: Exclude<KnowledgeModalKind, null>) {
  if (kind === "edit") return "Modifier la connaissance";
  if (kind === "associate") return "Associer à...";
  if (kind === "replace") return "Remplacer le fichier";
  return "Historique des versions";
}
