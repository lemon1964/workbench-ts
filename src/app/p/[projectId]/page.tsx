import Container from "@/components/layout/Container";
import ProjectWorkspaceNoSSR from "./ProjectWorkspaceNoSSR";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params; // Next 15: params async :contentReference[oaicite:2]{index=2}

  return (
    <Container className="flex-1 min-h-0 flex flex-col">
      <ProjectWorkspaceNoSSR projectId={projectId} />
    </Container>
  );
}
