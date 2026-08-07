import manifest from "./module.config.json";
import type { ErpModuleManifest } from "../types";

export { KnowledgeAiAdminPanel } from "./KnowledgeAiAdminPanel";
export { KnowledgeAiServiceLauncher } from "./KnowledgeAiServiceLauncher";

export const knowledgeAiModule = manifest as ErpModuleManifest;
