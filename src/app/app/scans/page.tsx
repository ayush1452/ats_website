import { HistoryPage } from "@/components/app/workspace-pages";
import { loadWorkspaceScans } from "@/lib/workspace-data";

export default async function ScansPage() {
  return <HistoryPage scans={await loadWorkspaceScans()} />;
}
