"use client";

import { useState } from "react";

interface GoogleSheetsPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: () => Promise<void>;
  onSearch: (query: string) => Promise<SpreadsheetItem[]>;
  onSelect: (data: {
    spreadsheetId: string;
    spreadsheetName: string;
    spreadsheetUrl: string;
    connectionId: string;
  }) => Promise<void>;
}

interface SpreadsheetItem {
  id: string;
  name: string;
  url: string;
  fileType?: string;
  modifiedTime?: string;
}

type AuthState = "initial" | "authenticating" | "authenticated" | "selecting" | "error";

export function GoogleSheetsPickerModal({ open, onOpenChange, onConnect, onSearch, onSelect }: GoogleSheetsPickerModalProps) {
  const [authState, setAuthState] = useState<AuthState>("initial");
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetItem[]>([]);
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function initiateBridgeGoogleOAuth() {
    setAuthState("authenticating");
    setError(null);
    try {
      await onConnect();
      const nextConnectionId = `bridge-google-sheets-${Date.now()}`;
      setConnectionId(nextConnectionId);
      setGoogleEmail("Compte Google via Bridge");
      setAuthState("authenticated");
      await loadSpreadsheets(nextConnectionId, "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Configuration Google Sheets indisponible.");
      setAuthState("error");
    }
  }

  async function loadSpreadsheets(nextConnectionId = connectionId, query = searchQuery) {
    if (!nextConnectionId) return;
    setIsLoadingSpreadsheets(true);
    setError(null);
    try {
      const results = await onSearch(query);
      setSpreadsheets(results);
      setAuthState("selecting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des fichiers");
      setAuthState("error");
    } finally {
      setIsLoadingSpreadsheets(false);
    }
  }

  async function handleSelectSpreadsheet(spreadsheet: SpreadsheetItem) {
    if (!connectionId) return;
    await onSelect({
      spreadsheetId: spreadsheet.id,
      spreadsheetName: spreadsheet.name,
      spreadsheetUrl: spreadsheet.url,
      connectionId,
    });
  }

  return (
    <div className="knowledge-v2-modal" role="dialog" aria-modal="true" aria-label="Importer depuis Google Sheets">
      <div className="knowledge-v2-source-modal-panel knowledge-v2-sheets-picker">
        <div className="knowledge-v2-modal-head">
          <div>
            <h2>Importer depuis Google Sheets</h2>
            <p>Connectez votre compte Google via Bridge pour importer un fichier avec synchronisation automatique.</p>
          </div>
          <button className="nav-icon-btn nav-icon-btn-small" onClick={() => onOpenChange(false)} aria-label="Fermer">
            <CloseIcon />
          </button>
        </div>

        <div className="knowledge-v2-sheets-body">
          {authState === "initial" && (
            <div className="knowledge-v2-sheets-state">
              <div>
                <SheetIcon />
              </div>
              <h3>Connecter Google Sheets</h3>
              <p>Autorisez l'accès à votre Google Drive depuis Bridge. Les modifications pourront ensuite être synchronisées automatiquement.</p>
              <button onClick={initiateBridgeGoogleOAuth}>
                <SheetIcon />
                <span>Se connecter avec Google</span>
              </button>
            </div>
          )}

          {authState === "authenticating" && (
            <div className="knowledge-v2-sheets-state">
              <SpinnerIcon />
              <p>Connexion à Google via Bridge...</p>
            </div>
          )}

          {(authState === "authenticated" || authState === "selecting") && connectionId && (
            <div className="knowledge-v2-sheets-selecting">
              <div className="knowledge-v2-sheets-account">
                <CheckCircleIcon />
                <div>
                  <strong>Compte connecté</strong>
                  {googleEmail ? <span>({googleEmail})</span> : null}
                </div>
              </div>

              <label className="knowledge-v2-sheets-search">
                <SearchTinyIcon />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void loadSpreadsheets(connectionId, searchQuery);
                  }}
                  placeholder="Rechercher un fichier..."
                />
                <button onClick={() => void loadSpreadsheets(connectionId, searchQuery)} disabled={isLoadingSpreadsheets}>
                  {isLoadingSpreadsheets ? <SpinnerIcon /> : "Rechercher"}
                </button>
              </label>

              {isLoadingSpreadsheets ? (
                <div className="knowledge-v2-sheets-loading">
                  <SpinnerIcon />
                </div>
              ) : spreadsheets.length > 0 ? (
                <div className="knowledge-v2-sheets-list">
                  {spreadsheets.map((spreadsheet) => (
                    <button key={spreadsheet.id} onClick={() => void handleSelectSpreadsheet(spreadsheet)}>
                      <FileSpreadsheetIcon />
                      <span>
                        <strong>{spreadsheet.name}</strong>
                        <small>{fileTypeLabel(spreadsheet.fileType)}</small>
                      </span>
                      <ExternalIcon />
                    </button>
                  ))}
                </div>
              ) : authState === "selecting" ? (
                <div className="knowledge-v2-sheets-empty">
                  <FileSpreadsheetIcon />
                  <p>Aucun fichier trouvé</p>
                  <span>Essayez une autre recherche</span>
                </div>
              ) : (
                <div className="knowledge-v2-sheets-empty">
                  <p>Chargement des fichiers...</p>
                </div>
              )}

              <button className="knowledge-v2-sheets-refresh" onClick={() => void loadSpreadsheets(connectionId, searchQuery)} disabled={isLoadingSpreadsheets}>
                <RefreshIcon />
                <span>Actualiser la liste</span>
              </button>
            </div>
          )}

          {authState === "error" && (
            <div className="knowledge-v2-sheets-state">
              <AlertIcon />
              <h3>Erreur de connexion</h3>
              <p>{error || "Une erreur est survenue lors de la connexion"}</p>
              <button
                onClick={() => {
                  setError(null);
                  setAuthState("initial");
                }}
              >
                Réessayer
              </button>
            </div>
          )}
        </div>

        <div className="knowledge-v2-sheets-info">Les données seront synchronisées automatiquement à chaque modification du fichier.</div>
      </div>
    </div>
  );
}

function fileTypeLabel(fileType?: string) {
  if (fileType === "application/vnd.google-apps.spreadsheet") return "Google Sheets";
  if (fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return "Excel (.xlsx)";
  if (fileType === "application/vnd.ms-excel") return "Excel (.xls)";
  return "Tableur";
}

const CloseIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>;
const SheetIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const SpinnerIcon = () => <svg className="icon-5 knowledge-v2-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3a9 9 0 1 0 9 9" /></svg>;
const CheckCircleIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const SearchTinyIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>;
const FileSpreadsheetIcon = () => <svg className="icon-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.6L19 9.4V19a2 2 0 0 1-2 2Z" /></svg>;
const ExternalIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const RefreshIcon = () => <svg className="icon-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" /></svg>;
const AlertIcon = () => <svg className="icon-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></svg>;
