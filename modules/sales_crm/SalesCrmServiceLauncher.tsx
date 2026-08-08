"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";

/**
 * Ouverture du CRM commercial.
 *
 * Cette page n'affiche pas de CRM et n'en reproduit aucun morceau : elle
 * emmene l'utilisateur dans l'application CRM du client, la vraie, celle
 * qui a ses fiches, son pipeline et son assistant.
 *
 * Elle ne montre donc rien a lire. Elle demande un billet de lancement au
 * plan de controle et suit l'adresse renvoyee. Ce qui reste a l'ecran ne
 * sert qu'aux deux cas ou l'on ne peut pas partir : service non configure,
 * ou billet refuse.
 *
 * Le detour par le billet, plutot qu'un lien direct, est ce qui evite de
 * redemander un mot de passe : le CRM echange le billet contre une session.
 */
export function SalesCrmServiceLauncher() {
  const serviceUrl = process.env.NEXT_PUBLIC_SALES_CRM_SERVICE_URL;
  const [error, setError] = useState<string | null>(null);
  // React monte deux fois les effets en developpement. Sans ce garde-fou,
  // deux billets sont demandes et le premier est perdu.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!serviceUrl) {
      setError(
        "CRM non configure : renseigner NEXT_PUBLIC_SALES_CRM_SERVICE_URL, puis relancer.",
      );
      return;
    }

    void (async () => {
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
        if (response.ok && data.ok && data.launchUrl) {
          window.location.replace(data.launchUrl);
          return;
        }
        // Sans plan de controle joignable, on ouvre quand meme le CRM :
        // l'utilisateur y arrivera par son ecran de connexion plutot que
        // de rester bloque devant un message.
        console.warn(
          `[sales_crm] billet indisponible (${data.error ?? response.status}), ouverture directe`,
        );
        window.location.replace(serviceUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [serviceUrl]);

  if (error) {
    return (
      <div className="app">
        <main className="shell" style={{ padding: 24 }}>
          <section style={{ width: "min(640px, 100%)", display: "grid", gap: 12 }}>
            <h1 style={{ fontSize: 20 }}>Le CRM n&apos;a pas pu s&apos;ouvrir</h1>
            <div
              className="card"
              style={{
                padding: 14,
                borderColor: "var(--red-border)",
                color: "var(--red-fg)",
                userSelect: "all",
              }}
            >
              {error}
            </div>
            {serviceUrl ? (
              <a className="btn primary" href={serviceUrl}>
                Ouvrir le CRM sans session
              </a>
            ) : null}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <main className="shell" style={{ padding: 24, color: "var(--muted)" }}>
        Ouverture du CRM…
      </main>
    </div>
  );
}
