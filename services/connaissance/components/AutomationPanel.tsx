"use client";

import { useState } from "react";
import { automationItems } from "@/data/feature-catalog";
import { callBridgeAction } from "@/lib/bridge-actions";
import { ServiceIcon } from "@/components/ServiceIcon";

interface AutomationPanelProps {
  sourceId: string;
}

export function AutomationPanel({ sourceId }: AutomationPanelProps) {
  const [status, setStatus] = useState("Automatisation prete via Bridge");

  async function runAutomation(action: string) {
    setStatus(`${action}...`);
    const result = await callBridgeAction("knowledge_ai.automation.run", {
      resourceId: sourceId,
      payload: { action },
    });
    setStatus(result.ok ? `${action} pret` : result.error ?? "Action Bridge indisponible");
  }

  return (
    <section className="service-panel">
      <div className="viewer-title-row">
        <h2>Automatisation</h2>
        <span className="service-badge">Bridge</span>
      </div>
      <div className="service-list">
        {automationItems.map((item) => (
          <div className="service-row" key={item}>
            <span>{item}</span>
            <button className="service-icon-button" type="button" onClick={() => void runAutomation(item)} aria-label={item}>
              <ServiceIcon name={item.includes("Copier") ? "file" : "settings"} size={14} />
            </button>
          </div>
        ))}
      </div>
      <p className="service-muted">{status}</p>
    </section>
  );
}
