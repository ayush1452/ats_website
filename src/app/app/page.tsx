import { Dashboard } from "@/components/app/dashboard";
import { loadWorkspaceDashboard } from "@/lib/workspace-data";

export default async function OverviewPage() {
  const dashboard = await loadWorkspaceDashboard();
  return <Dashboard {...dashboard} />;
}
