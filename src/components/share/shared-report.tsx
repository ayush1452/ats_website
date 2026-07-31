"use client";

import { AlertTriangle, CheckCircle2, Clock3, FileSearch, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productConfig } from "@/config/product";
import type { AnalysisResult } from "@/types/domain";

type SharedState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; result: AnalysisResult; expiresAt: string | null };

function SharedScore({ score, label }: { score: number | null; label: string }) {
  return (
    <div className="border-l border-[var(--border)] pl-5 first:border-l-0 first:pl-0">
      <strong className="block text-3xl tracking-[-0.04em]">{score ?? "—"}</strong>
      <span className="mt-1 block text-xs font-semibold text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

export function SharedReport({ token }: { token: string }) {
  const [state, setState] = useState<SharedState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/shares/${encodeURIComponent(token)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          result?: AnalysisResult;
          expiresAt?: string | null;
          error?: string;
        };
        if (!response.ok || !payload.result) {
          throw new Error(payload.error ?? "This report is no longer available.");
        }
        setState({
          status: "ready",
          result: payload.result,
          expiresAt: payload.expiresAt ?? null,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "This report is no longer available.",
        });
      });
    return () => controller.abort();
  }, [token]);

  if (state.status === "loading") {
    return (
      <main id="main-content" className="min-h-screen bg-[var(--background)] px-5 py-10">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-10 w-48 rounded-xl bg-[var(--surface-strong)]" />
          <div className="mt-16 h-44 rounded-[22px] bg-[var(--surface-strong)]" />
          <span className="sr-only">Loading shared report</span>
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main id="main-content" className="grid min-h-screen place-items-center px-5">
        <div className="max-w-md text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--warning-soft)] text-[var(--warning)]">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-[-0.045em]">Shared report unavailable</h1>
          <p className="mt-4 leading-7 text-[var(--text-secondary)]">{state.message}</p>
          <Button asChild className="mt-7">
            <Link href="/scan">Run your own analysis</Link>
          </Button>
        </div>
      </main>
    );
  }

  const { result, expiresAt } = state;
  const openFindings = result.findings.filter((finding) => finding.status === "open");

  return (
    <main id="main-content" className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="container-shell flex min-h-16 items-center justify-between gap-4">
          <Link className="flex items-center gap-2.5 font-extrabold" href="/">
            <span className="grid size-8 place-items-center rounded-[10px] bg-[var(--primary)] text-xs text-white">
              {productConfig.shortName}
            </span>
            {productConfig.name}
          </Link>
          <Badge tone="success">Read-only report</Badge>
        </div>
      </header>

      <div className="container-shell py-10 sm:py-14">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--border)] pb-8">
          <div>
            <p className="eyebrow">Shared analysis</p>
            <h1 className="mt-2 text-4xl font-bold tracking-[-0.045em]">Resume evidence report</h1>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--text-secondary)]">
              A read-only snapshot of the score, component signals, and prioritized findings.
            </p>
          </div>
          {expiresAt ? (
            <span className="flex items-center gap-2 rounded-full bg-[var(--warning-soft)] px-3 py-2 text-xs font-bold text-[#80520c]">
              <Clock3 className="size-4" aria-hidden="true" />
              Expires {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(expiresAt))}
            </span>
          ) : null}
        </div>

        <section className="grid gap-8 border-b border-[var(--border)] py-9 lg:grid-cols-[220px_1fr]">
          <div className="rounded-[22px] bg-[var(--primary-dark)] p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/55">
              Overall heuristic
            </p>
            <p className="mt-4 text-7xl font-bold tracking-[-0.08em]">{result.overallScore}</p>
            <p className="mt-1 text-sm text-white/60">out of 100</p>
            <p className="mt-6 text-xs leading-5 text-white/65">
              This product score is explanatory, not a hiring or ATS guarantee.
            </p>
          </div>
          <div>
            <div className="grid grid-cols-3 gap-5">
              <SharedScore score={result.componentScores.atsParse} label="ATS parse" />
              <SharedScore score={result.componentScores.recruiterClarity} label="Recruiter clarity" />
              <SharedScore score={result.componentScores.roleMatch} label="Role match" />
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {result.dimensionScores.map((dimension) => (
                <div key={dimension.key}>
                  <div className="flex justify-between gap-3 text-xs font-bold">
                    <span>{dimension.label}</span>
                    <span>{dimension.score}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--surface-strong)]">
                    <div
                      className="h-full rounded-full bg-[var(--primary)]"
                      style={{ width: `${dimension.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-9" aria-labelledby="shared-findings">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="eyebrow">Evidence to review</p>
              <h2 id="shared-findings" className="mt-2 text-2xl font-bold tracking-[-0.035em]">
                Prioritized findings
              </h2>
            </div>
            <span className="text-sm font-bold text-[var(--text-muted)]">
              {openFindings.length} open
            </span>
          </div>
          <div className="mt-6 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {openFindings.slice(0, 8).map((finding) => (
              <article className="grid gap-4 py-5 sm:grid-cols-[1fr_auto]" key={finding.id}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-muted)] text-[var(--primary)]">
                    <FileSearch className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{finding.title}</h3>
                      <Badge tone={finding.severity === "high" || finding.severity === "critical" ? "danger" : "warning"}>
                        {finding.severity}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                      {finding.description}
                    </p>
                    <p className="mt-2 text-sm font-semibold">{finding.recommendation}</p>
                  </div>
                </div>
                <strong className="text-sm text-[var(--primary)]">+{finding.scoreImpact} est.</strong>
              </article>
            ))}
          </div>
        </section>

        <aside className="mb-12 flex items-start gap-3 rounded-[18px] bg-[var(--success-soft)] p-5 text-sm leading-6">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--primary)]" aria-hidden="true" />
          <div>
            <strong className="block">Snapshot integrity</strong>
            <span className="text-[var(--text-secondary)]">
              This link exposes only the saved report snapshot and can be revoked by its owner.
            </span>
          </div>
        </aside>

        <div className="flex flex-wrap items-center justify-between gap-5 border-t border-[var(--border)] pt-8">
          <p className="max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
            Scores are product heuristics and do not guarantee ATS acceptance, interviews, or
            employment.
          </p>
          <Button asChild>
            <Link href="/scan">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Analyze your resume
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
