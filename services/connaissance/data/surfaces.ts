export const productRoutes = [
  { href: "/chat", label: "Chat", description: "Conversations RAG et LLM direct via Bridge" },
  { href: "/upload", label: "Upload", description: "Fichiers, texte, URL, audio, video et tableurs" },
  { href: "/dashboard", label: "Dashboard", description: "Base de connaissances, traitements et citations" },
  { href: "/search", label: "Recherche", description: "Recherche semantique locale avec citations" },
  { href: "/analytics", label: "Analytics", description: "Qualite de la base, usages et traitements" },
  { href: "/agents", label: "Agents", description: "Instructions systeme et agents specialises" },
  { href: "/settings", label: "Parametres", description: "Service, runtime et connexions Bridge" },
  { href: "/login", label: "Connexion", description: "OAuth Bridge et email OTP" },
] as const;

export const bridgeContract = {
  serviceId: "knowledge_ai",
  serviceSlug: "connaissance",
  providerMode: "local_only",
  providers: ["bridge_codex", "lmstudio_local", "dgx_spark_lan"],
  scopes: [
    "service:knowledge_ai:read",
    "service:knowledge_ai:chat",
    "service:knowledge_ai:ingest",
    "service:knowledge_ai:agents",
    "service:knowledge_ai:admin",
  ],
} as const;
