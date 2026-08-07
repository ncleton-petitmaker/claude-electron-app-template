import { ConnaissanceNewDashboard } from "@/components/ConnaissanceNewDashboard";

interface GroupPageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params;
  return <ConnaissanceNewDashboard initialKnowledgeId={decodeURIComponent(id)} standaloneDetail />;
}
