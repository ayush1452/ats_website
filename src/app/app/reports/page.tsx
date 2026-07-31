import { ReportsPage } from "@/components/app/workspace-pages";
import { loadWorkspaceScans } from "@/lib/workspace-data";

export default async function ExportsPage() {
  return <ReportsPage scans={await loadWorkspaceScans()} />;
}
