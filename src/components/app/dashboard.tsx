"use client";

import {
  ArrowRight,
  CalendarClock,
  ChevronRight,
  FileText,
  MoreHorizontal,
  ScanLine,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ScoreRing } from "@/components/report/score-ring";
import { Button } from "@/components/ui/button";
import { plans } from "@/config/plans";
import { isSupabaseConfigured } from "@/lib/auth/client";
import { DemoRepository } from "@/lib/repositories/demo";
import { formatDate } from "@/lib/utils";
import type { WorkspaceQuota } from "@/lib/workspace-data";
import type { AnalysisResult, ScanSummary } from "@/types/domain";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: number | string }>;
  label?: string;
}) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 shadow-[var(--shadow-sm)]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-extrabold">{payload[0].value} score</p>
    </div>
  );
}

export function Dashboard({
  scans,
  result,
  isDemo,
  quota,
}: {
  scans: ScanSummary[];
  result: AnalysisResult | null;
  isDemo: boolean;
  quota: WorkspaceQuota;
}) {
  const [range, setRange] = useState<"30" | "90">("30");
  const [workspaceScans, setWorkspaceScans] = useState(scans);
  const [workspaceResult, setWorkspaceResult] = useState(result);

  useEffect(() => {
    if (isSupabaseConfigured()) return;
    let active = true;
    const repository = new DemoRepository();
    void repository.listScans().then(async (saved) => {
      const latestResult = saved[0]
        ? await repository.getScan(saved[0].id)
        : null;
      if (!active) return;
      setWorkspaceScans(saved);
      setWorkspaceResult(latestResult);
    });
    return () => {
      active = false;
    };
  }, [result, scans]);

  const visibleScans = useMemo(
    () => workspaceScans.slice(0, range === "30" ? 4 : 8),
    [range, workspaceScans],
  );
  const latest = workspaceScans[0];
  const trendData = workspaceResult?.scoreTrend.length
    ? workspaceResult.scoreTrend
    : [...visibleScans].reverse().map((scan) => ({
        label: new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
          new Date(scan.createdAt),
        ),
        score: scan.overallScore,
      }));
  const nextActions = workspaceResult?.findings
    .filter((finding) => finding.status === "open")
    .sort((a, b) => b.scoreImpact - a.scoreImpact)
    .slice(0, 3);
  const planName =
    plans.find((plan) => plan.id === quota.plan)?.name ?? "Free";

  if (!latest) {
    return (
      <div className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
        <div className="border-b border-[var(--border)] pb-7">
          <p className="eyebrow">Workspace overview</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] sm:text-[38px]">
            Your resume workspace
          </h1>
        </div>
        <section className="mx-auto grid max-w-2xl place-items-center py-20 text-center" aria-labelledby="empty-dashboard-title">
          <span className="grid size-14 place-items-center rounded-2xl bg-[var(--success-soft)] text-[var(--primary)]">
            <FileText aria-hidden="true" className="size-6" />
          </span>
          <h2 id="empty-dashboard-title" className="mt-5 text-2xl font-extrabold tracking-[-0.03em]">
            Start with your first resume
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
            Upload or paste a resume to create an evidence-linked analysis. A job description is optional.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/app/scan">
                <ScanLine aria-hidden="true" className="size-4" />
                Start a scan
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/app/scans/alex-morgan-product-lead">
                View labeled demo report
              </Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }
  const scoreChange =
    workspaceScans.length > 1
      ? latest.overallScore -
        (workspaceScans.at(-1)?.overallScore ?? latest.overallScore)
      : null;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <div className="flex flex-col gap-5 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Workspace overview</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] sm:text-[38px]">
            Your resume workspace
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Track the evidence in every version, then focus on the next improvement with the highest score impact.
          </p>
        </div>
        <Button asChild className="w-fit">
          <Link href="/app/scan">
            <ScanLine aria-hidden="true" className="size-4" />
            Start a scan
          </Link>
        </Button>
      </div>

      <section aria-labelledby="latest-report-title" className="grid gap-8 py-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,.65fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Latest report</p>
              <h2 id="latest-report-title" className="mt-1 text-xl font-extrabold tracking-[-0.025em]">
                {latest.targetRole}{latest.company ? ` · ${latest.company}` : ""}
              </h2>
            </div>
            {isDemo || latest.mode === "demo" ? (
              <span className="rounded-full bg-[var(--success-soft)] px-3 py-1.5 text-xs font-bold text-[var(--primary)]">
                Demo analysis
              </span>
            ) : null}
          </div>

          <div className="mt-6 grid items-center gap-8 border-y border-[var(--border)] py-7 sm:grid-cols-[180px_1fr]">
            <ScoreRing score={latest.overallScore} label="Overall score" size="lg" tone="amber" />
            <div>
              <div className="grid grid-cols-3 divide-x divide-[var(--border)]">
                <div className="pr-4">
                  <p className="text-2xl font-extrabold tracking-tight">{latest.atsParse}</p>
                  <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">ATS parse</p>
                </div>
                <div className="px-4">
                  <p className="text-2xl font-extrabold tracking-tight">{workspaceResult?.componentScores.recruiterClarity ?? "—"}</p>
                  <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">Clarity</p>
                </div>
                <div className="pl-4">
                  <p className="text-2xl font-extrabold tracking-tight">
                    {latest.roleMatch ?? "—"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">Role match</p>
                </div>
              </div>
              <p className="mt-6 text-sm leading-6 text-[var(--text-secondary)]">
                {workspaceResult
                  ? `${workspaceResult.findings.filter((finding) => finding.status === "open").length} open findings are linked to evidence in this resume.`
                  : "The score summary is available. Open the report to review its current processing state."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild size="sm">
                  <Link href={`/app/scans/${latest.id}`}>
                    Open report <ArrowRight aria-hidden="true" className="size-3.5" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/app/compare">Compare versions</Link>
                </Button>
              </div>
            </div>
          </div>

          <section className="mt-8" aria-labelledby="trend-title">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="trend-title" className="text-base font-extrabold">Score trend</h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Across saved scans for {latest.targetRole}
                </p>
              </div>
              <div className="flex rounded-full bg-[var(--surface-strong)] p-1" aria-label="Chart date range">
                {(["30", "90"] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setRange(value)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                      range === value ? "bg-white text-[var(--text)] shadow-sm" : "text-[var(--text-muted)]"
                    }`}
                    aria-pressed={range === value}
                  >
                    {value} days
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 h-56 w-full" role="img" aria-label="Score trend chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ left: -20, right: 6, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <YAxis domain={[40, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border-strong)" }} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fill="url(#trend-fill)"
                    activeDot={{ r: 5, fill: "var(--primary)", stroke: "white", strokeWidth: 3 }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <aside className="border-t border-[var(--border)] pt-7 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0" aria-label="Next actions">
          <div className="flex items-center gap-2">
            <Sparkles aria-hidden="true" className="size-4 text-[var(--primary)]" />
            <h2 className="text-base font-extrabold">Next best actions</h2>
          </div>
          {nextActions?.length ? (
            <ol className="mt-5 space-y-1">
              {nextActions.map((finding, index) => (
              <li key={finding.id}>
                <Link
                  href={`/app/scans/${latest.id}?tab=overview&findingId=${finding.id}`}
                  className="group flex items-start gap-3 rounded-xl py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--surface-strong)] text-[11px] font-extrabold text-[var(--primary)] group-hover:bg-[var(--success-soft)]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{finding.title}</span>
                    <span className="mt-0.5 block text-xs text-[var(--text-muted)]">+{finding.scoreImpact} points estimated</span>
                  </span>
                  <ChevronRight className="mt-1 size-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
              Open the report to review available evidence and recommendations.
            </p>
          )}
          <div className="mt-7 border-t border-[var(--border)] pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold">
                {planName} plan{isDemo ? " preview" : ""}
              </p>
              <p className="text-xs font-bold text-[var(--text-muted)]">
                {Math.min(quota.used, quota.limit)} of {quota.limit} scans
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-strong)]">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{
                  width: `${Math.min(100, (quota.used / quota.limit) * 100)}%`,
                }}
              />
            </div>
            <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
              <Link href="/app/billing">See plan options</Link>
            </Button>
          </div>
        </aside>
      </section>

      <section className="border-t border-[var(--border)] pt-8" aria-labelledby="recent-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="recent-title" className="text-xl font-extrabold tracking-[-0.025em]">Recent scans</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Your latest role-specific checks and status.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/app/history">View history <ArrowRight className="size-3.5" /></Link>
          </Button>
        </div>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]/70 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-5 py-3">Resume and target</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Overall</th>
                <th className="px-5 py-3">Role match</th>
                <th className="px-5 py-3">Status</th>
                <th className="w-14 px-3 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleScans.map((scan) => (
                <tr key={scan.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]/50">
                  <td className="px-5 py-4">
                    <Link href={`/app/scans/${scan.id}`} className="font-bold hover:text-[var(--primary)]">
                      {scan.resumeName}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{scan.targetRole}{scan.company ? ` · ${scan.company}` : ""}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">{formatDate(scan.createdAt)}</td>
                  <td className="px-5 py-4"><strong>{scan.overallScore}</strong><span className="text-xs text-[var(--text-muted)]"> /100</span></td>
                  <td className="px-5 py-4 text-sm font-bold">{scan.roleMatch ?? "Not scored"}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[11px] font-bold capitalize text-[var(--primary)]">
                      {scan.status}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <Link
                      href={`/app/scans/${scan.id}`}
                      aria-label={`Open ${scan.resumeName} report`}
                      className="grid size-9 place-items-center rounded-full hover:bg-[var(--surface-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                    >
                      <MoreHorizontal className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
        {[
          { icon: FileText, value: String(workspaceScans.length), label: "Completed scans", href: "/app/history" },
          { icon: Target, value: String(new Set(workspaceScans.map((scan) => scan.targetRole)).size), label: "Role targets", href: "/app/jobs" },
          {
            icon: TrendingUp,
            value: scoreChange === null ? "—" : `${scoreChange >= 0 ? "+" : ""}${scoreChange}`,
            label: "Points improved",
            href: "/app/compare",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href} className="flex items-center gap-4 bg-white px-5 py-5 hover:bg-[var(--surface-muted)]">
              <Icon className="size-5 text-[var(--primary)]" />
              <span>
                <strong className="block text-xl">{item.value}</strong>
                <span className="text-xs text-[var(--text-muted)]">{item.label}</span>
              </span>
              <ChevronRight className="ml-auto size-4 text-[var(--text-muted)]" />
            </Link>
          );
        })}
      </section>
      <p className="mt-5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <CalendarClock className="size-3.5" />
        {isDemo
          ? "Demo workspace data is deterministic and stored locally. It does not represent a hiring outcome."
          : "Scores are heuristic estimates and cannot guarantee ATS acceptance, interviews, or employment."}
      </p>
    </div>
  );
}
