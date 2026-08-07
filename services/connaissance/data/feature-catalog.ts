export type UploadMethod =
  | "text"
  | "image"
  | "pdf"
  | "document"
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

export type KnowledgeType = UploadMethod | "email" | "group";

export interface ShortcutItem {
  id: string;
  name: string;
  prompt: string;
  icon: string;
}

export interface UploadMethodConfig {
  id: UploadMethod;
  label: string;
  description: string;
  category: "Fichiers" | "Donnees" | "Contenu" | "Reseaux sociaux" | "Avance";
  icon: string;
  acceptsFile?: boolean;
  requiresOAuth?: boolean;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  type: KnowledgeType;
  status: "completed" | "processing" | "pending" | "error";
  summary: string;
  tags: string[];
  updatedAt: string;
  itemCount?: number;
}

export interface ViewerTabConfig {
  id: string;
  label: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  role: string;
  systemInstruction: string;
  scope: string;
}

export interface ProjectContext {
  id: string;
  name: string;
  description: string;
  sources: number;
  agents: number;
}

export interface LegacyModelOption {
  id: string;
  label: string;
  detail: string;
  color: string;
  blockedByLocalOnly: true;
}

export const shortcuts: ShortcutItem[] = [
  { id: "resume", name: "Resume", prompt: "Resume ce contenu en points actionnables : ", icon: "sparkles" },
  { id: "idees", name: "Idée", prompt: "Propose trois angles a partir de ce contexte : ", icon: "lightbulb" },
  { id: "traduire", name: "Traduire", prompt: "Traduis et adapte en francais clair : ", icon: "translate" },
  { id: "email", name: "Email", prompt: "Redige un email professionnel sur : ", icon: "email" },
  { id: "linkedin", name: "LinkedIn", prompt: "Redige un post LinkedIn professionnel sur : ", icon: "linkedin" },
  { id: "chercher", name: "Chercher", prompt: "Recherche dans la base et cite les sources sur : ", icon: "search" },
];

export const shortcutIcons = [
  { id: "sparkles", label: "Sparkles" },
  { id: "lightbulb", label: "Idée" },
  { id: "translate", label: "Traduire" },
  { id: "brain", label: "Brainstorm" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "document", label: "Document" },
  { id: "email", label: "Email" },
  { id: "search", label: "Recherche" },
  { id: "star", label: "Favori" },
  { id: "bolt", label: "Rapide" },
];

export const slashCommands = [
  { id: "new-chat", name: "Nouvelle conversation", prompt: "/new", description: "Demarrer un nouveau chat" },
  { id: "attach", name: "Attacher fichier", prompt: "/attach", description: "Ajouter un fichier au contexte" },
  { id: "rag", name: "Connaissance Pro", prompt: "/rag", description: "Interroger la base avec citations" },
  { id: "llm", name: "LLM Direct", prompt: "/llm", description: "Interroger le modele local sans RAG" },
  { id: "source", name: "Ajouter source", prompt: "/source", description: "Ajouter une connaissance" },
  { id: "agent", name: "Agent", prompt: "/agent", description: "Utiliser un agent specialise" },
  { id: "project", name: "Projet", prompt: "/project", description: "Changer de contexte projet" },
];

