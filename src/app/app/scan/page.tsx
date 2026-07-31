import { ScanWizard } from "@/components/app/scan-wizard";
import { isSupabaseServerConfigured } from "@/lib/supabase/server";

export default async function NewWorkspaceScanPage({
  searchParams,
}: {
  searchParams: Promise<{ resumeId?: string }>;
}) {
  const { resumeId } = await searchParams;
  const safeDemoId =
    resumeId && /^[a-z0-9][a-z0-9-]{0,127}$/iu.test(resumeId)
      ? resumeId
      : undefined;
  const safeLiveId =
    resumeId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
      resumeId,
    )
      ? resumeId
      : undefined;
  return (
    <ScanWizard
      embedded
      resumeId={isSupabaseServerConfigured() ? safeLiveId : safeDemoId}
    />
  );
}
