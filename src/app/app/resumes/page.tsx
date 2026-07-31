import { ResumesPage } from "@/components/app/workspace-pages";
import { loadWorkspaceResumes } from "@/lib/workspace-data";

export default async function SavedResumesPage() {
  return <ResumesPage resumes={await loadWorkspaceResumes()} />;
}