export const uploadMethods: UploadMethodConfig[] = [
  { id: "pdf", label: "PDF", description: "Importez des documents PDF", category: "Fichiers", icon: "file", acceptsFile: true },
  { id: "document", label: "Scanner", description: "Scannez avec la camera", category: "Fichiers", icon: "scan" },
  { id: "video", label: "Video", description: "Enregistrez ou importez une video", category: "Fichiers", icon: "video", acceptsFile: true },
  { id: "audio", label: "Audio", description: "Enregistrez ou importez de l'audio", category: "Fichiers", icon: "mic", acceptsFile: true },
  { id: "image", label: "Image", description: "Importez une image", category: "Fichiers", icon: "image", acceptsFile: true },
  { id: "spreadsheet", label: "Donnees", description: "Importez CSV ou Excel pour analyse", category: "Donnees", icon: "table", acceptsFile: true },
  { id: "google_sheets", label: "Google Sheets", description: "Connectez un tableur via OAuth Bridge", category: "Donnees", icon: "sheet", requiresOAuth: true },
  { id: "text", label: "Texte", description: "Redigez du contenu texte", category: "Contenu", icon: "text" },
  { id: "url", label: "URL", description: "Ajoutez une page web", category: "Contenu", icon: "link" },
  { id: "youtube", label: "YouTube", description: "Importez une video YouTube", category: "Reseaux sociaux", icon: "youtube" },
  { id: "linkedin", label: "LinkedIn", description: "Importez un post LinkedIn", category: "Reseaux sociaux", icon: "linkedin" },
  { id: "twitter", label: "X", description: "Importez un post X", category: "Reseaux sociaux", icon: "twitter" },
  { id: "web_scrape", label: "Web scrape", description: "Extraction avancee d'une page", category: "Avance", icon: "globe" },
  { id: "unsplash", label: "Unsplash", description: "Ajoutez une image referencee", category: "Avance", icon: "camera" },
  { id: "questionnaire", label: "Questionnaire", description: "Creer ou partager un questionnaire", category: "Avance", icon: "clipboard" },
];

export const conversations = [
  { id: "c1", title: "Connaissance Pro", message: "Comment puis-je vous aider ?", time: "11:15", active: true },
  { id: "c2", title: "Documentation technique", message: "Voici les procedures...", time: "11:15" },
  { id: "c3", title: "Analyse de donnees", message: "Les resultats montrent...", time: "10:05" },
  { id: "c4", title: "Conversations récentes", message: "en train d'écrire...", time: "Aujourd'hui" },
];

export const knowledgeItems: KnowledgeItem[] = [
  {
    id: "k1",
    title: "Procedure installation locale",
    type: "pdf",
    status: "completed",
    summary: "Installation Bridge, LM Studio, scopes et preflight.",
    tags: ["bridge", "local"],
    updatedAt: "Aujourd'hui",
  },
  {
    id: "k2",
    title: "Transcript reunion produit",
    type: "audio",
    status: "processing",
    summary: "Transcription locale en cours avec extraction des besoins.",
    tags: ["audio", "tasks"],
    updatedAt: "Hier",
  },
  {
    id: "g1",
    title: "Groupe de connaissances onboarding",
    type: "group",
    status: "completed",
    summary: "Documents, checklist et questions recurrentes.",
    tags: ["onboarding"],
    updatedAt: "Lundi",
    itemCount: 5,
  },
  {
    id: "k-video",
    title: "Tutoriel vidéo Bridge",
    type: "video",
    status: "completed",
    summary: "Vidéo avec étapes, expertise, ressources, timeline et contacts.",
    tags: ["video", "documentation"],
    updatedAt: "Mardi",
  },
  {
    id: "k-social",
    title: "Post LinkedIn veille technologique",
    type: "linkedin",
    status: "completed",
    summary: "Réseau social avec résumé IA, angle, promesse et actions.",
    tags: ["linkedin", "veille"],
    updatedAt: "Mardi",
  },
  {
    id: "k-email",
    title: "Thread email projet client",
    type: "email",
    status: "completed",
    summary: "Conversation email avec résumé IA, pièces jointes et automation.",
    tags: ["email", "client"],
    updatedAt: "Mercredi",
  },
  {
    id: "k-sheet",
    title: "Données CSV pipeline local",
    type: "spreadsheet",
    status: "completed",
    summary: "Tableur Excel avec données structurées, GenBI local et requête SQL visible.",
    tags: ["tableur", "genbi"],
    updatedAt: "Jeudi",
  },
];

