"use client";

import { AlertTriangle, ArrowLeft, FileSearch, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ReportWorkspace } from "@/components/report/report-workspace";
import { Button } from "@/components/ui/button";
import {
  DemoRepository,
  type DemoScanBundle,
} from "@/lib/repositories/demo";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; bundle: DemoScanBundle }
  | { status: "missing" }
  | { status: "error"; message: string };

export function LocalScanReport({ scanId }: { scanId: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void new DemoRepository()
      .getScanBundle(scanId)
      .then((bundle) => {
        if (!active) return;
        setState(bundle ? { status: "ready", bundle } : { status: "missing" });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "The local report could not be opened.",
        });
      });
    return () => {
      active = false;
    };
  }, [scanId]);

  if (state.status === "loading") {
    return (
      <div
        className="grid min-h-[70vh] place-items-center px-5 text-center"
        role="status"
      >
        <div>
          <LoaderCircle
            aria-hidden="true"
            className="mx-auto size-7 animate-spin text-[var(--primary)]"
          />
          <p className="mt-3 text-sm font-bold text-[var(--text-muted)]">
            Opening your saved local report…
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "missing") {
    return (
      <div className="grid min-h-[70vh] place-items-center px-5 text-center">
        <div className="max-w-md">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--surface-strong)] text-[var(--text-muted)]">
            <FileSearch aria-hidden="true" className="size-6" />
          </span>
          <p className="eyebrow mt-5">Report not found · 404</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.03em]">
            This report is not saved on this device
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            Demo scans live in this browser’s private local storage. The report
            may have been cleared or created in another browser.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/app/scan">Start a new scan</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/app/history">
                <ArrowLeft className="size-4" />
                Scan history
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="grid min-h-[70vh] place-items-center px-5 text-center">
        <div className="max-w-md">
          <AlertTriangle
            aria-hidden="true"
            className="mx-auto size-8 text-[var(--danger)]"
          />
          <h1 className="mt-4 text-xl font-extrabold">
            The local report could not be opened
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {state.message}
          </p>
          <Button asChild variant="secondary" className="mt-6">
            <Link href="/app/history">Return to scan history</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { bundle } = state;
  const title = [
    bundle.summary.targetRole,
    bundle.summary.company,
  ].filter(Boolean).join(" · ");
  return (
    <ReportWorkspace
      scanId={bundle.id}
      resumeId={bundle.resumeId}
      result={bundle.result}
      document={bundle.document}
      versions={bundle.versions}
      initialScoreStale={bundle.scoreStale}
      reportTitle={title}
      resumeLabel={bundle.summary.resumeName}
      localReport
    />
  );
}
