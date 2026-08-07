"use client";

import Link from "next/link";
import { AppChromeHeader } from "@/components/AppChromeHeader";
import { Icon } from "@/components/Icon";

export function KnowledgeAiServiceLauncher() {
  const serviceUrl = process.env.NEXT_PUBLIC_KNOWLEDGE_AI_SERVICE_URL;

  return (
    <div className="app">
      <AppChromeHeader />
      <main className="shell" style={{ padding: 24 }}>
        <section style={{ width: "min(920px, 100%)", display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gap: 7 }}>
            <span className="eyebrow">Service Connaissance</span>
            <h1>Connaissance est un service indépendant</h1>
            <p style={{ color: "var(--muted)", maxWidth: 720 }}>
              Cette route Bridge sert uniquement de point d'entrée. Le chat, les fichiers, les agents, les projets et l'historique doivent vivre dans l'application Connaissance dédiée, déployée sur son propre Coolify.
            </p>
          </div>

          <section className="admin-grid">
            <article className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
              <Icon name="external-link" size={16} />
              <strong style={{ color: "var(--fg-strong)" }}>App web dédiée</strong>
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                URL attendue : <code>connaissance.&lt;client-domain&gt;</code>
              </p>
            </article>
            <article className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
              <Icon name="cpu" size={16} />
              <strong style={{ color: "var(--fg-strong)" }}>Runtime local-only</strong>
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                Bridge Codex, LM Studio local puis DGX Spark LAN. Aucune bascule vers un provider IA externe.
              </p>
            </article>
            <article className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
              <Icon name="settings" size={16} />
              <strong style={{ color: "var(--fg-strong)" }}>Admin Bridge</strong>
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                Configuration, scopes, healthcheck, URL service et tickets de lancement.
              </p>
            </article>
          </section>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {serviceUrl ? (
              <a className="btn primary" href={serviceUrl}>
                <Icon name="external-link" size={14} />
                Ouvrir Connaissance
              </a>
            ) : (
              <button className="btn primary" type="button" disabled>
                <Icon name="external-link" size={14} />
                Service non configuré
              </button>
            )}
            <Link className="btn ghost" href="/admin/knowledge-ai">
              <Icon name="settings" size={14} />
              Configurer
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
