"use client";

import { useState } from "react";
import { structuredDataLabels } from "@/data/feature-catalog";
import { callBridgeAction } from "@/lib/bridge-actions";
import { ServiceIcon } from "@/components/ServiceIcon";

const chartTypes = ["Barres", "Barres horiz.", "Barres empilées", "Courbe", "Aire", "Camembert", "Anneau", "Nuage pts", "Radar"];
const rows = [
  ["Projet", "Sources", "Statut"],
  ["Bridge Template", "27", "Terminé"],
  ["Projet client secteur A", "42", "En cours..."],
  ["Veille technologique", "15", "Prêts"],
];

export function StructuredDataPanel() {
  const [selectedChart, setSelectedChart] = useState(chartTypes[0]);
  const [showSql, setShowSql] = useState(false);
  const [status, setStatus] = useState("Données structurées prêtes");

  async function run(action: string) {
    setStatus(`${action}...`);
    const result = await callBridgeAction("knowledge_ai.structured.fetch", {
      payload: { selectedChart },
    });
    setStatus(result.ok ? `${action} prêt via Bridge` : result.error ?? "Action Bridge indisponible");
  }

  return (
    <section className="service-panel structured-panel">
      <div className="viewer-title-row">
        <div>
          <span className="service-badge">GenBI local</span>
          <h2>Données structurées</h2>
          <p className="service-muted">Utilisez le chat GenBI pour interroger toutes les données.</p>
        </div>
        <button type="button" onClick={() => setShowSql((value) => !value)}>
          Voir la requête SQL
        </button>
      </div>
      <div className="chart-selector">
        {chartTypes.map((chart) => (
          <button key={chart} type="button" data-active={selectedChart === chart} onClick={() => setSelectedChart(chart)}>
            <ServiceIcon name="analytics" size={14} />
            {chart}
          </button>
        ))}
      </div>
      <div className="structured-chart">
        <strong>{selectedChart}</strong>
        <span>{structuredDataLabels.includes("Données CSV") ? "Données CSV" : "Tableur Excel"}</span>
      </div>
      {showSql ? (
        <pre className="sql-preview">{`select projet, sources, statut\nfrom knowledge_ai_structured_rows\nwhere organization_id = bridge.organization_id\norder by sources desc;`}</pre>
      ) : null}
      <div className="structured-table">
        {rows.map((row, rowIndex) => (
          <div key={row.join("-")} data-header={rowIndex === 0}>
            {row.map((cell) => <span key={cell}>{cell}</span>)}
          </div>
        ))}
      </div>
      <div className="knowledge-actions">
        {["Chargement des données...", "Récupération depuis la base de données", "Erreur de chargement", "Aucune donnée disponible"].map((action) => (
          <button key={action} type="button" onClick={() => void run(action)}>{action}</button>
        ))}
      </div>
      <p className="service-muted">{status}</p>
    </section>
  );
}
