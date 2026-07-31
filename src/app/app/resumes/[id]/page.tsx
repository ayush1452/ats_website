import { notFound } from "next/navigation";

import { ResumeDetailPage } from "@/components/app/workspace-pages";
import { isSupabaseServerConfigured } from "@/lib/supabase/server";
import { loadWorkspaceResume } from "@/lib/workspace-data";

import { LocalResumeDetail } from "./local-resume-detail";

export default async function ResumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resume = await loadWorkspaceResume(id);
  if (!resume) {
    if (!isSupabaseServerConfigured()) {
      return <LocalResumeDetail resumeId={id} />;
    }
    notFound();
  }
  return (
    <ResumeDetailPage
      resumeId={resume.item.id}
      resumeName={resume.item.name}
      versions={resume.versions}
      isDemo={resume.item.isDemo}
    />
  );
}
