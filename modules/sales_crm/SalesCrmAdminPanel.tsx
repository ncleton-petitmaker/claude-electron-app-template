"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { apiFetch } from "@/lib/api-client";

/**
 * Administration du rattachement au CRM commercial.
 *
 * On y verifie une seule chose, mais celle qui casse en premier : le CRM
 * repond-il, et sous quelle version de contrat. Le jeton de service, lui,
 * ne s'affiche jamais ici : il est detenu cote serveur, dans la
 * configuration du service Bridge.
 */

interface CrmHealth {
  reachable: boolean;
  status: number | null;
  serviceUrl: string | null;
  tenant?: string | null;
  toolCount?: number | null;
  detail: string;
  checkedAt: string;
}

interface ActionEnvelope<T> {
  ok?: boolean;
  output?: T;
  error?: string;
}

async function callAction<T>(id: string, body: Record<string, unknown> = {}): Promise<T> {
  const response = await apiFetch(`/api/actions/${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as ActionEnvelope<T>;
  if (!response.ok || data.ok === false || !data.output) {
    throw new Error(data.error ?? `Action ${id} indisponible`);
  }
  return data.output;
}

export function SalesCrmAdminPanel() {
  const [health, setHealth] = useState<CrmHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const serviceUrl = process.env.NEXT_PUBLIC_SALES_CRM_SERVICE_URL;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const result = await callAction<CrmHealth>("sales_crm.service.health");
        if (!cancelled) setHealth(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {error ? (
        <div
          className="card"
          style={{ padding: 14, borderColor: "var(--red-border)", color: "var(--red-fg)", userSelect: "all" }}
        >
          {error}
        </div>
      ) : null}

      <section className="admin-grid">
        <article className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
          <span className="eyebrow">Architecture</span>
          <strong style={{ color: "var(--fg-strong)", fontSize: 16 }}>Service web indépendant</strong>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            Bridge garde le contrat, les scopes et les billets de lancement. Le CRM
            apporte son propre déploiement et son propre stack Supabase par tenant.
          </p>
        </article>

        <article className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
          <span className="eyebrow">Surface consommée</span>
          <strong style={{ color: "var(--fg-strong)", fontSize: 16 }}>Contrat OpenAPI</strong>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            Les actions <code>sales_crm.*</code> n&apos;appellent que{" "}
            <code>POST /api/tools/&lt;module&gt;/&lt;outil&gt;</code>, jamais les routes
            REST historiques du CRM.
          </p>
        </article>

        <article className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
          <span className="eyebrow">Service URL</span>
          <strong style={{ color: "var(--fg-strong)", fontSize: 16 }}>
            {serviceUrl ? "Configurée" : "Non configurée"}
          </strong>
          <code style={{ color: "var(--muted)", overflowWrap: "anywhere" }}>
            {serviceUrl ?? "NEXT_PUBLIC_SALES_CRM_SERVICE_URL"}
          </code>
        </article>
      </section>

      <section className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <span className="eyebrow">État du service</span>
            <h2 style={{ marginTop: 6, fontSize: 20 }}>
              {health?.reachable ? "Le CRM répond" : "Le CRM ne répond pas"}
            </h2>
          </div>
          <span className={`badge ${health?.reachable ? "ok" : "warn"}`}>
            {health ? (health.reachable ? "joignable" : "injoignable") : "vérification…"}
          </span>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, userSelect: "all" }}>
          {health?.detail ?? "Interrogation de l'état de santé du CRM."}
        </p>
        {health?.toolCount ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            Contrat annoncé : <strong>{health.toolCount}</strong> outils exposés
            {health.tenant ? (
              <>
                {" "}
                pour le tenant <code>{health.tenant}</code>
              </>
            ) : null}
            .
          </p>
        ) : null}
      </section>

      <section className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
        <span className="eyebrow">Jeton de service</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Icon name="settings" size={14} />
          <strong style={{ color: "var(--fg-strong)" }}>Détenu côté serveur</strong>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          Le jeton qui authentifie Bridge auprès du CRM vit dans la configuration
          du service, jamais dans le navigateur. Il s&apos;émet depuis le CRM avec{" "}
          <code>service-token.ts create</code> et se révoque de la même façon.
        </p>
      </section>
    </div>
  );
}
