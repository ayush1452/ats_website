import { Suspense } from "react";

import { ComparePage } from "@/components/app/workspace-pages";
import { loadDefaultWorkspaceVersions } from "@/lib/workspace-data";

export default async function VersionComparePage() {
  const versions = await loadDefaultWorkspaceVersions();
  return (
    <Suspense fallback={<div className="grid min-h-[60vh] place-items-center text-sm font-bold text-[var(--text-muted)]">Opening version comparison…</div>}>
      <ComparePage versions={versions} />
    </Suspense>
  );
}
