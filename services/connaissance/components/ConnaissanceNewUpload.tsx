"use client";

import { useEffect, useRef, useState } from "react";
import { callBridgeAction } from "@/lib/bridge-actions";
import { GoogleSheetsPickerModal } from "@/components/GoogleSheetsPickerModal";
import { UploadProgressPanel } from "@/components/UploadProgress";
import {
  fileNameForUpload,
  uploadActionId,
  uploadMethodConfigs,
  uploadPlaceholder,
  type UploadMethod,
  type UploadProgressItem,
} from "@/components/UploadTypes";

type SourceUploadType = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
};

const contentUploadTypes: SourceUploadType[] = [
  { id: "pdf", name: "PDF", description: "Importez des documents PDF", icon: "doc", color: "#EF4444" },
  { id: "scanner", name: "Scanner", description: "Scannez avec la caméra", icon: "scan", color: "#FF453A" },
  { id: "video", name: "Vidéo", description: "Enregistrez ou importez une vidéo", icon: "video", color: "#3B82F6" },
  { id: "screenrecord", name: "Écran", description: "Enregistrez votre écran", icon: "monitor", color: "#8B5CF6" },
  { id: "audio", name: "Audio", description: "Enregistrez ou importez de l'audio", icon: "waveform", color: "#A855F7" },
  { id: "url", name: "URL", description: "Ajoutez une page web", icon: "link", color: "#22C55E" },
  { id: "text", name: "Texte", description: "Rédigez du contenu texte", icon: "text", color: "#F97316" },
  { id: "spreadsheet", name: "Données", description: "Importez CSV ou Excel pour analyse", icon: "table", color: "#228B22" },
];

const socialUploadTypes: SourceUploadType[] = [
  { id: "youtube", name: "YouTube", description: "Importez une vidéo YouTube", icon: "youtube", color: "#FF0000" },
  { id: "linkedin", name: "LinkedIn", description: "Importez un post LinkedIn", icon: "briefcase", color: "#0077B5" },
  { id: "twitter", name: "X", description: "Importez un post X (Twitter)", icon: "twitter", color: "#000000" },
];

const questionnaireTypes: SourceUploadType[] = [
  { id: "generate", name: "Générer un nouveau questionnaire", description: "Créez avec l'IA", icon: "wand", color: "#D4AF37" },
  { id: "share", name: "Partager un questionnaire existant", description: "Partagez un lien", icon: "linkplus", color: "#D4AF37" },
];