export const viewerTabsByType: Record<string, ViewerTabConfig[]> = {
  pdf: [
    { id: "document", label: "Document" },
    { id: "summary", label: "Resume" },
    { id: "ocr", label: "Texte OCR" },
    { id: "automation", label: "Automatisation" },
  ],
  image: [
    { id: "preview", label: "Apercu" },
    { id: "summary", label: "Resume" },
    { id: "automation", label: "Automatisation" },
  ],
  text: [
    { id: "content", label: "Contenu" },
    { id: "summary", label: "Resume" },
    { id: "automation", label: "Automatisation" },
  ],
  document: [
    { id: "content", label: "Contenu" },
    { id: "summary", label: "Resume" },
    { id: "automation", label: "Automatisation" },
  ],
  spreadsheet: [
    { id: "data", label: "Donnees" },
    { id: "summary", label: "Resume" },
    { id: "automation", label: "Automatisation" },
  ],
  url: [
    { id: "content", label: "Contenu" },
    { id: "summary", label: "Resume" },
    { id: "automation", label: "Automatisation" },
  ],
  audio: [
    { id: "summary", label: "Resume" },
    { id: "needs", label: "Besoins" },
    { id: "tasks", label: "Taches" },
    { id: "transcript", label: "Transcription" },
    { id: "automation", label: "Automatisation" },
  ],
  video: [
    { id: "summary", label: "Resume" },
    { id: "steps", label: "Etapes" },
    { id: "expertise", label: "Expertise" },
    { id: "resources", label: "Ressources" },
    { id: "timeline", label: "Timeline" },
    { id: "automation", label: "Automatisation" },
  ],
  linkedin: [
    { id: "ai-summary", label: "Resume IA" },
    { id: "automation", label: "Automatisation" },
  ],
  twitter: [
    { id: "ai-summary", label: "Resume IA" },
    { id: "automation", label: "Automatisation" },
  ],
  email: [
    { id: "thread", label: "Fil email" },
    { id: "summary", label: "Resume" },
    { id: "automation", label: "Automatisation" },
  ],
};

export const knowledgeCardActions = [
  "Modifier",
  "Associer à une autre connaissance",
  "Remplacer le fichier",
  "Historique des versions",
  "Partager",
  "Copier le lien",
  "Supprimer",
];

export const versionHistory = [
  { id: "v3", label: "Version actuelle", detail: "Resume et OCR local mis a jour", date: "Aujourd'hui" },
  { id: "v2", label: "Version precedente", detail: "Ajout tags et citations", date: "Hier" },
  { id: "v1", label: "Import initial", detail: "Extraction du fichier source", date: "Lundi" },
  { id: "empty", label: "Aucune version précédente", detail: "L'historique des versions sera disponible après le premier remplacement de fichier.", date: "Visible dans l'historique des versions" },
];

export const automationItems = [
  "Webhook URL",
  "Secret webhook",
  "Token Bridge",
  "Modification externe (API)",
  "Permet à N8N, Zapier, etc. de modifier cette connaissance",
  "Cette connaissance peut être modifiée via l'API Bridge",
  "Endpoint API :",
  "PATCH /functions/v1/api-modify-knowledge",
  "API active",
  "Modification activée",
  "Aucun token de modification actif",
  "Activer la modification externe",
  "Régénérer le token",
  "Révoquer le token",
  "Voir la documentation",
  "Google Sheets",
  "Connecter Google Sheets",
  "Synchronisation automatique avec un tableur Google",
  "Compte Google connecté",
  "Annuler la connexion",
  "Synchronisation automatique activée",
  "Synchronisation manuelle",
  "Actualisation en cours...",
  "Actualiser maintenant",
  "Configuration Apps Script",
  "Activez la synchronisation en temps réel",
  "Instructions d'installation",
  "Ouvrez votre Google Sheet",
  "Extensions → Apps Script",
  "Supprimez le code existant et collez le script ci-dessous",
  "💾 Enregistrer",
  "installTriggers",
  "▶️ Exécuter",
  "Autorisez les permissions demandées",
  "Script à copier",
  "Copié !",
  "Important :",
  "Ouvrir le Google Sheet",
  "Aucun workflow d'envoi actif",
  "Configurez des workflows dans les paramètres pour envoyer cette connaissance",
  "Contenu à envoyer",
  "Le titre, la description et les tags sont toujours envoyés",
  "Workflows disponibles",
  "Synchroniser",
  "Copier le token",
];

