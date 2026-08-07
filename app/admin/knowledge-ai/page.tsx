import { AdminShell } from "@/components/AdminShell";
import { KnowledgeAiAdminPanel } from "@/modules/knowledge_ai";

export default function KnowledgeAiAdminPage() {
  return (
    <AdminShell
      title="Connaissance"
      description="Contrat Bridge du service Connaissance : déploiement indépendant, scopes, runtime local-only et lancement sécurisé."
    >
      <KnowledgeAiAdminPanel />
    </AdminShell>
  );
}