export function ConnaissanceNewUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMethod, setSelectedMethod] = useState<UploadMethod | null>(null);
  const [modalMethod, setModalMethod] = useState<UploadMethod | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [screenRecordOpen, setScreenRecordOpen] = useState(false);
  const [dataSourceOpen, setDataSourceOpen] = useState(false);
  const [sheetsOpen, setSheetsOpen] = useState(false);
  const [questionnaireMode, setQuestionnaireMode] = useState<"generate" | "share" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [activeUploads, setActiveUploads] = useState<UploadProgressItem[]>([]);

  async function runAction(id: string, input: Record<string, unknown> = {}) {
    const result = await callBridgeAction(id, input);
    setStatus(result.ok ? "Terminé" : result.error ?? "Action Bridge indisponible");
    return result;
  }

  async function runUpload(method: UploadMethod, payload: Record<string, unknown>) {
    const fileName = fileNameForUpload(method, payload);
    const uploadId = `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setStatus("Traitement en cours...");
    setActiveUploads((current) => [
      {
        id: uploadId,
        method,
        fileName,
        status: "uploading",
        progress: 34,
        stage: "Upload du fichier...",
      },
      ...current,
    ]);

    setTimeout(() => {
      setActiveUploads((current) =>
        current.map((upload) =>
          upload.id === uploadId && upload.status === "uploading"
            ? { ...upload, status: "processing", progress: 68, stage: "Traitement en cours..." }
            : upload,
        ),
      );
    }, 350);

    const result = await runAction(uploadActionId(method), { payload: { method, ...payload } });
    setActiveUploads((current) =>
      current.map((upload) =>
        upload.id === uploadId
          ? result.ok
            ? { ...upload, status: "complete", progress: 100, stage: "Terminé" }
            : { ...upload, status: "error", progress: 100, error: result.error ?? "Erreur" }
          : upload,
      ),
    );
  }

  function handleUploadClick(typeId: string) {
    setStatus(null);

    if (typeId === "scanner") {
      setScannerOpen(true);
      return;
    }

    if (typeId === "screenrecord") {
      setScreenRecordOpen(true);
      return;
    }

    if (typeId === "spreadsheet") {
      setDataSourceOpen(true);
      return;
    }

    if (typeId === "generate" || typeId === "share") {
      setQuestionnaireMode(typeId);
      return;
    }

    const method = typeId === "twitter" ? "twitter" : (typeId as UploadMethod);
    const config = uploadMethodConfigs[method];
    setSelectedMethod(method);

    if (config.acceptedTypes?.length) {
      if (fileInputRef.current) {
        fileInputRef.current.accept = config.acceptedTypes.join(",");
        fileInputRef.current.click();
      }
      return;
    }

    setModalMethod(method);
  }

  function handleStaticSpreadsheetSelect() {
    setDataSourceOpen(false);
    setSelectedMethod("spreadsheet");
    if (fileInputRef.current) {
      fileInputRef.current.accept = uploadMethodConfigs.spreadsheet.acceptedTypes?.join(",") ?? ".csv,.xlsx,.xls";
      fileInputRef.current.click();
    }
  }

  return (
    <div className="knowledge-source-app">
      <aside className="knowledge-source-sidebar">
        <div className="knowledge-source-logo">
          <span>C</span>
          <strong>Connaissance</strong>
        </div>

        <div className="knowledge-source-mode-switch" role="group" aria-label="Mode">
          <a className="active" href="/chat">
            <ChatIcon />
            <span>Chat</span>
          </a>
          <a href="/dashboard">
            <DatabaseIcon />
            <span>Admin</span>
          </a>
        </div>

        <nav className="knowledge-source-nav" aria-label="Navigation principale">
          <a href="/chat">
            <ChatIcon />
            <span>Chat</span>
          </a>
          <a className="active" href="/upload">
            <PlusIcon />
            <span>Ajouter</span>
          </a>
          <a href="/dashboard">
            <RefreshIcon />
            <span>Connaissances</span>
          </a>
        </nav>

        <div className="knowledge-source-sidebar-spacer" aria-hidden="true" />

        <button
          className="knowledge-source-profile"
          type="button"
          onClick={() => {
            window.location.href = "/settings";
          }}
        >
          <span>NC</span>
          <div>
            <strong>Nicolas Cleton</strong>
            <small>demo@example.test</small>
          </div>
          <ChevronRightIcon />
        </button>
      </aside>

      <main className="knowledge-source-main knowledge-source-upload-main">
        <section className="knowledge-v2-upload-hub">
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (!selectedMethod || files.length === 0) return;
              void runUpload(selectedMethod, {
                fileNames: files.map((file) => file.name),
                contentTypes: files.map((file) => file.type),
              });
              event.target.value = "";
            }}
          />

          {activeUploads.length > 0 && (
            <UploadProgressPanel
              uploads={activeUploads}
              onCancel={(id) => {
                setActiveUploads((current) => current.filter((upload) => upload.id !== id));
                void runAction("knowledge_ai.knowledge.processing.remove", { resourceId: id });
              }}
              onClear={() => setActiveUploads((current) => current.filter((upload) => upload.status !== "complete" && upload.status !== "error"))}
            />
          )}

          <div className="knowledge-v2-source-upload">
            <div className="knowledge-v2-source-upload-head">
              <div>
                <PlusIcon />
              </div>
              <h1>Ajouter du contenu</h1>
            </div>

            <div className="knowledge-v2-source-upload-grid">
              {contentUploadTypes.map((type) => (
                <SourceUploadCard key={type.id} type={type} onClick={() => handleUploadClick(type.id)} />
              ))}
            </div>

            <section className="knowledge-v2-source-upload-section">
              <GlobeIcon />
              <h2>Réseaux sociaux</h2>
              <div className="knowledge-v2-source-upload-grid social">
                {socialUploadTypes.map((type) => (
                  <SourceUploadCard key={type.id} type={type} onClick={() => handleUploadClick(type.id)} />
                ))}
              </div>
            </section>

            <section className="knowledge-v2-source-upload-section">
              <PersonGroupIcon />
              <h2>Demander la connaissance à des tiers</h2>
              <div className="knowledge-v2-source-upload-grid questionnaire">
                {questionnaireTypes.map((type) => (
                  <SourceUploadCard key={type.id} type={type} onClick={() => handleUploadClick(type.id)} />
                ))}
              </div>
            </section>
          </div>
        </section>
      </main>

      {modalMethod && (
        <UploadModal
          method={modalMethod}
          onClose={() => setModalMethod(null)}
          onSubmit={async (payload) => {
            await runUpload(modalMethod, payload);
            setModalMethod(null);
          }}
        />
      )}

      {scannerOpen && (
        <ScannerModal
          onClose={() => setScannerOpen(false)}
          onImportPdf={() => {
            setScannerOpen(false);
            setSelectedMethod("pdf");
            fileInputRef.current?.click();
          }}
        />
      )}

      {screenRecordOpen && (
        <ScreenRecordModal
          onClose={() => setScreenRecordOpen(false)}
          onRecordingComplete={async (fileName) => {
            await runUpload("screenrecord", {
              fileName,
              contentType: "video/webm",
              source: "screen-recording",
            });
            setScreenRecordOpen(false);
          }}
        />
      )}

      {dataSourceOpen && (
        <DataSourceModal
          onClose={() => setDataSourceOpen(false)}
          onStaticFile={handleStaticSpreadsheetSelect}
          onGoogleSheets={() => {
            setDataSourceOpen(false);
            setSheetsOpen(true);
          }}
        />
      )}

      {questionnaireMode && (
        <QuestionnaireActionModal
          mode={questionnaireMode}
          onClose={() => setQuestionnaireMode(null)}
          onSubmit={async (payload) => {
            const actionId = questionnaireMode === "generate" ? "knowledge_ai.questionnaire.generate" : "knowledge_ai.questionnaire.share";
            const result = await runAction(actionId, { payload });
            if (!result.ok) throw new Error(result.error ?? "Action questionnaire indisponible");
            setQuestionnaireMode(null);
          }}
        />
      )}

      {sheetsOpen && (
        <GoogleSheetsPickerModal
          open={sheetsOpen}
          onOpenChange={setSheetsOpen}
          onConnect={async () => {
            const result = await runAction("knowledge_ai.upload.google_sheets", { payload: { connection: "bridge-oauth-connect" } });
            if (!result.ok) throw new Error(result.error ?? "Connexion Google Sheets Bridge indisponible");
          }}
          onSearch={async (query) => {
            const result = await runAction("knowledge_ai.upload.google_sheets", { payload: { operation: "list_spreadsheets", query } });
            if (!result.ok) throw new Error(result.error ?? "Liste Google Sheets indisponible");
            return [
              {
                id: "bridge-sheets-demo-1",
                name: query ? `Résultat Bridge pour ${query}` : "Tableau de connaissances",
                url: "bridge://knowledge_ai/google_sheets/bridge-sheets-demo-1",
                fileType: "application/vnd.google-apps.spreadsheet",
              },
            ];
          }}
          onSelect={async (spreadsheet) => {
            await runUpload("google_sheets", spreadsheet);
            setSheetsOpen(false);
          }}
        />
      )}
    </div>
  );
}

function SourceUploadCard({ type, onClick }: { type: SourceUploadType; onClick: () => void }) {
  return (
    <button className="knowledge-v2-source-upload-card glass-card" onClick={onClick}>
      <span style={{ background: `linear-gradient(135deg, ${type.color}, ${type.color}dd)` }}>
        <UploadTypeIcon type={type.icon} />
      </span>
      <strong>{type.name}</strong>
    </button>
  );
}

function UploadModal({ method, onSubmit, onClose }: { method: UploadMethod; onSubmit: (payload: Record<string, unknown>) => Promise<void>; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const config = uploadMethodConfigs[method];
  const isTextArea = method === "text";

  return (
    <div className="knowledge-v2-modal" role="dialog" aria-modal="true" aria-label={config.label}>
      <div className="knowledge-v2-source-modal-panel">
        <div className="knowledge-v2-modal-head">
          <div>
            <h2>{config.label}</h2>
            <p>{config.description}</p>
          </div>
          <button className="nav-icon-btn nav-icon-btn-small" onClick={onClose} aria-label="Fermer">
            <CloseIcon />
          </button>
        </div>

        <label className="knowledge-v2-field">
          <span>Titre (optionnel)</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Donnez un titre à ce contenu" />
        </label>

        {isTextArea ? (
          <label className="knowledge-v2-field">
            <span>Contenu</span>
            <textarea value={value} onChange={(event) => setValue(event.target.value)} rows={8} placeholder="Saisissez votre texte..." />
          </label>
        ) : (
          <label className="knowledge-v2-field">
            <span>URL</span>
            <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={uploadPlaceholder(method)} />
          </label>
        )}

        <div className="knowledge-v2-source-modal-actions">
          <button onClick={onClose}>Annuler</button>
          <button onClick={() => onSubmit({ title, value })} disabled={!value.trim()}>Ajouter</button>
        </div>
      </div>
    </div>
  );
}

function DataSourceModal({
  onClose,
  onStaticFile,
  onGoogleSheets,
}: {
  onClose: () => void;
  onStaticFile: () => void;
  onGoogleSheets: () => void;
}) {
  return (
    <div className="knowledge-v2-modal" role="dialog" aria-modal="true" aria-label="Importer des données">
      <div className="knowledge-v2-source-modal-panel knowledge-v2-data-source-modal">
        <div className="knowledge-v2-data-source-head">
          <h2>Importer des données</h2>
          <p>Choisissez votre source de données</p>
        </div>
        <div className="knowledge-v2-data-source-list">
          <button onClick={onStaticFile}>
            <span><TableIcon /></span>
            <div>
              <strong>Fichier statique</strong>
              <small>Excel ou CSV (import unique)</small>
            </div>
          </button>
          <button onClick={onGoogleSheets}>
            <span><SheetMiniIcon /></span>
            <div>
              <strong>Google Sheets</strong>
              <small>Synchronisé automatiquement</small>
            </div>
          </button>
        </div>
        <button className="knowledge-v2-data-source-cancel" onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
}

function QuestionnaireActionModal({
  mode,
  onSubmit,
  onClose,
}: {
  mode: "generate" | "share";
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isGenerate = mode === "generate";

  async function submit() {
    if (!title.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await onSubmit({ mode, title, details });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action questionnaire indisponible");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="knowledge-v2-modal" role="dialog" aria-modal="true" aria-label={isGenerate ? "Créer un questionnaire" : "Partager un questionnaire"}>
      <div className="knowledge-v2-source-modal-panel">
        <div className="knowledge-v2-modal-head">
          <div>
            <h2>{isGenerate ? "Créer un questionnaire" : "Partager un questionnaire"}</h2>
            <p>{isGenerate ? "Préparez un questionnaire à envoyer à des tiers." : "Préparez un lien de questionnaire existant."}</p>
          </div>
          <button className="nav-icon-btn nav-icon-btn-small" onClick={onClose} aria-label="Fermer">
            <CloseIcon />
          </button>
        </div>

        <label className="knowledge-v2-field">
          <span>Titre du questionnaire *</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex: Onboarding nouvel employé" />
        </label>

        <label className="knowledge-v2-field">
          <span>{isGenerate ? "Objectif" : "Message d'accompagnement"}</span>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={5}
            placeholder={isGenerate ? "Décrivez le but de ce questionnaire..." : "Ajoutez un contexte pour les destinataires..."}
          />
        </label>

        {error && <p className="knowledge-v2-modal-error">{error}</p>}

        <div className="knowledge-v2-source-modal-actions">
          <button onClick={onClose} disabled={isLoading}>Annuler</button>
          <button onClick={submit} disabled={!title.trim() || isLoading}>{isLoading ? "Traitement..." : isGenerate ? "Créer" : "Partager"}</button>
        </div>
      </div>
    </div>
  );
}

function ScannerModal({ onClose, onImportPdf }: { onClose: () => void; onImportPdf: () => void }) {
  return (
    <div className="knowledge-v2-modal" role="dialog" aria-modal="true" aria-label="Scanner">
      <div className="knowledge-v2-source-modal-panel">
        <div className="knowledge-v2-modal-head">
          <div>
            <h2>Scanner un document</h2>
            <p>Le scanner utilise la caméra de votre iPhone pour numériser vos documents avec une qualité optimale.</p>
          </div>
          <button className="nav-icon-btn nav-icon-btn-small" onClick={onClose} aria-label="Fermer">
            <CloseIcon />
          </button>
        </div>
        <div className="knowledge-v2-device-frame">
          <ScanIcon />
        </div>
        <div className="knowledge-v2-source-modal-actions">
          <button onClick={onImportPdf}>Importer un PDF</button>
          <button onClick={onClose}>Télécharger sur l'App Store</button>
        </div>
      </div>
    </div>
  );
}

function ScreenRecordModal({
  onClose,
  onRecordingComplete,
}: {
  onClose: () => void;
  onRecordingComplete: (fileName: string) => Promise<void>;
}) {
  const [state, setState] = useState<"idle" | "requesting" | "recording" | "preview" | "error">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("recording.webm");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      stopTimer();
      stopStream();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function stopTimer() {
    if (!timerRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function startRecording() {
    if (!navigator.mediaDevices || !("getDisplayMedia" in navigator.mediaDevices)) {
      setError("L'enregistrement d'écran n'est pas disponible dans ce navigateur.");
      setState("error");
      return;
    }

    try {
      setState("requesting");
      setError(null);
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setFileName(`screen-recording-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.webm`);
        setState("preview");
        stopTimer();
        stopStream();
      };
      recorder.start();
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
      setState("recording");
    } catch {
      setError("Permission refusée ou capture interrompue.");
      setState("error");
      stopTimer();
      stopStream();
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  async function importRecording() {
    await onRecordingComplete(fileName);
  }

  return (
    <div className="knowledge-v2-modal" role="dialog" aria-modal="true" aria-label="Enregistrer l'écran">
      <div className="knowledge-v2-source-modal-panel">
        <div className="knowledge-v2-modal-head">
          <div>
            <h2>Enregistrer l'écran</h2>
            <p>Capturez une démonstration ou une procédure, puis ajoutez-la à vos connaissances.</p>
          </div>
          <button className="nav-icon-btn nav-icon-btn-small" onClick={onClose} aria-label="Fermer">
            <CloseIcon />
          </button>
        </div>

        <div className={`knowledge-v2-screen-frame ${state}`}>
          {previewUrl ? (
            <video src={previewUrl} controls />
          ) : (
            <>
              <MonitorIcon />
              <strong>{state === "recording" ? formatDuration(seconds) : state === "requesting" ? "Autorisation en cours..." : "Prêt à enregistrer"}</strong>
              {error && <span>{error}</span>}
            </>
          )}
        </div>

        <div className="knowledge-v2-source-modal-actions">
          {state === "recording" ? (
            <button onClick={stopRecording}>Arrêter</button>
          ) : (
            <button onClick={startRecording}>Démarrer l'enregistrement</button>
          )}
          <button onClick={importRecording} disabled={!previewUrl}>Ajouter</button>
        </div>
      </div>
    </div>
  );
}

function NavIconButton({ href, icon, tooltip, active }: { href: string; icon: React.ReactNode; tooltip: string; active?: boolean }) {
  return (
    <a className={`nav-icon-btn ${active ? "active" : ""}`} href={href} title={tooltip} aria-label={tooltip}>
      {icon}
    </a>
  );
}

function UploadTypeIcon({ type }: { type: string }) {
  if (type === "doc") return <svg className="icon-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 2.25h7.1L18 7.15V20a1.75 1.75 0 0 1-1.75 1.75H6A1.75 1.75 0 0 1 4.25 20V4A1.75 1.75 0 0 1 6 2.25Zm6.5 1.5V8h4.25L12.5 3.75ZM7.25 13h7.5v-1.5h-7.5V13Zm0 3h7.5v-1.5h-7.5V16Z" /></svg>;
  if (type === "scan") return <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7V5a1 1 0 0 1 1-1h2m10 0h2a1 1 0 0 1 1 1v2M4 17v2a1 1 0 0 0 1 1h2m10 0h2a1 1 0 0 0 1-1v-2M7 9h10M7 13h10M7 17h6" /></svg>;
  if (type === "video") return <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m15 10 4.5-2.25A1 1 0 0 1 21 8.65v6.7a1 1 0 0 1-1.5.9L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z" /></svg>;
  if (type === "monitor") return <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17h6m-8 4h10M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" /></svg>;
  if (type === "waveform") return <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 12h1m3 6V6m4 14V4m4 14V6m3 6h1" /></svg>;
  if (type === "link" || type === "linkplus") return <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.8 10.2a4 4 0 0 0-5.6 0l-4 4a4 4 0 0 0 5.6 5.6l1.1-1.1m-.7-4.9a4 4 0 0 0 5.6 0l4-4a4 4 0 0 0-5.6-5.6l-1.1 1.1" /></svg>;
  if (type === "text") return <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h16" /></svg>;
  if (type === "table") return <TableIcon />;
  if (type === "youtube") return <svg className="icon-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" /></svg>;
  if (type === "briefcase") return <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6h4m-8 4h12M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Zm6-2a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2" /></svg>;
  if (type === "twitter") return <svg className="icon-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.96 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" /></svg>;
  if (type === "wand") return <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m15 4 5 5M14 5l5 5M4 20l9-9m1-7 6 6-9 9H5v-6l9-9Z" /></svg>;
  return <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" /></svg>;
}

const PlusIcon = () => <svg className="icon-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const GlobeIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5 0 4.5-4 4.5-9S14.5 3 12 3s-4.5 4-4.5 9 2 9 4.5 9Zm-8.5-9h17" /></svg>;
const PersonGroupIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.1a9.4 9.4 0 0 0 2.6.4 9.3 9.3 0 0 0 4.1-.9 4.1 4.1 0 0 0-7.5-2.5M15 19.1v.1A12.3 12.3 0 0 1 8.6 21a12.3 12.3 0 0 1-6.4-1.8v-.1a6.4 6.4 0 0 1 12-3.1M12 6.4a3.4 3.4 0 1 1-6.8 0 3.4 3.4 0 0 1 6.8 0Zm8.3 2.2a2.6 2.6 0 1 1-5.3 0 2.6 2.6 0 0 1 5.3 0Z" /></svg>;
const TableIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16M8 6v12m8-12v12" /></svg>;
const SheetMiniIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z" /></svg>;
const ChatIcon = () => <svg className="icon-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
const UploadIcon = () => <svg className="icon-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;
const DashboardIcon = () => <svg className="icon-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
const DatabaseIcon = () => <svg className="icon-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6c0 1.66-3.69 3-8.25 3S3.75 7.66 3.75 6 7.44 3 12 3s8.25 1.34 8.25 3Zm0 0v6c0 1.66-3.69 3-8.25 3s-8.25-1.34-8.25-3V6m16.5 6v6c0 1.66-3.69 3-8.25 3s-8.25-1.34-8.25-3v-6" /></svg>;
const RefreshIcon = () => <svg className="icon-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.02 9.35h4.22V5.13m-.65 3.58A8.25 8.25 0 0 0 4.81 6.68M7.98 14.65H3.76v4.22m.65-3.58a8.25 8.25 0 0 0 14.78 2.03" /></svg>;
const SearchIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const AnalyticsIcon = () => <svg className="icon-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const SettingsIcon = () => <svg className="icon-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CloseIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const ChevronRightIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" /></svg>;
const ScanIcon = () => <svg className="icon-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const MonitorIcon = () => <svg className="icon-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17h6m-8 4h10M4 5a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" /></svg>;

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
