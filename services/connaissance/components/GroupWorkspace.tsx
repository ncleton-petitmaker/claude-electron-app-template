"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { knowledgeItems } from "@/data/feature-catalog";
import { callBridgeAction } from "@/lib/bridge-actions";
import { ServiceIcon } from "@/components/ServiceIcon";

interface GroupWorkspaceProps {
  groupId: string;
}

export function GroupWorkspace({ groupId }: GroupWorkspaceProps) {
  const [status, setStatus] = useState("Groupe pret");
  const group = useMemo(() => knowledgeItems.find((item) => item.id === groupId) ?? knowledgeItems.find((item) => item.type === "group") ?? knowledgeItems[0], [groupId]);

  async function run(action: string) {
    setStatus(`${action} : ${group.title}`);
    const result = await callBridgeAction(groupActionId(action), {
      resourceId: group.id,
      payload: { action, title: group.title },
    });
    setStatus(result.ok ? `${action} pret via Bridge` : result.error ?? "Action groupe indisponible");
  }

  return (
    <section className="workspace-grid">
      <section className="service-panel">
        <div className="viewer-title-row">
          <div>
            <span className="service-badge">Groupe</span>
            <h2>{group.title}</h2>
          </div>
          <div className="viewer-actions">
            <button type="button" onClick={() => void run("Partager")}>Partager</button>
            <button type="button" onClick={() => void run("Copier le lien")}>Copier le lien</button>
          </div>
        </div>
        <p className="service-muted">{group.summary}</p>
        <div className="knowledge-tags">
          {group.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      </section>
      <section className="service-panel">
        <h2>Connaissances du groupe</h2>
        <div className="service-list">
          {knowledgeItems.filter((item) => item.type !== "group").map((item) => (
            <Link className="service-row" key={item.id} href={`/knowledge/${item.id}`}>
              <span>{item.title}</span>
              <span className="service-badge">{item.type}</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="service-panel">
        <h2>Actions</h2>
        <div className="knowledge-actions">
          {["Chat sur ce groupe", "Ajouter une connaissance", "Modifier le groupe", "Supprimer"].map((action) => (
            <button key={action} type="button" onClick={() => void run(action)}>
              <ServiceIcon name={action.includes("Ajouter") ? "plus" : "dashboard"} size={14} />
              {action}
            </button>
          ))}
        </div>
        <p className="service-muted">{status}</p>
      </section>
    </section>
  );
}

function groupActionId(action: string) {
  if (action === "Chat sur ce groupe") return "knowledge_ai.conversation.context.set";
  if (action === "Ajouter une connaissance") return "knowledge_ai.knowledge.associate";
  if (action === "Modifier le groupe") return "knowledge_ai.knowledge.group.update";
  if (action === "Supprimer") return "knowledge_ai.knowledge.group.delete";
  return "knowledge_ai.viewer.action";
}
