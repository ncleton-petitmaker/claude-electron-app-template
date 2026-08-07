"use client";

import { useMemo, useRef, useState } from "react";
import { uploadAdvancedActions, uploadMethods, type UploadMethod } from "@/data/feature-catalog";
import { callBridgeAction } from "@/lib/bridge-actions";
import { ServiceIcon } from "@/components/ServiceIcon";

export function UploadHub() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMethod, setSelectedMethod] = useState<UploadMethod | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [advancedModal, setAdvancedModal] = useState<string | null>(null);
  const [status, setStatus] = useState("Aucun upload en cours");

  const categories = useMemo(() => {
    return uploadMethods.reduce<Record<string, typeof uploadMethods>>((acc, method) => {
      acc[method.category] = acc[method.category] ?? [];
      acc[method.category].push(method);
      return acc;
    }, {});
  }, []);

  function selectMethod(method: UploadMethod) {
    const config = uploadMethods.find((item) => item.id === method);
    setSelectedMethod(method);
    if (config?.acceptsFile) {
      fileInputRef.current?.click();
      return;
    }
    setModalOpen(true);
  }

  async function prepareUpload(data: Record<string, unknown>) {
    if (!selectedMethod) return;
    setStatus(`Preparation ${selectedMethod} via Bridge...`);
    const result = await callBridgeAction(uploadActionId(selectedMethod), {
      method: selectedMethod,
      ...data,
    });
    setStatus(result.ok ? "Upload prepare" : result.error ?? "Action upload indisponible");
    setModalOpen(false);
  }

  async function runAdvanced(action: string) {
    setStatus(`${action} via Bridge...`);
    const actionId = action.includes("Google Sheets") ? "knowledge_ai.upload.google_sheets" : action.includes("enregistrement") || action.includes("écran") || action.includes("ecran") ? "knowledge_ai.video.poll.start" : "knowledge_ai.upload.file";
    const result = await callBridgeAction(actionId, { payload: { action } });
    setStatus(result.ok ? `${action} pret` : result.error ?? "Action upload indisponible");
    setAdvancedModal(null);
  }

  return (
    <section className="upload-hub">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          setStatus(files.length ? `${files.length} fichier(s) selectionne(s) pour ${selectedMethod}` : "Aucun fichier selectionne");
          if (files.length && selectedMethod) {
            void callBridgeAction(uploadActionId(selectedMethod), {
              payload: {
                method: selectedMethod,
                fileNames: files.map((file) => file.name),
                contentTypes: files.map((file) => file.type),
              },
            });
          }
        }}
      />
      <div className="service-panel">
        <h2>Ajouter du contenu</h2>
        <p className="service-muted">Choisissez une methode pour ajouter des connaissances.</p>
      </div>
      <div className="service-panel">
        <h2>Uploads en cours</h2>
        <div className="service-row">
          <span>{status}</span>
          <button className="service-icon-button" type="button" aria-label="Annuler upload" onClick={() => setStatus("Annuler")}>
            <ServiceIcon name="close" size={14} />
          </button>
        </div>
        <div className="upload-progress">
          <span style={{ width: status.includes("selectionne") || status.includes("pret") ? "72%" : "18%" }} />
        </div>
      </div>
      {Object.entries(categories).map(([category, methods]) => (
        <section className="service-panel" key={category}>
          <h2>{category}</h2>
          <div className="upload-grid">
            {methods.map((method) => (
              <button className="upload-tile" key={method.id} type="button" onClick={() => selectMethod(method.id)}>
                <span className="upload-icon"><ServiceIcon name={method.icon} /></span>
                <strong>{method.label}</strong>
                <span>{method.description}</span>
                {method.requiresOAuth ? <small>OAuth Bridge</small> : null}
              </button>
            ))}
          </div>
        </section>
      ))}

      <section className="service-panel">
        <h2>Outils avances</h2>
        <div className="upload-grid">
          {uploadAdvancedActions.map((action) => (
            <button className="upload-tile" key={action} type="button" onClick={() => setAdvancedModal(action)}>
              <span className="upload-icon"><ServiceIcon name={action.includes("enregistrement") ? "video" : "upload"} /></span>
              <strong>{action}</strong>
              <span>Action compatible Bridge, sans appel IA externe direct.</span>
            </button>
          ))}
        </div>
      </section>

      {modalOpen && selectedMethod ? (
        <div className="service-modal" role="dialog" aria-modal="true">
          <div className="service-modal-panel">
            <div className="service-sidebar-header">
              <span />
              <strong>{uploadMethods.find((item) => item.id === selectedMethod)?.label}</strong>
              <button className="service-icon-button" type="button" onClick={() => setModalOpen(false)}>
                <ServiceIcon name="close" size={14} />
              </button>
            </div>
            <input className="service-input" placeholder={selectedMethod === "questionnaire" ? "Ex: Onboarding nouvel employé" : "Donnez un titre..."} />
            {selectedMethod === "spreadsheet" ? (
              <p className="service-muted">Fichier statique Excel ou CSV (import unique)</p>
            ) : null}
            {selectedMethod === "questionnaire" ? (
              <section className="service-panel subtle-panel">
                <h2>Créer un questionnaire</h2>
                <label className="modal-section">
                  <span>Titre du questionnaire *</span>
                  <input className="service-input" placeholder="Ex: Onboarding nouvel employé" />
                </label>
                <textarea className="service-textarea" placeholder="Décrivez le but de ce questionnaire..." />
              </section>
            ) : (
              <textarea className="service-textarea" placeholder={uploadPlaceholder(selectedMethod)} />
            )}
            <div className="service-modal-actions">
              <button type="button" onClick={() => setModalOpen(false)}>Annuler</button>
              <button className="service-button" type="button" onClick={() => void prepareUpload({ title: selectedMethod })}>
                Ajouter
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {advancedModal ? (
        <div className="service-modal" role="dialog" aria-modal="true">
          <div className="service-modal-panel">
            <div className="service-sidebar-header">
              <span />
              <strong>{advancedModal}</strong>
              <button className="service-icon-button" type="button" onClick={() => setAdvancedModal(null)} aria-label="Fermer">
                <ServiceIcon name="close" size={14} />
              </button>
            </div>
            {advancedModal.includes("Scanner") ? (
              <>
                <div className="scanner-frame">Scanner un document</div>
                <h3>Disponible sur iPhone</h3>
                <p className="service-muted">Le scanner utilise la caméra de votre iPhone pour numériser vos documents avec une qualité optimale.</p>
                <button className="service-button" type="button">Télécharger sur l'App Store</button>
                <p className="service-muted">Ou importez directement un PDF depuis votre ordinateur</p>
              </>
            ) : null}
            {advancedModal.includes("Google Sheets") ? (
              <div className="service-list">
                <div className="service-row"><span>Importer depuis Google Sheets</span><span className="service-badge">OAuth Bridge</span></div>
                <div className="service-row"><span>Connecter Google Sheets</span><span>Compte service configure par Bridge</span></div>
                <div className="service-row"><span>Se connecter avec Google</span><span>Connexion à Google...</span></div>
                <div className="service-row"><span>Compte connecté</span><span>Actualiser la liste</span></div>
                <label className="service-search">
                  <ServiceIcon name="search" size={15} />
                  <input type="search" placeholder="Rechercher un fichier..." />
                </label>
                <div className="service-row"><span>Aucun fichier trouvé</span><span>Essayez une autre recherche</span></div>
                <div className="service-row"><span>Chargement des fichiers...</span><span>Erreur de connexion · Réessayer</span></div>
                <p className="service-muted">Les données seront synchronisées automatiquement à chaque modification du fichier.</p>
              </div>
            ) : null}
            {advancedModal.includes("enregistrement") || advancedModal.includes("écran") || advancedModal.includes("ecran") ? (
              <>
                <div className="video-frame">Enregistrer votre écran</div>
                <p className="service-muted">Capturez votre écran pour créer des tutoriels, démonstrations ou présentations.</p>
                <div className="service-list">
                  <div className="service-row"><span>Autorisation en cours...</span><span>Sélectionnez l'écran à partager dans la fenêtre du navigateur</span></div>
                  <div className="service-row"><span>Enregistrement en cours...</span><span>Arrêter l'enregistrement</span></div>
                  <div className="service-row"><span>Prévisualisation</span><span>Recommencer</span></div>
                  <div className="service-row"><span>Non supporté</span><span>Arrêter le partage</span></div>
                </div>
              </>
            ) : null}
            <div className="service-modal-actions">
              <button type="button" onClick={() => setAdvancedModal(null)}>Annuler</button>
              <button className="service-button" type="button" onClick={() => void runAdvanced(advancedModal)}>
                {advancedModal.includes("Arrêter") ? "Enregistrement terminé" : "Démarrer l'enregistrement"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function uploadActionId(method: UploadMethod) {
  if (method === "text") return "knowledge_ai.upload.text";
  if (method === "url" || method === "web_scrape" || method === "unsplash" || method === "questionnaire") return "knowledge_ai.upload.url";
  if (method === "youtube") return "knowledge_ai.upload.youtube";
  if (method === "linkedin") return "knowledge_ai.upload.linkedin";
  if (method === "twitter") return "knowledge_ai.upload.twitter";
  if (method === "spreadsheet") return "knowledge_ai.upload.spreadsheet";
  if (method === "google_sheets") return "knowledge_ai.upload.google_sheets";
  return "knowledge_ai.upload.file";
}

function uploadPlaceholder(method: UploadMethod) {
  if (method === "text") return "Saisissez votre texte ici...";
  if (method === "url" || method === "web_scrape" || method === "unsplash") return "https://example.com/article";
  if (method === "youtube") return "https://www.youtube.com/watch?v=...";
  if (method === "linkedin") return "https://www.linkedin.com/posts/...";
  if (method === "twitter") return "https://x.com/user/status/... ou https://twitter.com/...";
  return "Texte, URL, identifiant ou consigne...";
}
