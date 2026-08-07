"use client";

import { useState } from "react";
import Link from "next/link";
import { AppChromeHeader } from "@/components/AppChromeHeader";
import { Icon } from "@/components/Icon";
import { apiFetch } from "@/lib/api-client";

/**
 * Point d'entree du CRM commercial.
 *
 * Cette page n'affiche pas de CRM : elle ouvre celui du client, qui vit
 * dans son propre deploiement. Le bouton demande un billet de lancement au
 * plan de controle, puis suit l'adresse qu'il renvoie. Bridge ne detient
 * donc jamais de session du CRM, et le lien est mort cinq minutes plus tard.
 */
export function SalesCrmServiceLauncher() {
  const serviceUrl = process.env.NEXT_PUBLIC_SALES_CRM_SERVICE_URL;
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setOpening(true);
    setError(null);
    try {
      const response = await apiFetch("/bridge/launch-ticket", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payload: { serviceId: "sales_crm" } }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        launchUrl?: string;
      };
      if (!response.ok || !data.ok || !data.launchUrl) {
        throw new Error(data.error ?? `Le plan de controle a repondu ${response.status}.`);
      }
      window.location.href = data.launchUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setOpening(false);
    }
  }

  return (
    <div className="app">
      <AppChromeHeader />
      <main className="shell" style={{ padding: 24 }}>
        <section style={{ width: "min(920px, 100%)", display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gap: 7 }}>
            <span className="eyebrow">Service CRM commercial</span>
            <h1>Le CRM est un service indépendant</h1>
            <p style={{ color: "var(--muted)", maxWidth: 720 }}>
              Les fiches, le pipeline, les campagnes et l&apos;assistant vivent dans
              l&apos;application CRM du client, avec sa propre base. Bridge garde le
              contrat, les droits et l&apos;ouverture de session.
            </p>
          </div>

          {error ? (
            <div
              className="card"
              style={{ padding: 14, borderColor: "var(--red-border)", color: "var(--red-fg)", userSelect: "all" }}
            >
              {error}
            </div>
          ) : null}

          <section className="admin-grid">
            <article className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
              <Icon name="external-link" size={16} />
              <strong style={{ color: "var(--fg-strong)" }}>App web dédiée</strong>
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                URL attendue : <code>crm.&lt;client-domain&gt;</code>
              </p>
            </article>
            <article className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
              <Icon name="check" size={16} />
              <strong style={{ color: "var(--fg-strong)" }}>Ouverture par billet</strong>
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                Billet à usage unique, valable cinq minutes. Aucune session CRM
                n&apos;est stockée dans Bridge.
              </p>
            </article>
            <article className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
              <Icon name="settings" size={16} />
              <strong style={{ color: "var(--fg-strong)" }}>Admin Bridge</strong>
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                URL du service, jeton de service, état de santé et droits.
              </p>
            </article>
          </section>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn primary"
              type="button"
              onClick={() => void open()}
              disabled={!serviceUrl || opening}
              title={serviceUrl ? "Ouvrir le CRM" : "Renseigner NEXT_PUBLIC_SALES_CRM_SERVICE_URL"}
            >
              <Icon name="external-link" size={14} />
              {!serviceUrl ? "Service non configuré" : opening ? "Ouverture…" : "Ouvrir le CRM"}
            </button>
            <Link className="btn ghost" href="/admin/sales-crm">
              <Icon name="settings" size={14} />
              Configurer
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
