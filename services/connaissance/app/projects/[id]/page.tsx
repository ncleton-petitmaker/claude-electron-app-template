import { ProjectWorkspace } from "@/components/ProjectWorkspace";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  return <ProjectWorkspace projectId={decodeURIComponent(id)} />;
}
