import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { ReportWorkspace } from "@/components/report/report-workspace";
import {
  DEMO_RESUME_ID,
  DEMO_SCAN_ID,
  demoDocument,
  demoResult,
  demoScans,
  demoVersions,
} from "@/data/demo";
import { SupabaseRepository } from "@/lib/repositories/supabase";
import {
  createServerSupabaseClient,
  isSupabaseServerConfigured,
} from "@/lib/supabase/server";

import { LocalScanReport } from "./local-scan-report";

export default async function ScanReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === "demo") {
    redirect(`/app/scans/${DEMO_SCAN_ID}`);
  }
  const known = id === DEMO_SCAN_ID || demoScans.some((scan) => scan.id === id);
  if (!known) {
    if (isSupabaseServerConfigured()) {
      const client = await createServerSupabaseClient();
      if (!client) notFound();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) notFound();
      const bundle = await new SupabaseRepository(client).getScanBundle(id);
      if (!bundle) notFound();
      return (
        <Suspense fallback={<div className="grid min-h-[70vh] place-items-center text-sm font-bold text-[var(--text-muted)]">Opening saved report…</div>}>
          <ReportWorkspace
            scanId={bundle.id}
            resumeId={bundle.resumeId}
            result={bundle.result}
            document={bundle.document}
            versions={bundle.versions}
            initialScoreStale={bundle.scoreStale}
            reportTitle={[bundle.summary.targetRole, bundle.summary.company]
              .filter(Boolean)
              .join(" · ")}
            resumeLabel={bundle.summary.resumeName}
          />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<div className="grid min-h-[70vh] place-items-center text-sm font-bold text-[var(--text-muted)]">Opening saved report…</div>}>
        <LocalScanReport scanId={id} />
      </Suspense>
    );
  }
  const summary = demoScans.find((scan) => scan.id === id) ?? demoScans[0];
  return (
    <Suspense fallback={<div className="grid min-h-[70vh] place-items-center text-sm font-bold text-[var(--text-muted)]">Opening evidence report…</div>}>
      <ReportWorkspace
        scanId={id}
        resumeId={DEMO_RESUME_ID}
        result={{
          ...demoResult,
          overallScore: summary?.overallScore ?? demoResult.overallScore,
          componentScores: {
            ...demoResult.componentScores,
            atsParse: summary?.atsParse ?? demoResult.componentScores.atsParse,
            roleMatch: summary?.roleMatch ?? demoResult.componentScores.roleMatch,
          },
        }}
        document={demoDocument}
        versions={demoVersions}
        reportTitle={[summary?.targetRole, summary?.company].filter(Boolean).join(" · ")}
        resumeLabel={summary?.resumeName}
        demoReport
      />
    </Suspense>
  );
}