export const uploadAdvancedActions = [
  "Scanner un document",
  "Disponible sur iPhone",
  "Le scanner utilise la caméra de votre iPhone pour numériser vos documents avec une qualité optimale.",
  "Télécharger sur l'App Store",
  "Ou importez directement un PDF depuis votre ordinateur",
  "Importer depuis Google Sheets",
  "Connecter Google Sheets",
  "Se connecter avec Google",
  "Connexion à Google...",
  "Compte connecté",
  "Actualiser la liste",
  "Aucun fichier trouvé",
  "Essayez une autre recherche",
  "Chargement des fichiers...",
  "Erreur de connexion",
  "Réessayer",
  "Les données seront synchronisées automatiquement à chaque modification du fichier",
  "Enregistrer votre écran",
  "Capturez votre écran pour créer des tutoriels, démonstrations ou présentations.",
  "Démarrer l'enregistrement",
  "Vous pourrez choisir l'écran ou la fenêtre à partager",
  "Autorisation en cours...",
  "Sélectionnez l'écran à partager dans la fenêtre du navigateur",
  "Enregistrement en cours...",
  "Arrêter l'enregistrement",
  "Arrêter le partage",
  "Prévisualisation",
  "Recommencer",
  "Non supporté",
  "Titre (optionnel)",
  "Donnez un titre à ce contenu",
  "Effacer terminés",
  "Enregistrement termine",
  "Annuler",
];

export const structuredDataLabels = [
  "Données structurées",
  "Barres",
  "Barres horiz.",
  "Barres empilées",
  "Courbe",
  "Aire",
  "Camembert",
  "Anneau",
  "Nuage pts",
  "Radar",
  "Voir la requête SQL",
  "Données CSV",
  "Tableur Excel",
  "Utilisez le chat GenBI pour interroger toutes les données",
  "Chargement des données...",
  "Récupération depuis la base de données",
  "Erreur de chargement",
  "Aucune donnée disponible",
  "Les données n'ont pas encore été extraites du fichier",
];

export const emailThreadLabels = [
  "Conversation",
  "Résumé IA",
  "Automatisation",
  "Messages dans le thread",
  "Résumé de la conversation",
  "Résumé en cours de génération...",
  "Le résumé sera disponible sous peu",
  "Réduire tout",
  "Tout développer",
  "Afficher le texte cité",
  "Masquer le texte cité",
  "Copié",
  "Expéditeur inconnu",
  "(Contenu non disponible)",
];

export const dashboardFilterLabels = [
  "Mes connaissances",
  "Explorez et gérez votre base de connaissances",
  "Total",
  "Prêts",
  "Aucune connaissance",
  "Rechercher dans vos connaissances...",
  "Types de contenu",
  "Tous les statuts",
  "Plus récent",
  "Plus ancien",
  "Titre A-Z",
  "Vue grille",
  "Vue liste",
  "Filtres actifs:",
  "Effacer les filtres",
  "Tout effacer",
  "Terminé",
  "En attente",
  "En cours...",
  "2-3 min",
];

