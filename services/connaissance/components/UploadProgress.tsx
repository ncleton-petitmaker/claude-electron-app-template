"use client";

import { uploadMethodConfigs, uploadStatusLabel, type UploadProgressItem } from "@/components/UploadTypes";

export interface UploadProgressProps {
  upload: UploadProgressItem;
  onCancel?: () => void;
}

export function UploadProgress({ upload, onCancel }: UploadProgressProps) {
  const config = uploadMethodConfigs[upload.method];
  const isError = upload.status === "error";
  const isComplete = upload.status === "complete";
  const isProcessing = upload.status === "processing";
  const Icon = isError ? ErrorIcon : isComplete ? CheckIcon : isProcessing ? SpinnerIcon : UploadSmallIcon;

  return (
    <div className={`knowledge-v2-upload-progress-card ${isError ? "error" : isComplete ? "complete" : ""}`}>
      <span style={!isError && !isComplete ? { backgroundColor: `${config.color}15`, color: config.color } : undefined}>
        <Icon />
      </span>
      <div>
        <strong>{upload.fileName}</strong>
        <small>{upload.error ?? upload.stage ?? uploadStatusLabel(upload.status, upload.progress)}</small>
        {!isError && !isComplete && (
          <i>
            <b style={{ width: `${upload.progress}%`, backgroundColor: config.color }} />
          </i>
        )}
      </div>
      {onCancel && !isError && !isComplete && (
        <button onClick={onCancel} aria-label="Annuler">
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

export interface UploadProgressPanelProps {
  uploads: UploadProgressItem[];
  onCancel?: (id: string) => void;
  onClear?: () => void;
}

export function UploadProgressPanel({ uploads, onCancel, onClear }: UploadProgressPanelProps) {
  const activeUploads = uploads.filter((upload) => upload.status !== "complete" && upload.status !== "error");
  const completedUploads = uploads.filter((upload) => upload.status === "complete");
  const errorUploads = uploads.filter((upload) => upload.status === "error");

  if (uploads.length === 0) return null;

  return (
    <div className="knowledge-v2-upload-progress-panel">
      <div className="knowledge-v2-upload-progress-head">
        <div>
          <strong>Uploads</strong>
          {activeUploads.length > 0 && <span>{activeUploads.length} en cours</span>}
          {completedUploads.length > 0 && <span>{completedUploads.length} terminé{completedUploads.length > 1 ? "s" : ""}</span>}
          {errorUploads.length > 0 && <span>{errorUploads.length} erreur{errorUploads.length > 1 ? "s" : ""}</span>}
        </div>
        {onClear && (completedUploads.length > 0 || errorUploads.length > 0) && <button onClick={onClear}>Effacer terminés</button>}
      </div>
      <div className="knowledge-v2-upload-progress-list">
        {uploads.map((upload) => (
          <UploadProgress key={upload.id} upload={upload} onCancel={onCancel ? () => onCancel(upload.id) : undefined} />
        ))}
      </div>
    </div>
  );
}

const CloseIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>;
const UploadSmallIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14" /></svg>;
const SpinnerIcon = () => <svg className="icon-5 knowledge-v2-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3a9 9 0 1 0 9 9" /></svg>;
const CheckIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5 13 4 4L19 7" /></svg>;
const ErrorIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>;
