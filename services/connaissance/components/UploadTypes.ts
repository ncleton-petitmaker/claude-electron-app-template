export type UploadMethod =
  | "text"
  | "image"
  | "pdf"
  | "document"
  | "screenrecord"
  | "video"
  | "audio"
  | "url"
  | "youtube"
  | "linkedin"
  | "twitter"
  | "spreadsheet"
  | "google_sheets"
  | "web_scrape"
  | "unsplash"
  | "questionnaire";

export interface UploadMethodConfig {
  method: UploadMethod;
  label: string;
  description: string;
  icon: string;
  color: string;
  acceptedTypes?: string[];
}

export type UploadStatus = "pending" | "uploading" | "processing" | "complete" | "error";

export interface UploadProgressItem {
  id: string;
  method: UploadMethod;
  fileName: string;
  status: UploadStatus;
  progress: number;
  stage?: string;
  error?: string;
}

export const uploadMethodConfigs: Record<UploadMethod, UploadMethodConfig> = {
  text: { method: "text", label: "Texte", description: "Saisir du texte directement", icon: "Type", color: "#10B981" },
  image: { method: "image", label: "Image", description: "Photo ou capture d'écran", icon: "Image", color: "#F97316", acceptedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"] },
  pdf: { method: "pdf", label: "PDF", description: "Document PDF", icon: "FileText", color: "#DC2626", acceptedTypes: ["application/pdf"] },
  document: { method: "document", label: "Document", description: "Scanner un document", icon: "Scan", color: "#3B82F6" },
  screenrecord: { method: "screenrecord", label: "Écran", description: "Enregistrez votre écran", icon: "Monitor", color: "#8B5CF6" },
  video: { method: "video", label: "Vidéo", description: "Fichier vidéo", icon: "Video", color: "#EF4444", acceptedTypes: ["video/mp4", "video/quicktime", "video/webm"] },
  audio: { method: "audio", label: "Audio", description: "Enregistrement ou fichier audio", icon: "Mic", color: "#8B5CF6", acceptedTypes: ["audio/mpeg", "audio/wav", "audio/m4a", "audio/webm"] },
  url: { method: "url", label: "URL", description: "Extraire le contenu d'une page web", icon: "Link", color: "#06B6D4" },
  youtube: { method: "youtube", label: "YouTube", description: "Vidéo YouTube", icon: "Youtube", color: "#DC2626" },
  linkedin: { method: "linkedin", label: "LinkedIn", description: "Post ou profil LinkedIn", icon: "Linkedin", color: "#0077B5" },
  twitter: { method: "twitter", label: "X", description: "Post X (Twitter)", icon: "Twitter", color: "#000000" },
  spreadsheet: { method: "spreadsheet", label: "Fichier tableur", description: "Excel ou CSV (statique)", icon: "FileSpreadsheet", color: "#78716C", acceptedTypes: ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] },
  google_sheets: { method: "google_sheets", label: "Google Sheets", description: "Synchronisé automatiquement", icon: "Sheet", color: "#57534E" },
  web_scrape: { method: "web_scrape", label: "Web Scrape", description: "Extraire contenu spécifique", icon: "Globe", color: "#6366F1" },
  unsplash: { method: "unsplash", label: "Unsplash", description: "Image libre de droits", icon: "Camera", color: "#000000" },
  questionnaire: { method: "questionnaire", label: "Questionnaire", description: "Créer un formulaire", icon: "ClipboardList", color: "#EC4899" },
};

export const uploadCategories: Record<string, UploadMethod[]> = {
  Fichiers: ["pdf", "document", "video", "screenrecord", "audio", "image"],
  Données: ["spreadsheet", "google_sheets"],
  Contenu: ["text", "url"],
  "Réseaux sociaux": ["youtube", "linkedin", "twitter"],
  Avancé: ["web_scrape", "unsplash", "questionnaire"],
};

export function uploadActionId(method: UploadMethod) {
  if (method === "text") return "knowledge_ai.upload.text";
  if (method === "url" || method === "web_scrape" || method === "unsplash" || method === "questionnaire") return "knowledge_ai.upload.url";
  if (method === "youtube") return "knowledge_ai.upload.youtube";
  if (method === "linkedin") return "knowledge_ai.upload.linkedin";
  if (method === "twitter") return "knowledge_ai.upload.twitter";
  if (method === "spreadsheet") return "knowledge_ai.upload.spreadsheet";
  if (method === "google_sheets") return "knowledge_ai.upload.google_sheets";
  return "knowledge_ai.upload.file";
}

export function fileNameForUpload(method: UploadMethod, payload: Record<string, unknown>) {
  if (typeof payload.fileName === "string" && payload.fileName.trim()) return payload.fileName;
  if (Array.isArray(payload.fileNames) && typeof payload.fileNames[0] === "string") {
    return payload.fileNames.length > 1 ? `${payload.fileNames.length} fichiers` : payload.fileNames[0];
  }
  if (typeof payload.title === "string" && payload.title.trim()) return payload.title;
  if (typeof payload.value === "string" && payload.value.trim()) return payload.value.slice(0, 48);
  return uploadMethodConfigs[method].label;
}

export function uploadStatusLabel(status: UploadStatus, progress: number) {
  if (status === "pending") return "En attente";
  if (status === "uploading") return `Upload ${progress}%`;
  if (status === "processing") return `Traitement ${progress}%`;
  if (status === "complete") return "Terminé";
  return "Erreur";
}

export function uploadPlaceholder(method: UploadMethod) {
  if (method === "text") return "Saisissez votre texte...";
  if (method === "url" || method === "web_scrape" || method === "unsplash") return "https://example.com/article";
  if (method === "youtube") return "https://www.youtube.com/watch?v=...";
  if (method === "linkedin") return "https://www.linkedin.com/posts/...";
  if (method === "twitter") return "https://x.com/user/status/...";
  return "Saisissez le contenu...";
}