export const sourceParityLabels = [
  "Archivée",
  "Assistant IA avec RAG",
  "Options du modèle",
  "pour les raccourcis",
  "Posez votre question...",
  "24 heures",
  "7 jours",
  "30 jours",
  "Actions à réaliser",
  "Actions immédiates",
  "Ajouter un raccourci",
  "Allez dans",
  "Association en cours...",
  "Associer à...",
  "Aucun contenu disponible",
  "Aucun fichier dans ce groupe",
  "Aucun tag trouvé pour ce document",
  "Besoins client",
  "Besoins identifiés",
  "Bonnes pratiques",
  "Cette action est irréversible",
  "Cette action est irréversible. La connaissance et tous ses chunks seront définitivement supprimés.",
  "Cette connaissance contient déjà du contenu. En synchronisant avec",
  "Choisir un fichier",
  "Chargement de l'historique...",
  "Connecter un Google Sheet pour synchroniser les données",
  "Consultez la transcription en attendant",
  "Contenu principal",
  "Contexte client",
  "Créé le",
  "Créez avec l'interface Connaissance",
  "Critères de succès",
  "Dépannage",
  "Description de la connaissance",
  "Ex: Mise à jour version 2.0",
  "Extraction des besoins en cours...",
  "Extraction des tâches en cours...",
  "Fichier actuel",
  "Fichier sélectionné :",
  "Impossible de charger l'historique",
  "Impossible de charger l\\",
  "Informations générales",
  "Le document est peut-être encore en cours de traitement",
  "Les besoins clients seront bientôt disponibles",
  "Les tâches seront bientôt disponibles",
  "Lien copié !",
  "Liste de tâches",
  "Notes de réunion",
  "Notes de réunion en cours de génération...",
  "ou cliquez pour parcourir",
  "Outils utilisés",
  "Pas de transcription disponible",
  "Pièges à éviter",
  "Plan d'action",
  "Points clés et décisions",
  "Points critiques",
  "Points en suspens",
  "Prérequis",
  "Prêt à remplacer",
  "Prévisualisation non disponible",
  "Quitter le groupe actuel ?",
  "Raison du changement",
  "Récapitulatif des modifications",
  "Rechercher une connaissance...",
  "Remplacement en cours...",
  "Remplacer le contenu",
  "Remplacer le contenu ?",
  "Résultat",
  "Résumé généré par l'IA locale",
  "Risques identifiés",
  "Sélectionnez la fonction",
  "dans le menu déroulant",
  "Social Media",
  "Tâches",
  "Tags du document",
  "Tags sémantiques (IA)",
  "Tapez un nom de fichier et cliquez sur \"Chercher\"",
  'Tapez un nom de fichier et cliquez sur "Chercher"',
  "Tapez un nom de fichier et cliquez sur \\\"Chercher\\\"",
  "Texte complet avec speakers",
  "Texte complet de la connaissance",
  "Titre de la connaissance",
  "Utilisez le bouton ci-dessous pour mettre à jour les données depuis Google Sheets.",
  "Versions précédentes",
  "Voir le post",
  "Voir les tags",
  "Workflow déclenché avec succès",
  "X (Twitter)",
  "Choisissez une méthode pour ajouter des connaissances",
  "Cliquez sur \"Arrêter le partage\" dans votre navigateur ou sur le bouton ci-dessous.",
  'Cliquez sur "Arrêter le partage" dans votre navigateur ou sur le bouton ci-dessous.',
  "Cliquez sur \\\"Arrêter le partage\\\" dans votre navigateur ou sur le bouton ci-dessous.",
  "Connectez votre compte Google pour importer un fichier avec synchronisation automatique",
  "Analyse de données",
  "Fichiers partagés",
  "Toggle sidebar",
  "Vidéos",
  "Choisissez le type de contenu à ajouter",
  "Demander la connaissance à des tiers",
  "Excel, Numbers, CSV",
  "Fichiers audio, podcasts",
  "Fichiers vidéo",
  "Générer un nouveau questionnaire",
  "Lien vers une page web",
  "Notes personnelles",
  "Partager un questionnaire existant",
  "Partagez un lien",
  "Post X (Twitter)",
  "Procédures internes",
  "Projets clients",
  "Réseaux sociaux",
  "Saisir du texte directement",
  "Scannez avec la caméra",
  "Supprimer cette connaissance ?",
  "Vidéo YouTube",
];

export const authLabels = [
  "Connectez-vous pour accéder à vos connaissances",
  "Connexion par email",
  "Recevez un code de connexion sécurisé",
  "Adresse email",
  "vous@entreprise.com",
  "Envoi en cours...",
  "Recevoir le code",
  "Entrez le code",
  "Un code à 6 chiffres a été envoyé à",
  "Vérification...",
  "Renvoyer le code",
  "Utiliser une autre adresse",
  "Connaissance.pro - Votre base de connaissances intelligente",
];

