import { ConnaissanceNewDashboard } from "@/components/ConnaissanceNewDashboard";

interface KnowledgePageProps {
  params: Promise<{ id: string }>;
}

export default async function KnowledgePage({ params }: KnowledgePageProps) {
  const { id } = await params;
  return <ConnaissanceNewDashboard initialKnowledgeId={decodeURIComponent(id)} standaloneDetail />;
}