export const agentTemplates: AgentTemplate[] = [
  {
    id: "project",
    name: "Agent projet",
    role: "Contexte projet",
    systemInstruction: "Tu reponds seulement avec les sources du projet actif et tu cites les connaissances utilisees.",
    scope: "service:knowledge_ai:agents",
  },
  {
    id: "research",
    name: "Agent recherche",
    role: "RAG avec citations",
    systemInstruction: "Tu verifies chaque affirmation dans la base locale avant de proposer une reponse.",
    scope: "service:knowledge_ai:read",
  },
  {
    id: "draft",
    name: "Agent redaction",
    role: "Production controlee",
    systemInstruction: "Tu produis un brouillon a partir des sources selectionnees sans inventer de contexte.",
    scope: "service:knowledge_ai:chat",
  },
];

export const projectContexts: ProjectContext[] = [
  {
    id: "client-energy-demo",
    name: "Client Energy Demo",
    description: "Sources client, agents dedies, conversations et documents de cadrage.",
    sources: 42,
    agents: 3,
  },
  {
    id: "bridge-template",
    name: "Bridge Template",
    description: "Documentation generique, skills, architecture service et procedures.",
    sources: 27,
    agents: 2,
  },
];

export const knowledgeFilters = ["Tous", "PDF", "Document", "Audio", "Video", "Image", "URL", "Tableur", "Email", "LinkedIn", "X", "Groupes", "Processing"];

export const modelOptions = [
  { id: "lmstudio-local", label: "LM Studio local", detail: "OpenAI-compatible local" },
  { id: "bridge-codex", label: "Bridge Codex", detail: "Job audite via Bridge" },
  { id: "dgx-spark-lan", label: "DGX Spark LAN", detail: "Prepare, desactive par defaut" },
];

export const legacyModelOptions: LegacyModelOption[] = [
  { id: "perplexity-sonar", label: "Perplexity Sonar", detail: "Recherche web temps réel", color: "#20B2AA", blockedByLocalOnly: true },
  { id: "gpt-5", label: "GPT-5", detail: "Le plus puissant", color: "#10A37F", blockedByLocalOnly: true },
  { id: "gpt-5-mini", label: "GPT-5 Mini", detail: "Rapide et économique", color: "#10A37F", blockedByLocalOnly: true },
  { id: "claude-sonnet-45", label: "Claude Sonnet 4.5", detail: "Excellence en raisonnement", color: "#CC785C", blockedByLocalOnly: true },
  { id: "claude-haiku-45", label: "Claude Haiku 4.5", detail: "Rapide et économique", color: "#CC785C", blockedByLocalOnly: true },
  { id: "gemini-25-flash", label: "Gemini 2.5 Flash", detail: "Multimodal rapide", color: "#4285F4", blockedByLocalOnly: true },
  { id: "mistral-medium", label: "Mistral Medium", detail: "Multilingue avancé", color: "#FF7000", blockedByLocalOnly: true },
];

export const parityRequirements = [
  "rail: Chat, Upload, Dashboard, Recherche, Analytics, Parametres, avatar",
  "chat: historique, nouveau chat, recherche, mode RAG/LLM, raccourcis, slash commands, attacher, reasoning, pro, micro, envoyer",
  "chat avance: gestion des raccourcis, modèles hérités bloqués en local-only, structured data et requête SQL",
  "upload: Fichiers, Donnees, Contenu, Reseaux sociaux, Avance et 15 methodes",
  "upload avance: scanner, Google Sheets, screen record, upload progress, annuler",
  "dashboard: stats, recent, processing, filtres, liste/grille, groupes, actions cartes",
  "auth: email OTP via Bridge OAuth/launch ticket, aucune session Supabase directe côté service",
  "knowledge: viewer, chat, voir, modifier, version, remplacer, associer, partager, supprimer",
  "knowledge avance: viewers PDF/audio/video/social/email, automation, historique versions, association, remplacement, copie lien",
  "agents: creation agents et instructions systeme",
  "projects: contexte dedie, sources, agents et conversations",
  "settings: Bridge, OAuth, Coolify, Supabase dedie, runtime local-only",
];
